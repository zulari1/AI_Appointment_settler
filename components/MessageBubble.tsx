import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isPlaying = false, 
  onPlay, 
  onPause 
}) => {
  const isAssistant = message.role === 'assistant';

  // Highlight dates and times using regex
  const formatContent = (text: string) => {
    // Regex for basic date/time patterns (simplified)
    const timeRegex = /(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?)/g;
    const dateRegex = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/g;
    
    // This is a basic implementation. For production, consider a robust parser or library.
    const parts = text.split(timeRegex);
    return parts.map((part, i) => {
        if (timeRegex.test(part) || dateRegex.test(part)) {
            return <span key={i} className="font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/50 px-1 rounded">{part}</span>;
        }
        return part;
    });
  };

  if (!isAssistant) {
    return (
      <div className="flex justify-end mb-4 animate-fade-in-up">
        <div className="bg-brand-600 dark:bg-brand-600 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] shadow-sm">
          <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-fade-in-up group">
      <div className="flex-shrink-0 mr-3 mt-1">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
           <i className="fas fa-robot text-white text-xs sm:text-sm"></i>
        </div>
      </div>
      <div className="max-w-[85%] space-y-2">
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm relative transition-colors duration-200">
           {/* Header with name and audio controls */}
           <div className="flex items-center justify-between mb-1">
             <span className="text-xs font-bold text-brand-600 dark:text-brand-400">Atlas</span>
             {message.audioBase64 && (
               <button 
                 onClick={isPlaying ? onPause : onPlay}
                 className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus:outline-none"
                 title={isPlaying ? "Pause audio" : "Play audio"}
               >
                 <i className={`fas ${isPlaying ? 'fa-volume-high animate-pulse' : 'fa-volume-off'}`}></i>
               </button>
             )}
           </div>
           
           <p className="text-sm sm:text-base text-gray-800 dark:text-slate-200 leading-relaxed">
             {formatContent(message.content)}
           </p>
        </div>
        
        {/* Optional Image */}
        {message.imageUrl && (
            <div className="mt-2 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-slate-700 max-w-xs">
                <img src={message.imageUrl} alt="Shared by Atlas" className="w-full h-auto object-cover" />
            </div>
        )}
      </div>
    </div>
  );
};