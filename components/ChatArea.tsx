import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import Message from './Message';

interface ChatAreaProps {
  messages: ChatMessage[];
  error: string | null;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, error }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      // Always scroll to bottom smoothly when messages update
      node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Create message nodes with date dividers
  const messageNodes: React.ReactNode[] = [];
  let lastDate: string | null = null;

  messages.forEach((msg) => {
    const messageDate = new Date(msg.ts);
    const dateString = messageDate.toDateString();

    if (dateString !== lastDate) {
      messageNodes.push(
        <div key={`date-${dateString}`} className="relative text-center py-4 animate-fadeInUp">
          <span className="absolute top-1/2 left-0 w-full h-px bg-white/10"></span>
          <span className="relative bg-[#0A0F1E] px-3 text-xs text-white/40 font-mono">
            {messageDate.toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      );
    }
    messageNodes.push(<Message key={msg.id} message={msg} />);
    lastDate = dateString;
  });

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      className="h-full w-full space-y-5 overflow-y-auto overscroll-contain pointer-events-auto pr-2"
    >
      {messageNodes}
      {error && <div className="text-sm text-[#FF4D5A] p-3 text-center font-mono">{error}</div>}
      <div className="h-px" />
    </div>
  );
};

export default ChatArea;
