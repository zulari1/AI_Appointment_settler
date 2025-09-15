import React, { useState, useRef, useEffect } from "react";
import { ICONS } from '../constants';
import { VITE_WEBHOOK_AI_ASSISTANT } from "../env";

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "👋 Hi, I’m your AI Assistant. Tell me your goal or challenge, and I’ll help you step by step." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
        setTimeout(scrollToBottom, 100);
    }
  }, [open, messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    
    const userMessage = { role: "user", text: currentInput };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput("");

    try {
      const res = await fetch(VITE_WEBHOOK_AI_ASSISTANT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, email: "user@example.com" })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      const aiText = Array.isArray(data) && data.length > 0 && data[0].output
        ? data[0].output
        : "⚠️ Could not parse response from AI.";

      setMessages(prev => [...prev, { role: "ai", text: aiText }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "ai", text: "⚠️ Error connecting to AI Assistant." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-80 sm:w-96 h-[500px] bg-dark-card border border-dark-border rounded-2xl shadow-2xl flex flex-col animate-fade-in">
          {/* Header */}
          <div className="bg-dark-bg p-4 rounded-t-2xl flex justify-between items-center border-b border-dark-border flex-shrink-0">
            <span className="font-bold text-white">AI Assistant</span>
            <button onClick={() => setOpen(false)} className="text-dark-text-secondary hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                    className={`p-3 rounded-xl max-w-[85%] ${
                    msg.role === "ai" ? "bg-dark-bg text-dark-text" : "bg-brand-primary text-white"
                    }`}
                >
                    {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="p-3 rounded-xl max-w-[85%] bg-dark-bg text-dark-text">
                        <div className="flex items-center gap-2">
                           <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                           <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                           <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <div className="p-3 border-t border-dark-border flex gap-2 flex-shrink-0">
            <input
              className="flex-1 bg-dark-bg border border-dark-border rounded-lg p-2 text-sm text-dark-text placeholder-dark-text-secondary focus:ring-2 focus:ring-brand-primary focus:outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={isLoading}
            />
            <button className="bg-brand-primary text-white p-2 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center" onClick={sendMessage} disabled={isLoading || !input.trim()}>
              {React.cloneElement(ICONS.rocket, { className: "h-5 w-5" })}
            </button>
          </div>
        </div>
      ) : (
        <button
          className="bg-brand-primary text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform animate-pulse"
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </button>
      )}
    </div>
  );
}