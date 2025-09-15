import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ICONS } from '../../constants';
import * as n8n from '../../services/n8nService';
import { ChatMessage } from '../../types';
import SubPageHeader from '../../components/SubPageHeader';

// FIX: Cast motion.div to 'any' to work around a probable type conflict with React/Framer Motion versions.
const MotionDiv = motion.div as any;

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-1 p-2">
        <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
        <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
        <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
    </div>
);interface MessageBubbleProps {
  msg: ChatMessage;
}


const MessageBubble: React.FC<MessageBubbleProps> = ({ msg }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(msg.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            {msg.role === 'assistant' && (
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center text-brand-accent">🤖</span>
            )}
            <div className={`group relative p-3 rounded-xl max-w-[85%] text-sm break-words ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-dark-bg text-dark-text'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.role === 'assistant' && !msg.isLoading && (
                    <button onClick={handleCopy} className="absolute -top-2 -right-2 p-1 bg-dark-border text-dark-text-secondary rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        {copied ? ICONS.check : ICONS.copy}
                    </button>
                )}
            </div>
            {msg.role === 'user' && (
                 <span className="flex-shrink-0 w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center text-dark-text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
            )}
        </MotionDiv>
    );
};

const SuggestedPrompts: React.FC<{ onPromptClick: (prompt: string) => void }> = ({ onPromptClick }) => {
    const prompts = [
        "How do I set up the Sales AI?",
        "Explain the Lead Generation workflow.",
        "Where can I find my billing information?",
        "How do I train the Customer Support AI?"
    ];

    return (
        <div className="p-4 bg-dark-bg/50 rounded-lg animate-fade-in">
            <p className="text-sm font-semibold text-white mb-3">Not sure where to start? Try one of these:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {prompts.map(prompt => (
                    <button key={prompt} onClick={() => onPromptClick(prompt)} className="text-left text-sm p-2 bg-dark-border/50 hover:bg-dark-border rounded-md transition-colors">
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
};

const SupportChatPage: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', text: "Hello! I'm your AI Support Assistant. How can I help you with the Zulari platform today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const handleSendMessage = async (prompt?: string) => {
        const messageText = (prompt || input).trim();
        if (!messageText || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await n8n.chatWithAIAssistant(messageText);
            const aiMessage: ChatMessage = { role: 'assistant', text: res.output };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Failed to get AI response:", error);
            const errorMessage: ChatMessage = { role: 'assistant', text: "Sorry, I encountered an error. Please try again or contact our support team directly." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClearChat = () => {
        setMessages([
            { role: 'assistant', text: "Hello! I'm your AI Support Assistant. How can I help you with the Zulari platform today?" }
        ]);
    };

    const ChatActions = (
        <button onClick={handleClearChat} className="flex items-center gap-2 bg-dark-card hover:bg-dark-border text-dark-text-secondary font-semibold py-2 px-4 rounded-lg transition-colors border border-dark-border text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Clear Chat</span>
        </button>
    );

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto pb-16 sm:pb-8">
            <SubPageHeader title="AI Support Chat" icon={ICONS.chat} actions={ChatActions} />
            
            <div className="flex-grow bg-dark-card border border-dark-border rounded-xl mt-6 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    <AnimatePresence>
                        {messages.length === 1 && !isLoading && <SuggestedPrompts onPromptClick={handleSendMessage} />}
                    </AnimatePresence>
                    {messages.map((msg, index) => <MessageBubble key={index} msg={msg} />)}
                    {isLoading && (
                        <MotionDiv initial={{ opacity: 0, y:10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 justify-start">
                             <span className="flex-shrink-0 w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center text-brand-accent">🤖</span>
                            <div className="p-3 rounded-xl bg-dark-bg text-dark-text">
                                <TypingIndicator />
                            </div>
                        </MotionDiv>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-2 sm:p-4 border-t border-dark-border flex-shrink-0 bg-dark-card rounded-b-xl">
                    <div className="flex items-end gap-2 bg-dark-bg rounded-lg border border-dark-border focus-within:ring-2 focus-within:ring-brand-primary transition-all">
                         <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                            placeholder="Ask a question about using the platform..."
                            className="flex-1 bg-transparent p-3 text-sm resize-none focus:outline-none max-h-40 overflow-y-auto"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button 
                            onClick={() => handleSendMessage()}
                            disabled={isLoading || !input.trim()}
                            className="bg-brand-primary text-white p-3 m-1 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center self-end"
                            aria-label="Send message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportChatPage;