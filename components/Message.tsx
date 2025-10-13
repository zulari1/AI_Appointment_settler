import React from 'react';
import type { ChatMessage } from '../types';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.who === 'user';
  
  return (
    <div className={`flex animate-fadeInUp ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs px-4 py-3 rounded-2xl font-sans text-sm ${isUser ? 'bg-[#007BFF] text-[#E6EEF6] rounded-br-none' : 'bg-transparent border border-[#00FFFF]/30 text-[#E6EEF6] rounded-bl-none'}`}>
        <p className="whitespace-pre-wrap">{message.text}</p>
        <div className="text-[10px] text-[#A8B3C3]/60 mt-2 text-right font-mono">
          {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default Message;