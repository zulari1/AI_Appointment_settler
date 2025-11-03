import React from 'react';
import type { ChatMessage } from '../types';

const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.who === 'user';
  const speaker = isUser ? 'User' : 'Atlas';

  return (
    <div className="animate-fadeInUp text-sm text-[#E6EEF6]">
      <div className="flex items-start gap-4">
        <div className={`w-14 flex-shrink-0 text-right font-mono font-semibold ${isUser ? 'text-cyan-400/90' : 'text-white'}`}>
          {speaker}
        </div>
        <div className="flex-1 pt-0.5">
          <p className="leading-relaxed whitespace-pre-wrap font-sans break-words">
            {message.text}
          </p>
          <div className="text-[10px] text-white/40 mt-1.5 font-mono">
            {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
