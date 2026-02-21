import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex space-x-1.5 items-center bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-4 w-fit shadow-sm h-[46px] transition-colors duration-200">
      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce"></div>
    </div>
  );
};