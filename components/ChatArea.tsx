import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import Message from './Message';

interface ChatAreaProps {
  messages: ChatMessage[];
  error: string | null;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, error }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div role="log" aria-live="polite" className="absolute top-0 right-0 h-full w-full max-w-sm p-6 space-y-4 overflow-y-auto flex flex-col justify-end bg-gradient-to-l from-[#0A0F1E] via-[#0A0F1E]/80 to-transparent">
       <div className="flex-1" />
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {error && <div className="text-sm text-[#FF4D5A] p-3 text-center font-mono">{error}</div>}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatArea;