import React, { useState, useEffect, useRef } from 'react';
import type { FormData, ChatMessage } from './types';
import { QUESTIONS, STAGES, WEBHOOK_URL } from './constants';
import ProgressBar from './components/ProgressBar';
import ChatBubble from './components/ChatBubble';
import SummaryView from './components/SummaryView';
import { SendIcon, TypingIndicator } from './components/Icons';

const initialFormData: FormData = {
  clientName: '',
  business: { name: '', description: '', mission: '', targetAudience: '', usp: '' },
  products: { details: '', pricing: '', ecommerce: '' },
  branding: { logo: '', colors: '', fonts: '', tone: '', vibe: '' },
  website: { pages: '', features: '', integrations: '' },
  content: { samples: '', seoKeywords: '', cta: '' },
  technical: { domain: '', hosting: '', responsive: '' },
  project: { goals: '', competitors: '', timeline: '', budget: '', additionalInfo: '' },
};

const getInitialState = () => {
  try {
    const savedState = localStorage.getItem('ai-web-design-session');
    if (savedState) {
      const { formData, currentQuestionIndex, conversation, isCompleted } = JSON.parse(savedState);
      if (formData && typeof currentQuestionIndex === 'number' && Array.isArray(conversation)) {
        return { formData, currentQuestionIndex, conversation, isCompleted };
      }
    }
  } catch (error) {
    console.error("Failed to parse state from localStorage", error);
  }
  return {
    formData: initialFormData,
    currentQuestionIndex: 0,
    conversation: [],
    isCompleted: false,
  };
};


const App: React.FC = () => {
  const initialState = getInitialState();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialState.currentQuestionIndex);
  const [formData, setFormData] = useState<FormData>(initialState.formData);
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>(initialState.conversation);
  const [isTyping, setIsTyping] = useState(conversation.length === 0);
  const [isCompleted, setIsCompleted] = useState(initialState.isCompleted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const stateToSave = { formData, currentQuestionIndex, conversation, isCompleted };
    localStorage.setItem('ai-web-design-session', JSON.stringify(stateToSave));
  }, [formData, currentQuestionIndex, conversation, isCompleted]);


  useEffect(() => {
    const postQuestion = () => {
        if (currentQuestionIndex < QUESTIONS.length) {
            const currentQuestion = QUESTIONS[currentQuestionIndex];
            const isQuestionAlreadyPosted = conversation.some(msg => msg.sender === 'ai' && msg.text === currentQuestion.question);
            if(!isQuestionAlreadyPosted) {
              const aiMessage: ChatMessage = {
                  sender: 'ai',
                  text: currentQuestion.question,
                  preview: currentQuestion.preview,
              };
              setConversation(prev => [...prev, aiMessage]);
            }
        } else {
            if (!isCompleted) {
                const finalMessage: ChatMessage = {
                    sender: 'ai',
                    text: "Amazing work! That's everything I need. I'm putting together the final blueprint for you to review.",
                };
                setConversation(prev => [...prev, finalMessage]);
                setTimeout(() => setIsCompleted(true), 1500);
            }
        }
        setIsTyping(false);
    };
    
    if (isTyping && !isCompleted) {
        const typingDuration = conversation.length === 0 ? 1500 : 1000;
        const timer = setTimeout(postQuestion, typingDuration);
        return () => clearTimeout(timer);
    } else if (conversation.length === 0 && currentQuestionIndex === 0 && !isCompleted) {
        setIsTyping(true);
    } else {
        setIsTyping(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, isTyping, isCompleted]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isTyping]);

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => {
      const newFormData = JSON.parse(JSON.stringify(prev));
      if (!key.includes('.')) {
        newFormData[key] = value;
        return newFormData;
      }
      let current = newFormData;
      const parts = key.split('.');
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]] = current[parts[i]] || {};
      }
      current[parts[parts.length - 1]] = value;
      return newFormData;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping || isCompleted) return;

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    if (!currentQuestion) return;

    const userMessage: ChatMessage = { sender: 'user', text: inputValue };
    updateFormData(currentQuestion.id, inputValue);

    let reinforcementText = currentQuestion.reinforcement;
    if (inputValue.length < 25) {
        reinforcementText = reinforcementText.replace('{value}', `"${inputValue}"`);
    } else {
        reinforcementText = reinforcementText.replace('{value}', 'That');
    }
    const aiReinforcementMessage: ChatMessage = { sender: 'ai', text: reinforcementText };
    
    setConversation(prev => [...prev, userMessage, aiReinforcementMessage]);
    setInputValue('');
    setCurrentQuestionIndex(prev => prev + 1);
    setIsTyping(true);
  };
  
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      client_name: formData.clientName,
      business_type: "Book Depot",
      business_details: formData.business,
      products_and_commerce: formData.products,
      branding: formData.branding,
      website_structure: formData.website,
      content_strategy: formData.content,
      technical_preferences: formData.technical,
      project_goals_and_logistics: formData.project,
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Submission failed: ${response.statusText}. Details: ${errorData}`);
      }
      
      localStorage.removeItem('ai-web-design-session');
      setSubmissionSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    localStorage.removeItem('ai-web-design-session');
    window.location.reload();
  };
  
  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const currentStage = isCompleted ? STAGES.length - 1 : (currentQuestion ? currentQuestion.stage : 0);

  if (submissionSuccess) {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-2xl mx-auto p-8 bg-black/20 backdrop-blur-xl rounded-lg shadow-2xl text-center animate-fade-in border border-white/10">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-4">Success!</h2>
                <p className="text-lg text-gray-300 mb-8">Your project blueprint has been securely sent to our design team. We're excited to start building your dream website. Expect a preview soon!</p>
                <button
                    onClick={handleEdit}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                    Start a New Project
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4 justify-center items-center">
      <div className="w-full max-w-3xl h-full sm:h-[95vh] sm:max-h-[800px] flex flex-col bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <header className="p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-gray-100">AI Web Design Assistant</h1>
            <p className="text-sm text-blue-300">For Your Book Depot Store</p>
            <div className="mt-4">
              <ProgressBar stages={STAGES} currentStage={currentStage} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            {isCompleted ? (
              <SummaryView 
                data={formData} 
                onConfirm={handleConfirmSubmit}
                onEdit={handleEdit}
                isSubmitting={isSubmitting}
                error={error}
              />
            ) : (
              <div className="space-y-6">
                {conversation.map((msg, index) => (
                  <ChatBubble key={index} message={msg} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </main>

        {!isCompleted && (
          <footer className="p-4 bg-gray-900/30 border-t border-white/10 flex-shrink-0">
            <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto flex items-center gap-3">
              <input
                type={currentQuestion?.type === 'email' ? 'email' : 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isTyping ? "AI is typing..." : currentQuestion?.placeholder || "Type your answer..."}
                className="flex-1 w-full px-5 py-3 text-gray-200 bg-black/30 backdrop-blur-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500 border border-transparent focus:border-blue-500"
                autoFocus
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </form>
          </footer>
        )}
      </div>
       <p className="text-center text-xs text-gray-500 mt-4">✨ Guided by Atlas AI – Designed with Soul and Precision</p>
    </div>
  );
};

export default App;