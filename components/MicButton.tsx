import React from 'react';

interface Props {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  isPlaying?: boolean; // New prop to indicate audio playback
}

const MicButton: React.FC<Props> = ({ isListening, onToggle, disabled, isLoading, isPlaying }) => {

  const handleClick = () => {
    // Provide haptic feedback on mobile devices
    if (navigator.vibrate) {
        navigator.vibrate(40);
    }
    onToggle();
  };
  
  // Interrupt state takes precedence
  if (isPlaying) {
    return (
      <button
        onClick={handleClick}
        aria-label="Interrupt playback"
        className="w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 bg-rose-600/90 border border-rose-400/50 shadow-lg shadow-rose-900/50"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isListening}
      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isListening ? 'scale-110' : 'hover:scale-105'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      aria-label={isLoading ? "Processing..." : isListening ? 'Stop recording' : 'Start recording'}
      style={{
        background: isListening ? 'radial-gradient(circle at 40% 30%, rgba(0,255,255,0.24), rgba(0,0,0,0.65))' : 'linear-gradient(180deg, rgba(0,255,255,0.06), rgba(0,0,0,0.65))',
        border: `1px solid ${isListening ? 'rgba(0,255,255,0.4)' : 'rgba(0,255,255,0.18)'}`,
        boxShadow: isListening ? '0 8px 28px rgba(0,255,255,0.2)' : '0 6px 24px rgba(0,0,0,0.3)'
      }}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-7 w-7 text-cyan-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#00FFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#00FFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
};

export default MicButton;
