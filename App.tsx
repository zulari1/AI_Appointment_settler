import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; 
import { Lead, Message, WebhookPayload, AppointmentDetails } from './types';
import { postToWebhook } from './services/api';
import { LeadForm } from './components/LeadForm';
import { MessageBubble } from './components/MessageBubble';
import { Loader } from './components/ui/Loader';
import { AppointmentSummary } from './components/AppointmentSummary';
import { VoiceService, VoiceStatus } from './services/voiceService';

// Helper for unique IDs for messages (UI only)
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  // --- State ---
  const [sessionId] = useState(() => uuidv4()); // Persist session ID for the component's lifecycle
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [urlParams, setUrlParams] = useState<Record<string, string>>({});
  
  // Audio State
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Agent State
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('disconnected');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const voiceServiceRef = useRef<VoiceService | null>(null);

  // Appointment State
  const [isReadyToConfirm, setIsReadyToConfirm] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState<{datetime?: string, channel?: string}>({});

  // --- Initialization ---
  
  // Theme initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Parse URL Params
    const params = new URLSearchParams(window.location.search);
    const extractedParams: Record<string, string> = {};
    params.forEach((value, key) => {
      extractedParams[key] = value;
    });
    setUrlParams(extractedParams);

    const email = params.get('email');
    const name = params.get('name');
    const cid = params.get('cid');

    if (email && name) {
      const initialLead: Lead = { 
        email, 
        name, 
        cid: cid || undefined, 
        firstVisitTimestamp: Date.now() 
      };
      setLead(initialLead);
      // Pass extractedParams explicitly because state update is async/not visible in this closure immediately
      startSession(initialLead, extractedParams);
    }
    
    // Cleanup voice service on unmount
    return () => {
        if (voiceServiceRef.current) {
            voiceServiceRef.current.stopRecording();
        }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, liveTranscript]);

  // --- Logic ---

  const handleAudioEnd = () => {
    setCurrentAudioId(null);
  };

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentAudioId(null);
    }
  }, []);

  const playAudio = useCallback((source: string, messageId: string, isUrl: boolean = false) => {
    stopAudio(); // Stop any currently playing audio

    try {
      let url = source;
      
      if (!isUrl) {
          // It's base64, convert to blob url
          const binaryString = window.atob(source);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/wav' });
          url = URL.createObjectURL(blob);
      }
      
      const audio = new Audio(url);
      audio.onended = handleAudioEnd;
      
      audioRef.current = audio;
      
      // Intentional delay for realism
      setTimeout(() => {
        audio.play().catch(e => console.warn("Autoplay prevented:", e));
        setCurrentAudioId(messageId);
      }, 300);
      
    } catch (e) {
      console.error("Audio playback error", e);
    }
  }, [stopAudio]);

  // --- Voice Logic ---

  const toggleVoiceMode = async () => {
      if (voiceStatus === 'connected' || voiceStatus === 'connecting') {
          voiceServiceRef.current?.stopRecording();
          setIsVoiceActive(false);
          setLiveTranscript('');
      } else {
          // Start
          setIsVoiceActive(true);
          voiceServiceRef.current = new VoiceService({
              onStatusChange: (status) => setVoiceStatus(status),
              onError: (err) => setError(err),
              onPartialTranscript: (text) => {
                  setLiveTranscript(text);
                  // Barge-in: User is speaking, stop AI
                  if (audioRef.current && !audioRef.current.paused) {
                      stopAudio();
                  }
              },
              onFinalTranscript: (text) => {
                  setLiveTranscript('');
                  handleSendMessage(text); // Send the message automatically
              }
          });
          await voiceServiceRef.current.startRecording();
      }
  };


  const startSession = async (currentLead: Lead, paramsOverride?: Record<string, string>) => {
    setIsLoading(true);
    try {
      // Streamlined Payload: No conversation history, just session Start signal
      const payload: WebhookPayload = {
        sessionId: sessionId,
        lead: currentLead,
        session_start: true,
        urlParams: paramsOverride || urlParams,
        meta: {
          source: 'email_link',
          userAgent: navigator.userAgent,
          pageUrl: window.location.href
        }
      };

      const response = await postToWebhook(payload);
      processResponse(response);
    } catch (err) {
      setError("Unable to connect to Atlas. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const extractDetailsFromText = (text: string) => {
    // Basic heuristics for demo purposes if backend data isn't available
    const timeRegex = /\b(?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:AM|PM|am|pm)\b/i;
    const dayRegex = /\b(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day\b/i;
    const dateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/i;
    // Channels
    const zoomRegex = /zoom/i;
    const meetRegex = /google\s?meet/i;
    const phoneRegex = /phone|call/i;
    
    let datetime = '';
    const dayMatch = text.match(dayRegex);
    const dateMatch = text.match(dateRegex);
    const timeMatch = text.match(timeRegex);
    
    if (dayMatch) datetime += dayMatch[0] + ' ';
    if (dateMatch) datetime += dateMatch[0] + ' ';
    if (timeMatch) datetime += timeMatch[0];
    
    let channel = '';
    if (zoomRegex.test(text)) channel = 'Zoom';
    else if (meetRegex.test(text)) channel = 'Google Meet';
    else if (phoneRegex.test(text)) channel = 'Phone Call';
    
    return { 
        datetime: datetime.trim() || undefined,
        channel: channel || undefined
    };
  };

  const processResponse = (responseItems: any[]) => {
    const newMessages: Message[] = [];
    let foundDetails: {datetime?: string, channel?: string} = {};
    
    responseItems.forEach((item, index) => {
      const msg: Message = {
        id: generateId(),
        role: 'assistant',
        content: item.transcript,
        audioBase64: item.audioBase64,
        imageUrl: item.imageUrl,
        timestamp: Date.now() + index * 100
      };
      newMessages.push(msg);

      // Check for backend provided details or extract from text
      if (item.extracted_data) {
          foundDetails = { ...foundDetails, ...item.extracted_data };
      } else {
          // Fallback extraction
          const extracted = extractDetailsFromText(item.transcript);
          if (extracted.datetime) foundDetails.datetime = extracted.datetime;
          if (extracted.channel) foundDetails.channel = extracted.channel;
      }

      // Check for confirmation flag or keyword
      if (item.requires_confirmation || item.transcript.toLowerCase().includes('ready to confirm')) {
        setIsReadyToConfirm(true);
      }
    });

    // Merge new details with existing ones
    if (foundDetails.datetime || foundDetails.channel) {
        setAppointmentDetails(prev => ({ ...prev, ...foundDetails }));
    }

    setMessages(prev => [...prev, ...newMessages]);

    // Autoplay the last message if it has audio
    // Supports both Base64 (legacy/default) and URL (if provided by new backend logic)
    const lastMsg = newMessages[newMessages.length - 1];
    
    // Check if item has audioUrl specifically (from prompt requirement) or falls back to Base64
    const audioUrl = responseItems[responseItems.length - 1]?.audioUrl;
    
    if (audioUrl) {
         playAudio(audioUrl, lastMsg.id, true);
    } else if (lastMsg && lastMsg.audioBase64) {
         playAudio(lastMsg.audioBase64, lastMsg.id, false);
    }
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || !lead) return;

    // Interrupt AI if speaking
    stopAudio();

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText(''); // Clear input if it came from text box
    setIsLoading(true);

    try {
      // Streamlined Payload: Only sending the latest message
      const payload: WebhookPayload = {
        sessionId: sessionId,
        lead,
        message: userMsg.content, // JUST the new message
        urlParams: urlParams,
        meta: {
           source: isVoiceActive ? 'voice_agent' : 'chat_interface',
           userAgent: navigator.userAgent,
           pageUrl: window.location.href
        }
      };

      const response = await postToWebhook(payload);
      processResponse(response);

    } catch (err) {
      setError("Something went wrong. Please try sending again.");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!lead) return;
    setIsLoading(true);
    stopAudio();
    
    try {
       const payload: WebhookPayload = {
        sessionId: sessionId,
        lead,
        action: 'confirm_appointment',
        urlParams: urlParams,
        meta: { source: 'summary_card', userAgent: navigator.userAgent, pageUrl: window.location.href }
      };
      
      const response = await postToWebhook(payload);
      processResponse(response);
      setIsConfirmed(true);
      setIsReadyToConfirm(false);
    } catch (err) {
      setError("Failed to confirm. Please tell Atlas manually.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---

  if (!lead) {
    // We pass a simple wrapper to allow checking localstorage theme even if LeadForm doesn't have a toggle itself
    return <LeadForm onSubmit={(l) => { setLead(l); startSession(l); }} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 font-sans transition-colors duration-200">
      {/* Header */}
      <header className="flex-none bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 shadow-sm z-10 sticky top-0 transition-colors duration-200">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-md">
                 <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Hi {lead.name.split(' ')[0]}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Atlas Scheduling Assistant</p>
            </div>
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all focus:outline-none"
            title="Toggle theme"
          >
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <div className="max-w-2xl mx-auto flex flex-col min-h-full justify-end">
          {/* Intro Disclaimer */}
          <div className="text-center my-6">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Atlas is an AI assistant. <br/>Interactions are recorded for quality purposes.
            </p>
          </div>

          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isPlaying={currentAudioId === msg.id}
              onPlay={() => msg.audioBase64 && playAudio(msg.audioBase64, msg.id)}
              onPause={stopAudio}
            />
          ))}
          
          {/* Live Transcript Bubble (Real-time Feedback) */}
          {liveTranscript && (
             <div className="flex justify-end mb-4 animate-fade-in-up opacity-70">
                <div className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%] shadow-sm italic">
                  <p className="text-sm sm:text-base leading-relaxed">{liveTranscript}...</p>
                </div>
              </div>
          )}

          {isLoading && (
            <div className="flex justify-start mb-6 animate-fade-in-up">
               <div className="flex-shrink-0 mr-3 mt-1">
                 <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <i className="fas fa-robot text-white text-xs sm:text-sm"></i>
                 </div>
               </div>
               <Loader />
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-4 text-center border border-red-100 dark:border-red-900/30">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline font-bold">Dismiss</button>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Sticky Confirm Card */}
      {(isReadyToConfirm || isConfirmed) && (
        <div className="flex-none z-20">
             <AppointmentSummary 
               onConfirm={handleConfirmAppointment} 
               isProcessing={isLoading} 
               details={appointmentDetails} 
               isConfirmed={isConfirmed}
             />
        </div>
      )}

      {/* Input Area */}
      <footer className="flex-none bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-3 sm:p-4 z-20 transition-colors duration-200">
        <div className="max-w-2xl mx-auto relative">
          
          {/* Voice Status Indicator */}
          {isVoiceActive && (
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-brand-600 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
                  {voiceStatus === 'connected' ? (
                       <>
                         <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                         <span>Listening...</span>
                       </>
                  ) : (
                      <span>Connecting Voice...</span>
                  )}
              </div>
          )}

          {/* Interrupt Button - Absolute positioned above input */}
          {currentAudioId && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
              <button 
                onClick={stopAudio}
                className="flex items-center space-x-2 bg-gray-900/80 hover:bg-black dark:bg-slate-700/90 dark:hover:bg-slate-600 text-white px-4 py-2 rounded-full backdrop-blur-sm shadow-lg transition-transform hover:scale-105 active:scale-95 border border-white/10"
              >
                <i className="fas fa-stop text-red-400"></i>
                <span className="text-sm font-medium">Interrupt</span>
              </button>
            </div>
          )}

          <div className="flex space-x-2 items-end">
            {/* Mic Button */}
            <button
                onClick={toggleVoiceMode}
                className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                    isVoiceActive 
                    ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-200 dark:ring-red-900' 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300'
                }`}
                title="Speak to Atlas"
            >
                <i className={`fas ${isVoiceActive ? 'fa-microphone-slash' : 'fa-microphone'} text-lg`}></i>
            </button>

            <div className="flex-1 relative">
                <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder={isVoiceActive ? "Listening..." : (isConfirmed ? "Say thanks or ask more..." : "Type your reply...")}
                disabled={isLoading}
                className="w-full bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-0 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-600 transition-all disabled:opacity-60"
                />
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:text-gray-500 dark:disabled:text-slate-400 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 flex-shrink-0"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}