import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useVoicePlayback } from './hooks/useVoicePlayback';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import ChatArea from './components/ChatArea';
import MicButton from './components/MicButton';
import Orb, { OrbState } from './components/Orb';
import ParticlesCanvas from './components/ParticlesCanvas';
import ChatPanel from './components/ChatPanel';
import { WAKE_WORD } from './constants';

const App: React.FC = () => {
  const [amplitude, setAmplitude] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [handsFreeMode, setHandsFreeMode] = useState(true);
  const [inputLevel, setInputLevel] = useState(0);
  const [appError, setAppError] = useState<string | null>(null);
  
  const { messages, sendMessage, isLoading, error: playbackError, isPlaying, stopPlayback, clearMessages } = useVoicePlayback(setAmplitude);

  const justManuallyStopped = useRef(false);

  const handleTranscriptionResult = useCallback((text: string) => {
    if (text && !text.toLowerCase().includes(WAKE_WORD)) {
      setInterimTranscript(text);
    } else {
       console.log("Ignoring wake word in transcript.");
    }
  }, []);

  const { 
    isActive, 
    isRecording, 
    isProcessing, 
    error: pttError, 
    start, 
    stop 
  } = useSpeechRecognition(handleTranscriptionResult, {
      autoRestart: handsFreeMode,
      onInputLevel: setInputLevel,
  });

  const handleSend = useCallback((text: string, file?: File) => {
    if (isActive) {
      stop(); // Stop listening session when a message is sent
    }
    sendMessage(text, file);
    setInterimTranscript('');
  }, [sendMessage, isActive, stop]);

  const handleMicToggle = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      if (isActive) stop();
      return;
    }
    
    if (isActive) {
      justManuallyStopped.current = true;
      stop();
    } else {
      justManuallyStopped.current = false;
      start();
    }
  }, [isActive, isPlaying, start, stop, stopPlayback]);

  // Keyboard shortcut for spacebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        handleMicToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMicToggle]);
  
  // Effect to manage hands-free session lifecycle
  useEffect(() => {
    // Stop recording if AI becomes active or hands-free is turned off
    if (isActive && (!handsFreeMode || isLoading || isPlaying)) {
      stop();
    }
    // Start recording if in hands-free, AI is idle, and not already active
    else if (handsFreeMode && !isLoading && !isPlaying && !isActive) {
      if (justManuallyStopped.current) {
        // Don't auto-restart if user just manually stopped. Reset for next time.
        justManuallyStopped.current = false;
        return;
      }
      const timer = setTimeout(() => start(), 500); // Add a small delay for smoother transition
      return () => clearTimeout(timer);
    }
  }, [handsFreeMode, isLoading, isPlaying, isActive, start, stop]);


  // Low input error
  useEffect(() => {
    let timer: number;
    if (isRecording && inputLevel < 0.001) {
      timer = window.setTimeout(() => setAppError('No audio input detected. Check mic mute or volume.'), 3000);
    } else if (appError === 'No audio input detected. Check mic mute or volume.') {
      setAppError(null);
    }
    return () => clearTimeout(timer);
  }, [isRecording, inputLevel, appError]);


  const orbState: OrbState = useMemo(() => {
    if (appError || playbackError || pttError) return 'error';
    if (isPlaying) return 'speaking';
    if (isRecording) return 'listening';
    if (isLoading || isProcessing) return 'processing';
    return 'idle';
  }, [appError, playbackError, pttError, isPlaying, isRecording, isLoading, isProcessing]);

  const combinedError = appError || playbackError || pttError;
  const isMicDisabled = (isLoading || isProcessing) && !isPlaying;

  const handleReset = () => {
    if (window.confirm("Are you sure you want to end the session and clear the conversation history?")) {
        stop();
        stopPlayback();
        clearMessages();
        setInterimTranscript('');
        setAppError(null);
    }
  }
  
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  return (
    <div className="h-screen w-full font-sans text-[#E6EEF6] relative overflow-hidden bg-[#0A0F1E] flex flex-col">
        
      <ParticlesCanvas density={isMobile ? 0.000075 : 0.00015} />

      <div className="absolute top-4 left-4 z-30 flex items-center gap-4">
        <button onClick={handleReset} className="px-3 py-1 text-xs bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors">
            End Session
        </button>
        <div className="flex items-center gap-2">
            <label htmlFor="hands-free-toggle" className="text-xs text-white/60">Hands-Free</label>
            <button
                id="hands-free-toggle"
                role="switch"
                aria-checked={handsFreeMode}
                onClick={() => {
                  setHandsFreeMode(!handsFreeMode);
                  justManuallyStopped.current = false; // Reset manual stop on mode toggle
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${handsFreeMode ? 'bg-cyan-500' : 'bg-gray-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${handsFreeMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row-reverse min-h-0">
        {/* Orb Container */}
        <main className="flex-1 relative flex flex-col items-center justify-center z-10 w-full px-4 pointer-events-none">
          <Orb state={orbState} amplitude={amplitude} size={isMobile ? 160 : 280} />
        </main>
        
        {/* Chat & Controls Container */}
        <aside className="
          flex flex-col z-20 pointer-events-auto
          md:w-full md:max-w-sm md:h-full 
          max-h-[45vh] md:max-h-full
          md:border-r md:border-white/10
          bg-gradient-to-t from-[#0A0F1E] via-[#0A0F1E] to-transparent md:from-transparent md:via-transparent
        ">
            <div className="flex-1 min-h-0 px-6 md:pt-20">
                <ChatArea
                    messages={messages}
                    error={combinedError}
                />
            </div>
            <footer className="w-full p-6 pt-2 flex flex-col justify-center items-center gap-4 flex-shrink-0">
                <ChatPanel 
                    interim={interimTranscript}
                    onSend={handleSend}
                    disabled={isRecording || isProcessing || isLoading || isPlaying}
                />
                <MicButton 
                    isListening={isRecording}
                    onToggle={handleMicToggle}
                    disabled={isMicDisabled}
                    isLoading={isLoading || isProcessing}
                    isPlaying={isPlaying}
                />
            </footer>
        </aside>
      </div>
      
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;