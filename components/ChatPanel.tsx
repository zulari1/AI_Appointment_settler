import React, { useState, useEffect, useRef } from 'react';

interface Props {
  interim?: string;
  onSend: (text: string, file?: File) => void;
  disabled?: boolean;
  autoSendTimeout?: number; // ms
}

export default function ChatPanel({ interim = '', onSend, disabled=false, autoSendTimeout = 2000 }: Props) {
  const [text, setText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!interim) {
      setShowPreview(false);
      return;
    };

    setPreviewText(interim);
    setShowPreview(true);
    
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onSend(interim, selectedFile ?? undefined);
      setShowPreview(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, autoSendTimeout);
    
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [interim, onSend, autoSendTimeout, selectedFile]);

  const handleManualSend = () => {
    const textToSend = showPreview ? previewText : text.trim();
    if (textToSend || selectedFile) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        onSend(textToSend, selectedFile ?? undefined);
        setShowPreview(false);
        setText('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setShowPreview(false);
    setPreviewText('');
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSend();
    }
  };

  const canSend = !disabled && ((text.trim().length > 0 || !!selectedFile) || (showPreview && (previewText.length > 0 || !!selectedFile)));

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
      
      {selectedFile && !showPreview && (
        <div className="mb-2 p-2 rounded-md bg-white/5 text-xs text-white/70 flex justify-between items-center animate-fadeInUp">
          <span>Attached: {selectedFile.name}</span>
          <button onClick={() => {
            setSelectedFile(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
          }} className="text-red-400 hover:text-red-300">&times;</button>
        </div>
      )}


      <div className="flex gap-3 items-center">
        <input ref={fileInputRef} type="file" onChange={handleFilePick} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-lg bg-transparent border border-white/20 text-white/60 hover:text-white hover:border-white/40 disabled:opacity-50"
          aria-label="Attach file"
          disabled={disabled}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
        </button>
        <input
          aria-label="Message input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message or press space to talk..."
          className="flex-1 bg-transparent border border-white/20 px-4 py-3 rounded-lg placeholder-white/35 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button onClick={handleManualSend} className="px-4 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50" disabled={!canSend}>Send</button>
      </div>
    </div>
  );
}
