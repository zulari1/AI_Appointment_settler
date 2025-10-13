import React, { useState, useEffect } from 'react';

interface Props {
  interim?: string;
  onSend: (text: string) => void;
  disabled?: boolean;
  autoSendTimeout?: number; // ms
}

export default function ChatPanel({ interim = '', onSend, disabled=false, autoSendTimeout = 1000 }: Props) {
  const [text, setText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const timerRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (!interim) {
      setShowPreview(false);
      return;
    };

    setPreviewText(interim);
    setShowPreview(true);
    
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onSend(interim);
      setShowPreview(false);
    }, autoSendTimeout);
    
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [interim, onSend, autoSendTimeout]);

  const handleManualSend = () => {
    if (showPreview) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        onSend(previewText);
        setShowPreview(false);
    } else if (text.trim()) {
        onSend(text.trim());
        setText('');
    }
  };

  const handleCancelPreview = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setShowPreview(false);
    setPreviewText('');
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSend();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {showPreview && (
        <div className="mb-2 p-3 rounded-lg bg-gradient-to-br from-[#08212b] to-[#07121b] border border-cyan-600/30 shadow-inner animate-fadeInUp">
          <div className="flex items-start justify-between">
            <p className="text-sm text-white/80 break-words flex-1 pr-4">{previewText}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handleManualSend} className="px-2 py-1 bg-cyan-500/90 rounded text-xs font-semibold">Send</button>
              <button onClick={handleCancelPreview} className="px-2 py-1 bg-white/5 rounded text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <input
          aria-label="Message input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message or press space to talk..."
          className="flex-1 bg-transparent border border-white/20 px-4 py-3 rounded-lg placeholder-white/35 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button onClick={handleManualSend} className="px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50" disabled={disabled || (!text.trim() && !showPreview)}>Send</button>
      </div>
    </div>
  );
}
