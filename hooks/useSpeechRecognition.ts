// hooks/useSpeechRecognition.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadAudioForTranscription } from '../services/transcribeProxy';
import { sanitizeTranscript } from '../services/utils';

type Options = {
  silenceThreshold?: number;      
  silenceWindowMs?: number;       
  minBlobSize?: number;           
  autoRestart?: boolean;          
  autoRestartDelayMs?: number;    
  transcribeTimeoutMs?: number;   
  maxRetries?: number;            
  adaptiveThreshold?: boolean;    
  idleTimeoutMs?: number;         
  noiseSuppressionLevel?: 'low' | 'medium' | 'high' | 'off';
  minDurationMs?: number;         
  onInputLevel?: (level: number) => void;
};

export function useSpeechRecognition(onResult: (text: string) => void, opts?: Options) {
  const {
    silenceThreshold = 0.005,
    silenceWindowMs = 2500, 
    minBlobSize = 50,
    autoRestart = false,
    autoRestartDelayMs = 350,
    transcribeTimeoutMs = 30000,
    maxRetries = 2,
    adaptiveThreshold = true,
    idleTimeoutMs = 5000,
    noiseSuppressionLevel = 'medium',
    minDurationMs = 1500,
    onInputLevel,
  } = opts || {};

  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const autoRestartTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStoppingRef = useRef(false);
  const retriesRef = useRef(0);
  const idleTimeoutRef = useRef<number | null>(null);
  const noiseFloorRef = useRef<number | null>(null);
  const adaptiveSamplesRef = useRef<number>(0);
  const discardCountRef = useRef(0);
  const levelHistoryRef = useRef<number[]>([]);

  const rms = (arr: Float32Array) => {
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i] * arr[i];
    return Math.sqrt(s / arr.length);
  };

  const stop = useCallback((fromIdle = false) => {
    if (fromIdle) {
      console.log(`[SpeechRecognition] Entering sleep mode due to ${idleTimeoutMs}ms of silence.`);
    }
    setIsActive(false);
    isStoppingRef.current = true;
    try { abortControllerRef.current?.abort(); } catch {}
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    if (autoRestartTimerRef.current) { window.clearTimeout(autoRestartTimerRef.current); autoRestartTimerRef.current = null; }
    if (idleTimeoutRef.current) { window.clearTimeout(idleTimeoutRef.current); idleTimeoutRef.current = null; }
    
    try {
      if (analyserRef.current) analyserRef.current.disconnect();
      if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close().catch(()=>{});
      streamRef.current?.getTracks().forEach(t => t.stop());
    } catch {}
    
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
    silenceTimerRef.current = null;

    setIsRecording(false);
    setIsProcessing(false);
    discardCountRef.current = 0;
  }, [idleTimeoutMs]);

  const startRecordingCycle = useCallback(async () => {
    if (isRecording || isProcessing || !isActive) return;
    isStoppingRef.current = false;
    setError(null);

    if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    if (autoRestart) {
      idleTimeoutRef.current = window.setTimeout(() => {
          if (isActive) stop(true);
      }, idleTimeoutMs) as unknown as number;
    }

    try {
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const suppressionOff = noiseSuppressionLevel === 'off';
      const constraints = {
        audio: {
          echoCancellation: !suppressionOff,
          noiseSuppression: !suppressionOff,
          autoGainControl: !suppressionOff,
          sampleRate: isMobile ? 16000 : 48000,
          channelCount: 1,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
      source.connect(analyserRef.current);

      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        setIsRecording(false);
        
        const cleanupMicResources = () => {
            const currentStream = streamRef.current;
            streamRef.current = null;
            if (currentStream) currentStream.getTracks().forEach(t => t.stop());
            if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close().catch(()=>{});
        };

        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' });
        chunksRef.current = [];

        if (blob.size < minBlobSize) {
          console.debug('Discarding blob smaller than minimum viable size', { size: blob.size });
          discardCountRef.current++;
          cleanupMicResources();
          if (autoRestart && isActive) {
            autoRestartTimerRef.current = window.setTimeout(() => {
              if (isActive && !isStoppingRef.current) startRecordingCycle().catch(()=>{});
            }, autoRestartDelayMs) as unknown as number;
          } else {
             stop();
          }
          return;
        }

        setIsProcessing(true);
        abortControllerRef.current = new AbortController();
        retriesRef.current = 0;
        let lastError: any = null;

        while (retriesRef.current <= maxRetries) {
          try {
            const timeoutId = window.setTimeout(() => {
              abortControllerRef.current?.abort();
            }, transcribeTimeoutMs);

            const rawTranscript = await uploadAudioForTranscription(blob, 'speech.webm');
            window.clearTimeout(timeoutId);

            const transcript = sanitizeTranscript(rawTranscript);

            if (transcript && transcript !== lastTranscript) {
              setLastTranscript(transcript);
              onResult(transcript);
            } else {
              console.debug('No new transcript or duplicate/invalid', transcript);
            }

            lastError = null;
            break; // success
          } catch (err: any) {
            lastError = err;
            retriesRef.current += 1;
            console.warn('transcribe attempt failed, retry', retriesRef.current, err);
            await new Promise(res => setTimeout(res, 300 * Math.pow(2, retriesRef.current)));
            if (abortControllerRef.current?.signal?.aborted) break;
          } finally {
            abortControllerRef.current = null;
          }
        }

        if (lastError) {
          console.error('Transcription failed after retries', lastError);
          setError('Transcription failed. Please check your connection.');
        }

        setIsProcessing(false);
        cleanupMicResources();

        if (autoRestart && isActive && !isStoppingRef.current) {
          const delay = autoRestartDelayMs + (discardCountRef.current * 500);
          autoRestartTimerRef.current = window.setTimeout(() => {
            if (isActive && !isStoppingRef.current) startRecordingCycle().catch(()=>{});
          }, delay) as unknown as number;
        } else {
          stop();
        }
      };

      mr.start();
      setIsRecording(true);

      const buf = new Float32Array(analyserRef.current.fftSize);
      let silenceStart: number | null = null;
      let isMinDurationPassed = false;
      const minTimer = setTimeout(() => isMinDurationPassed = true, minDurationMs);
      noiseFloorRef.current = null;
      adaptiveSamplesRef.current = 0;

      const vadLoop = () => {
        if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
        analyserRef.current.getFloatTimeDomainData(buf);
        const level = rms(buf);

        if (adaptiveThreshold && adaptiveSamplesRef.current < 10) {
          adaptiveSamplesRef.current += 1;
          noiseFloorRef.current = (noiseFloorRef.current || 0) * (1 - 1 / adaptiveSamplesRef.current) + level * (1 / adaptiveSamplesRef.current);
        }

        const effectiveThreshold = (adaptiveThreshold && noiseFloorRef.current != null)
          ? noiseFloorRef.current * 1.5 + 0.01
          : silenceThreshold;
        
        levelHistoryRef.current.push(level);
        if (levelHistoryRef.current.length > 5) levelHistoryRef.current.shift();
        const avgLevel = levelHistoryRef.current.reduce((a, b) => a + b, 0) / levelHistoryRef.current.length;
        onInputLevel?.(avgLevel);

        if (level > effectiveThreshold) {
          silenceStart = null;
          if (idleTimeoutRef.current) {
            window.clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = null;
          }
        } else {
          if (silenceStart == null) silenceStart = Date.now();
          else if (Date.now() - silenceStart >= silenceWindowMs && isMinDurationPassed) {
            try { mediaRecorderRef.current?.stop(); } catch (e) { console.warn('mediaRecorder stop failed', e); }
            clearTimeout(minTimer);
            return;
          }
        }

        requestAnimationFrame(vadLoop);
      };

      requestAnimationFrame(vadLoop);
    } catch (err: any) {
      console.error('startRecordingCycle/getUserMedia error', err);
      setError(err?.message || 'Microphone access denied or error. Please grant permissions.');
      if (isActive) {
          stop();
      }
    }
  }, [isActive, silenceThreshold, silenceWindowMs, minBlobSize, transcribeTimeoutMs, maxRetries, adaptiveThreshold, autoRestart, idleTimeoutMs, stop, autoRestartDelayMs, minDurationMs, noiseSuppressionLevel, onInputLevel, onResult, lastTranscript]);

  const start = useCallback(() => {
    if (isActive) return;
    setIsActive(true);
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      startRecordingCycle().catch(()=>{});
    }
  }, [isActive, startRecordingCycle]);


  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);
  
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && isActive) stop(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, stop]);

  return {
    isActive,
    isRecording,
    isProcessing,
    lastTranscript,
    error,
    start,
    stop,
  };
}