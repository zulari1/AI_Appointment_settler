// hooks/usePushToTalkAdvanced.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadAudioForTranscription } from '../services/transcribeProxy';
import { sanitizeTranscript } from '../services/utils';

type Options = {
  silenceThreshold?: number;      // RMS threshold (0..1)
  silenceWindowMs?: number;       // how long silence must persist to stop (ms)
  minBlobSize?: number;           // bytes threshold to ignore tiny blobs
  autoRestart?: boolean;          // Should the listening loop restart automatically?
  autoRestartDelayMs?: number;    // after a transcription finishes, how long before listening again
  transcribeTimeoutMs?: number;   // timeout to abort the transcription request
  maxRetries?: number;            // transcribe retry attempts
  adaptiveThreshold?: boolean;    // auto-calibrate ambient noise
  idleTimeoutMs?: number;         // how long of inactivity before the session stops
};

export function usePushToTalkAdvanced(onResult: (text: string) => void, opts?: Options) {
  const {
    silenceThreshold = 0.02,
    silenceWindowMs = 1200, // Adjusted to 1.2s as per new spec
    minBlobSize = 1500, // Adjusted to 1.5kb to prevent noise sends
    autoRestart = false,
    autoRestartDelayMs = 350,
    transcribeTimeoutMs = 30000,
    maxRetries = 2,
    adaptiveThreshold = true,
    idleTimeoutMs = 10000,
  } = opts || {};

  const [isActive, setIsActive] = useState(false); // user toggled push-to-talk loop on/off
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

  // Adaptive noise baseline (established during first 800ms of recording)
  const noiseFloorRef = useRef<number | null>(null);
  const adaptiveSamplesRef = useRef<number>(0);

  // Utility: compute RMS from float32 array
  const rms = (arr: Float32Array) => {
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i] * arr[i];
    return Math.sqrt(s / arr.length);
  };

  const stop = useCallback((fromIdle = false) => {
    if (fromIdle && autoRestart) {
      console.log(`[PushToTalk] Idle timeout of ${idleTimeoutMs}ms reached. Stopping session.`);
    }
    setIsActive(false);
    isStoppingRef.current = true;
    try {
      abortControllerRef.current?.abort();
    } catch {}
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    if (autoRestartTimerRef.current) { window.clearTimeout(autoRestartTimerRef.current); autoRestartTimerRef.current = null; }
    if (idleTimeoutRef.current) { window.clearTimeout(idleTimeoutRef.current); idleTimeoutRef.current = null; }
    
    // Full cleanup
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
  }, [idleTimeoutMs, autoRestart]);

  // Internal: start one recording cycle (invoked after start or after auto rearm)
  const startRecordingCycle = useCallback(async () => {
    if (isRecording || isProcessing || !isActive) return;
    isStoppingRef.current = false;
    setError(null);

    // Set an idle timeout to automatically stop the session if it's an auto-restarting one.
    if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    if (autoRestart) {
      idleTimeoutRef.current = window.setTimeout(() => {
          if (isActive) stop(true);
      }, idleTimeoutMs) as unknown as number;
    }

    try {
      // request mic permissions / stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });
      streamRef.current = stream;

      // create audio graph for VAD
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
      source.connect(analyserRef.current);

      // prepare MediaRecorder (prefer opus webm)
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

        // tiny file guard
        if (!blob || blob.size < minBlobSize) {
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

        // send to STT
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
          } catch (err) {
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
          autoRestartTimerRef.current = window.setTimeout(() => {
            if (isActive && !isStoppingRef.current) startRecordingCycle().catch(()=>{});
          }, autoRestartDelayMs) as unknown as number;
        } else {
          stop();
        }
      };

      mr.start();
      setIsRecording(true);

      const buf = new Float32Array(analyserRef.current.fftSize);
      let silenceStart: number | null = null;
      let calibrationSamples = 0;
      const calibrationWindowSamples = 6;
      noiseFloorRef.current = noiseFloorRef.current ?? null;
      adaptiveSamplesRef.current = adaptiveSamplesRef.current ?? 0;

      const vadLoop = () => {
        if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
        analyserRef.current.getFloatTimeDomainData(buf);
        const level = rms(buf);

        if (adaptiveThreshold && calibrationSamples < calibrationWindowSamples) {
          adaptiveSamplesRef.current = (adaptiveSamplesRef.current || 0) + 1;
          noiseFloorRef.current = (noiseFloorRef.current || 0) * (1 - 1 / (adaptiveSamplesRef.current)) + level * (1 / (adaptiveSamplesRef.current));
          calibrationSamples += 1;
        }

        const effectiveThreshold = (adaptiveThreshold && noiseFloorRef.current != null)
          ? Math.max(silenceThreshold, noiseFloorRef.current * 1.7)
          : silenceThreshold;

        if (level > effectiveThreshold) {
          silenceStart = null;
          if (idleTimeoutRef.current) {
            window.clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = null;
          }
        } else {
          if (silenceStart == null) silenceStart = Date.now();
          else if (Date.now() - silenceStart >= silenceWindowMs) {
            try { mediaRecorderRef.current?.stop(); } catch (e) { console.warn('mediaRecorder stop failed', e); }
            return;
          }
        }

        requestAnimationFrame(vadLoop);
      };

      requestAnimationFrame(vadLoop);
    } catch (err: any) {
      console.error('startRecordingCycle/getUserMedia error', err);
      setError(err?.message || 'Microphone error');
      if (isActive) {
          stop();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, silenceThreshold, silenceWindowMs, minBlobSize, transcribeTimeoutMs, maxRetries, adaptiveThreshold, autoRestart, idleTimeoutMs, stop]);

  // Public API
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
