import React from 'react';
import type { ChatMessage } from '../types';
import { AIAvatar } from './Icons';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isAI = message.sender === 'ai';

  return (
    <div className={`flex items-end gap-3 animate-fade-in ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && <AIAvatar />}
      <div className={`w-full max-w-lg p-4 rounded-2xl shadow-md backdrop-blur-md border border-white/10 ${isAI ? 'bg-white/10 text-gray-200 rounded-bl-none' : 'bg-blue-600/70 text-white rounded-br-none'}`}>
        <p className="text-sm sm:text-base whitespace-pre-wrap font-sans">{message.text}</p>
        {isAI && message.preview && (
            <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-blue-300 opacity-90 italic">
                    💡 <span className="font-semibold">Blueprint Note:</span> {message.preview}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;