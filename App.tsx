import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useChatManager } from './hooks/useChatManager';
import { usePushToTalkAdvanced } from './hooks/usePushToTalkAdvanced';
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
  
  const { messages, sendMessage, isLoading, error, isPlaying, stopPlayback, clearMessages } = useChatManager(setAmplitude);

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
  } = usePushToTalkAdvanced(handleTranscriptionResult, {
      autoRestart: handsFreeMode,
      idleTimeoutMs: 10000,
  });

  const handleSend = useCallback((text: string) => {
    sendMessage(text);
    setInterimTranscript('');
  }, [sendMessage]);

  const handleMicToggle = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      if (isActive) stop();
      return;
    }
    
    if (isActive) {
      stop();
    } else {
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
  
  const orbState: OrbState = useMemo(() => {
    if (error || pttError) return 'error';
    if (isPlaying) return 'speaking';
    if (isRecording) return 'listening';
    if (isLoading || isProcessing) return 'processing';
    return 'idle';
  }, [error, pttError, isPlaying, isRecording, isLoading, isProcessing]);

  const combinedError = error || pttError;
  const isMicDisabled = (isLoading || isProcessing) && !isPlaying;

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear the conversation history?")) {
        stop();
        stopPlayback();
        clearMessages();
        setInterimTranscript('');
    }
  }

  return (
    <div className="min-h-screen w-full font-sans text-[#E6EEF6] flex flex-col items-center justify-center relative overflow-hidden bg-[#0A0F1E]">
        
      <ParticlesCanvas />

      <div className="absolute top-4 left-4 z-30 flex items-center gap-4">
        <button onClick={handleReset} className="px-3 py-1 text-xs bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-colors">
            Reset Chat
        </button>
        <div className="flex items-center gap-2">
            <label htmlFor="hands-free-toggle" className="text-xs text-white/60">Hands-Free</label>
            <button
                id="hands-free-toggle"
                role="switch"
                aria-checked={handsFreeMode}
                onClick={() => setHandsFreeMode(!handsFreeMode)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${handsFreeMode ? 'bg-cyan-500' : 'bg-gray-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${handsFreeMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
        </div>
      </div>


      <ChatArea
        messages={messages}
        error={combinedError}
      />

      <main className="flex-1 flex flex-col items-center justify-center z-10 w-full px-4">
        <Orb state={orbState} amplitude={amplitude} size={window.innerWidth < 768 ? 160 : 280} />
      </main>

      <footer className="w-full p-6 flex flex-col justify-center items-center gap-4 z-20">
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