// services/audioService.ts
export interface AudioControl {
  promise: Promise<void>;
  stop: () => void;
}

export function playAudioFromUrl(url: string): AudioControl {
  let audio: HTMLAudioElement | null = new Audio(url);
  let rejectPromise: (reason?: any) => void;

  const promise = new Promise<void>((resolve, reject) => {
    rejectPromise = reject;
    if (!audio) {
      return reject(new Error('Audio element not available'));
    }
    audio.onended = () => {
      audio = null;
      resolve();
    };
    audio.onerror = (e) => {
      audio = null;
      reject(new Error('Audio playback failed'));
    };

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch((err) => {
        // Autoplay blocked or other issue
        audio = null;
        reject(err);
      });
    }
  });

  const stop = () => {
    if (audio) {
      audio.pause();
      audio.src = '';
      audio = null;
      if (rejectPromise) {
        rejectPromise(new Error('Playback interrupted'));
      }
    }
  };

  return { promise, stop };
}

export function playBase64Wave(base64Str: string, onAmplitudeChange: (amplitude: number) => void): AudioControl {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  let source: AudioBufferSourceNode | null = null;
  let animationFrameId: number;
  let rejectPromise: (reason?: any) => void;

  const promise = new Promise<void>((resolve, reject) => {
    rejectPromise = reject;

    if (!base64Str) return reject(new Error("No base64 audio provided"));

    const cleaned = base64Str.includes(",") ? base64Str.split(",")[1] : base64Str;
    const binary = atob(cleaned);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

    audioCtx.decodeAudioData(
      bytes.buffer,
      (buffer) => {
        source = audioCtx.createBufferSource();
        source.buffer = buffer;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256; // Smaller FFT size for better time resolution
        const gainNode = audioCtx.createGain();
        
        source.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        source.onended = () => {
          cancelAnimationFrame(animationFrameId);
          onAmplitudeChange(0); // Reset amplitude
          source = null;
          try { audioCtx.close(); } catch (e) {}
          resolve();
        };

        source.start(0);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateAmplitude = () => {
          if (!analyser || !source) return;
          analyser.getByteTimeDomainData(dataArray);
          let sumSquares = 0.0;
          for (const amplitude of dataArray) {
            const val = (amplitude - 128) / 128.0;
            sumSquares += val * val;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          onAmplitudeChange(rms);
          animationFrameId = requestAnimationFrame(updateAmplitude);
        };
        updateAmplitude();
      },
      (err) => {
        console.error("decodeAudioData error", err);
        reject(err);
      }
    );
  });
  
  const stop = () => {
    cancelAnimationFrame(animationFrameId);
    onAmplitudeChange(0);
    if (source) {
      try { source.stop(); } catch(e) {}
    }
    if (rejectPromise) rejectPromise(new Error('Playback interrupted'));
  };

  return { promise, stop };
}