import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import Message from './Message';

interface ChatAreaProps {
  messages: ChatMessage[];
  error: string | null;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, error }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsgCount = useRef<number>(messages.length);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    // Auto-scroll only if user is near the bottom (e.g., within 80px)
    // This prevents disrupting the user if they've scrolled up to read history
    const isNearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 80;

    if (messages.length > lastMsgCount.current && isNearBottom) {
      node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    }
    lastMsgCount.current = messages.length;
  }, [messages]);

  // Create message nodes with date dividers
  const messageNodes: React.ReactNode[] = [];
  let lastDate: string | null = null;

  messages.forEach((msg) => {
    const messageDate = new Date(msg.ts);
    const dateString = messageDate.toDateString();

    if (dateString !== lastDate) {
      messageNodes.push(
        <div key={`date-${dateString}`} className="text-center text-xs text-white/40 font-mono py-4 animate-fadeInUp">
          {messageDate.toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
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
      className="h-full w-full space-y-4 overflow-y-auto overscroll-contain pointer-events-auto"
    >
      {messageNodes}
      {error && <div className="text-sm text-[#FF4D5A] p-3 text-center font-mono">{error}</div>}
      <div className="h-px" />
    </div>
  );
};

export default ChatArea;
