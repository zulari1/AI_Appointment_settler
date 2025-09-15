import React, { useState, useEffect, useCallback, FormEvent, ReactNode, useRef, useMemo } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import DOMPurify from 'dompurify';
import { ICONS } from '../constants';
import * as webAIService from '../services/n8nService';
import { WebAILogEntry, WebAIAnalyticsData, WebAIEmbedData, WebAITrainingRow, ChatMessage, WebAIConfigPayload, WebAITrainingDoc, WebAITrainingAckResponse, WebAIAgentSummary } from '../types';
import * as analyticsUtils from '../utils/analyticsUtils';
import * as trainingUtils from '../utils/trainingUtils';
// FIX: Use native Date for date subtraction as 'sub' from date-fns is not available.
import { format } from 'date-fns';

import ActionNotification from '../components/ActionNotification';

type TabName = 'Live Chat' | 'Settings' | 'Training' | 'Analytics' | 'Embed & Access' | 'Logs';

// --- Reusable Components ---
const Card: React.FC<{ children: ReactNode; className?: string, element?: 'div' | 'form' } & React.AllHTMLAttributes<HTMLElement>> = ({ children, className = '', element = 'div', ...props }) => {
    const Component = element as any;
    return (
        <Component className={`bg-dark-card border border-dark-border rounded-xl p-6 ${className}`} {...props}>
            {children}
        </Component>
    );
};interface SpinnerProps {
  message?: string;
}


const Spinner: React.FC<SpinnerProps> = ({ message }) => (
    <div className="flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {message && <span>{message}</span>}
    </div>
);interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
}


const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, prefix = "", suffix = "" }) => {
    const nodeRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        const initialValue = parseInt(node.textContent?.replace(/\D/g, '') || '0', 10);

        const controls = animate(initialValue, value, {
            duration: 1,
            onUpdate(latest) {
                if (node) {
                    node.textContent = `${prefix}${Math.round(latest).toLocaleString()}${suffix}`;
                }
            }
        });

        return () => controls.stop();
    }, [value, prefix, suffix]);

    return <span ref={nodeRef}>{prefix}{value}{suffix}</span>;
};

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-1 p-3">
        <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
        <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
        <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
    </div>
);


// --- Tab Components ---interface LiveChatTabProps {
  settings: WebAIConfigPayload | null;
}


const LiveChatTab: React.FC<LiveChatTabProps> = ({ settings }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (settings) {
            setMessages([{ role: 'assistant', text: settings.welcomeMessage || "Hello! How can I help you today?" }]);
        }
    }, [settings]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const res = await webAIService.postWebAIMessage({
                sessionId: 'preview_session',
                idempotencyKey: `preview-${Date.now()}`,
                message: currentInput,
                assistantName: settings?.assistantName || 'Web Assistant',
            });
            const aiMessage: ChatMessage = { role: 'assistant', text: res.aiResponse || "Sorry, I couldn't get a response." };
            setMessages(prev => [...prev, aiMessage]);
        } catch (e) {
            const errorMessage: ChatMessage = { role: 'assistant', text: "An error occurred. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="flex flex-col h-[70vh]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                {settings?.assistantName || 'Web Assistant'} Preview
            </h2>
            <div className="flex-grow bg-dark-bg p-4 rounded-lg overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        <div className={`p-3 rounded-lg max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-dark-border text-dark-text'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-2 justify-start">
                        <div className="p-0 rounded-lg bg-dark-border"><TypingIndicator /></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex gap-2">
                <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Test your assistant..." className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" disabled={isLoading} />
                <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-brand-primary text-white px-4 rounded-lg disabled:bg-slate-600">{ICONS.paperPlane}</button>
            </div>
        </Card>
    );
};

const SettingsTab: React.FC<{
    settings: WebAIConfigPayload | null;
    onSave: (newSettings: WebAIConfigPayload) => Promise<void>;
    setNotification: (n: any) => void;
    setShowConfetti: (show: boolean) => void;
}> = ({ settings, onSave, setNotification, setShowConfetti }) => {
    const [config, setConfig] = useState<WebAIConfigPayload>({
        assistantName: 'Web Assistant',
        welcomeMessage: "Hi — I'm your AI assistant. How can I help?",
        tone: 'Concise',
        style: 'Formal',
        autoEscalateConfidenceThreshold: 40,
        ownerEmail: 'demo@zulari.app'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setConfig(settings);
        }
    }, [settings]);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(config);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        setIsSaving(false);
    };

    return (
        <Card element="form" onSubmit={handleSave}>
            <h2 className="text-xl font-bold text-white mb-4">Assistant Settings</h2>
            <div className="space-y-4">
                <input type="text" value={config.assistantName} onChange={e => setConfig(c => ({...c, assistantName: e.target.value}))} placeholder="Assistant Name" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
                <textarea value={config.welcomeMessage} onChange={e => setConfig(c => ({...c, welcomeMessage: e.target.value}))} placeholder="Welcome Message" rows={3} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
                <div className="grid grid-cols-2 gap-4">
                    <select value={config.tone} onChange={e => setConfig(c => ({...c, tone: e.target.value}))} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3">
                        <option>Concise</option><option>Friendly</option><option>Professional</option><option>Persuasive</option>
                    </select>
                    <select value={config.style} onChange={e => setConfig(c => ({...c, style: e.target.value}))} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3">
                        <option>Formal</option><option>Casual</option><option>Playful</option><option>Neutral</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm text-dark-text-secondary">Escalation Threshold: {config.autoEscalateConfidenceThreshold}%</label>
                    <input type="range" min="0" max="100" value={config.autoEscalateConfidenceThreshold} onChange={e => setConfig(c => ({...c, autoEscalateConfidenceThreshold: +e.target.value}))} className="w-full" />
                </div>
                <button type="submit" disabled={isSaving} className="w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-600">
                    {isSaving ? <Spinner /> : 'Save Settings'}
                </button>
            </div>
        </Card>
    );
};

// --- NEW TRAINING TAB COMPONENTS (Based on Blueprint) ---
const parseIq = (iqString: string | number): number => {
  if (typeof iqString === 'number') return iqString;
  if (!iqString) return 0;
  return parseInt(String(iqString).replace('%', ''), 10) || 0;
};

const ImpactDashboard = () => (
    <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-bold text-white text-center mb-4">🔥 Your AI's Impact on Business</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-dark-card p-3 rounded-lg"><p className="text-red-400 text-2xl font-bold"><AnimatedCounter value={847} suffix="/mo" /></p><p className="text-xs text-dark-text-secondary">❌ Lost Leads</p></div>
            <div className="bg-dark-card p-3 rounded-lg"><p className="text-red-400 text-2xl font-bold"><AnimatedCounter value={23} suffix="/wk" /></p><p className="text-xs text-dark-text-secondary">📞 Missed Calls</p></div>
            <div className="bg-dark-card p-3 rounded-lg"><p className="text-red-400 text-2xl font-bold"><AnimatedCounter value={156} /></p><p className="text-xs text-dark-text-secondary">❓ Unanswered Queries</p></div>
        </div>
        <p className="text-xs text-amber-400 text-center mt-3 font-semibold">"Competitors convert 3.4x more visitors using AI"</p>
    </div>
);interface AIIntelligenceMeterProps {
  iq: number; iqChange: number;
}


const AIIntelligenceMeter: React.FC<AIIntelligenceMeterProps> = ({ iq, iqChange }) => {
    const milestones = [{iq: 40, label: 'Q&A'}, {iq: 60, label: 'Booking'}, {iq: 80, label: 'Analytics'}, {iq: 95, label: 'Genius'}];
    return (
        <div className="bg-dark-bg border border-dark-border rounded-xl p-4 relative overflow-hidden">
             <AnimatePresence>
                {iqChange > 0 && (
                    <motion.div
                        key={Date.now()}
                        initial={{ opacity: 0, y: -10, scale: 0.8 }}
                        animate={{ opacity: [1, 1, 0], y: -40, scale: 1.2 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute top-4 right-4 text-lg font-bold text-green-400 bg-green-900/50 px-3 py-1 rounded-full"
                    >
                        +{iqChange} IQ!
                    </motion.div>
                )}
            </AnimatePresence>
            <h3 className="text-lg font-bold text-white mb-2">🎯 AI Intelligence Meter</h3>
            <div className="flex items-center gap-4">
                <span className="font-bold text-2xl text-brand-accent"><AnimatedCounter value={iq} suffix="%" /></span>
                <div className="w-full bg-dark-card rounded-full h-4 border border-dark-border p-0.5"><motion.div className="bg-brand-primary h-full rounded-full" initial={{width: '0%'}} animate={{width: `${iq}%`}} /></div>
            </div>
            <div className="flex justify-between text-xs text-dark-text-secondary mt-1">
                {milestones.map(m => <span key={m.label} style={{ left: `${m.iq}%`}} className="relative -translate-x-1/2">{m.label}</span>)}
            </div>
        </div>
    );
};

const KnowledgeSection: React.FC<{title: string, icon: string, docs: any[], onUpload: (docType: any) => void, docType: any}> = ({ title, icon, docs, onUpload, docType }) => {
    const sectionIq = docs.reduce((acc, doc) => acc + (doc.doc_status === 'Complete' ? 5 : doc.doc_status === 'Partial' ? 2 : 0), 0);
    
    const statusPill = (status: any) => {
        const styles = {
            'Complete': 'bg-green-500/20 text-green-400',
            'Partial': 'bg-amber-500/20 text-amber-400',
            'Empty': 'bg-red-500/20 text-red-400',
        };
        return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="bg-dark-bg border border-dark-border rounded-xl p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">{icon} {title}</h3>
                <span className="text-sm font-bold text-brand-accent">+{sectionIq} IQ</span>
            </div>
            <div className="flex-grow space-y-2">
                {docs.length > 0 ? docs.map(doc => (
                    <div key={doc.doc_id} className="bg-dark-card p-2 rounded-md flex justify-between items-center text-sm">
                        <span className="font-semibold">{doc.doc_name}</span>
                        {statusPill(doc.doc_status)}
                    </div>
                )) : <p className="text-xs text-dark-text-secondary text-center py-4">No documents trained for this section.</p>}
            </div>
            <button onClick={() => onUpload(docType)} className="w-full mt-3 bg-dark-border hover:bg-brand-primary text-white text-sm font-semibold py-2 rounded-lg">+ Add Document</button>
        </div>
    );
};

const AddDocumentModal: React.FC<{ userEmail: string, agentName: string, docType: WebAITrainingDoc['doc_type'], onClose: () => void, onSuccess: () => void }> = ({ userEmail, agentName, docType, onClose, onSuccess }) => {
    const [docName, setDocName] = useState('');
    const [currentDocType, setCurrentDocType] = useState(docType);
    const [contentText, setContentText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const submit = async () => {
      if (!docName.trim()) { setError('Please give the document a name'); return; }
      if (!contentText.trim()) { setError('Paste content or use upload — we need text to train'); return; }
  
      setError(null);
      setIsUploading(true);
      const payload = {
        user_email: userEmail,
        agent_name: agentName,
        doc_name: docName,
        doc_type: currentDocType,
        content_text: contentText,
        doc_status: 'Complete',
        uploaded_at: new Date().toISOString(),
        source: 'ui_text'
      };
  
      try {
        const data: WebAITrainingAckResponse = await webAIService.addWebAITrainingDoc(payload);
        if (Array.isArray(data) && data[0]?.status === 'Successfull') {
            onSuccess();
            onClose();
        } else {
            const errorMessage = (data as any)?.message || JSON.stringify(data) || 'Unexpected response';
            throw new Error(`Server response not OK: ${errorMessage}`);
        }
      } catch (err: any) {
        console.error('Add doc failed', err);
        setError(`Upload failed. We saved your content locally — please try again. Error: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    };
  
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg">Add document to {agentName}</h3>
            {error && <p className="text-red-400 text-sm bg-red-900/50 p-2 rounded-md">{error}</p>}
            <input value={docName} onChange={e=>setDocName(e.target.value)} placeholder="Document Name (e.g., Homepage Script v1)" className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border" />
            <select value={currentDocType} onChange={e=>setCurrentDocType(e.target.value as any)} className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border">
              <option value="Company DNA">Company DNA</option><option value="Product Data">Product</option><option value="FAQ">FAQ</option><option value="Meeting Info">Scheduler</option><option value="Personality">Personality</option><option value="Other">Other</option>
            </select>
            <textarea rows={8} value={contentText} onChange={e=>setContentText(e.target.value)} placeholder="Paste text content here..." className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border font-mono" />
            <div className="flex justify-end gap-2">
              <button onClick={onClose} disabled={isUploading} className="bg-dark-bg hover:bg-dark-border px-4 py-2 text-sm rounded-lg">Cancel</button>
              <button onClick={submit} disabled={isUploading || !docName.trim() || !contentText.trim()} className="bg-brand-primary hover:bg-indigo-500 text-white font-semibold px-4 py-2 text-sm rounded-lg disabled:bg-slate-600">
                {isUploading ? <Spinner /> : 'Add & Train'}
              </button>
            </div>
        </div>
      </div>
    );
};

const TrainingTab = ({ setNotification, setShowConfetti }: { setNotification: (n: any) => void; setShowConfetti: (show: boolean) => void; }) => {
    const [trainingData, setTrainingData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDocType, setModalDocType] = useState<any>('Company DNA');
    const [iq, setIq] = useState(0);
    const [iqChange, setIqChange] = useState(0);

    const refetchData = useCallback(() => {
        webAIService.fetchWebAITrainingData('alice@store.com')
            .then(data => {
                setTrainingData(data);
                const webAiDocs = data.filter(d => d.agent_name === 'Web AI');
                if (webAiDocs.length > 0) {
                    const newIq = parseIq(webAiDocs[0].agent_iq);
                    setIq(prevIq => {
                        if (newIq !== prevIq && prevIq !== 0) {
                            setIqChange(newIq - prevIq);
                            setTimeout(() => setIqChange(0), 2000);
                        }
                        return newIq;
                    });
                }
            })
            .catch(err => setNotification({ message: `Failed to refresh training data: ${err.message}`, type: 'error' }));
    }, [setNotification]);

    useEffect(() => {
        setLoading(true);
        webAIService.fetchWebAITrainingData('alice@store.com')
            .then(data => {
                setTrainingData(data);
                const webAiDocs = data.filter(d => d.agent_name === 'Web AI');
                if (webAiDocs.length > 0) {
                    setIq(parseIq(webAiDocs[0].agent_iq));
                }
            })
            .catch(err => setNotification({ message: `Failed to load training data: ${err.message}`, type: 'error' }))
            .finally(() => setLoading(false));
    }, [setNotification]);

    const handleTrainingSuccess = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        setNotification({ message: 'Training added! Refreshing data...', type: 'success' });
        refetchData();
    };
    
    const webAiDocs = useMemo(() => trainingData.filter(d => d.agent_name === 'Web AI'), [trainingData]);
    
    const knowledgeSections: {title: string, icon: string, type: WebAITrainingDoc['doc_type']}[] = [
        { title: 'Company DNA', icon: '🧬', type: 'Company DNA' },
        { title: 'Products/Services', icon: '🎯', type: 'Product Data' },
        { title: 'FAQ Powerhouse', icon: '🤔', type: 'FAQ' },
        { title: 'Meeting Scheduler', icon: '📅', type: 'Meeting Info' },
        { title: 'Tone & Personality', icon: '🎭', type: 'Personality' },
    ];
    
    const groupedDocs = useMemo(() => {
        const groups: Record<string, any[]> = {};
        knowledgeSections.forEach(sec => groups[sec.type] = []);
        webAiDocs.forEach(doc => {
            const docTypeKey = doc.doc_type as WebAITrainingDoc['doc_type'];
            // Normalize potential mismatches from sheet
            if (docTypeKey === 'Company DNA' && groups['Company DNA']) groups['Company DNA'].push(doc);
            else if (docTypeKey === 'Product Data' && groups['Product Data']) groups['Product Data'].push(doc);
            else if (docTypeKey === 'FAQ' && groups['FAQ']) groups['FAQ'].push(doc);
            else if (docTypeKey === 'Meeting Info' && groups['Meeting Info']) groups['Meeting Info'].push(doc);
            else if (docTypeKey === 'Personality' && groups['Personality']) groups['Personality'].push(doc);
        });
        return groups;
    }, [webAiDocs]);

    const handleOpenUploadModal = (docType: any) => {
        setModalDocType(docType);
        setIsModalOpen(true);
    };

    if(loading) return <Spinner message="Loading training data..." />

    return (
        <div className="space-y-6">
            <ImpactDashboard />
            <AIIntelligenceMeter iq={iq} iqChange={iqChange} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {knowledgeSections.map(section => (
                    <KnowledgeSection 
                        key={section.type}
                        title={section.title}
                        icon={section.icon}
                        docs={groupedDocs[section.type] || []}
                        onUpload={handleOpenUploadModal}
                        docType={section.type}
                    />
                ))}
            </div>
            {isModalOpen && (
                <AddDocumentModal 
                    userEmail="alice@store.com"
                    agentName="Web AI"
                    docType={modalDocType}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleTrainingSuccess}
                />
            )}
        </div>
    );
};


const AnalyticsTab: React.FC<{ setNotification: (n: any) => void }> = ({ setNotification }) => {
    const [data, setData] = useState<WebAIAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState(7);

    useEffect(() => {
        setLoading(true);
        const to = new Date();
        // FIX: Use native Date for date subtraction as 'sub' from date-fns is not available.
        const from = new Date(to);
        from.setDate(from.getDate() - range);
        const fromStr = format(from, 'yyyy-MM-dd');
        const toStr = format(to, 'yyyy-MM-dd');
        
        webAIService.fetchWebAILogs(fromStr, toStr)
            .then(logs => {
                setData(analyticsUtils.computeWebAIAnalytics(logs));
            })
            .catch(err => setNotification({ message: `Failed to load analytics: ${err.message}`, type: 'error' }))
            .finally(() => setLoading(false));
    }, [range, setNotification]);
    
    const kpis = [
        { label: 'Conversations', value: data?.conversations },
        { label: 'Meetings Booked', value: data?.bookingsCreated },
        { label: 'Booking Rate', value: data?.bookingRate, suffix: '%' },
        { label: 'Escalations', value: data?.escalations },
    ];

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-white">Analytics</h2>
                 <select value={range} onChange={e => setRange(Number(e.target.value))} className="bg-dark-bg border border-dark-border rounded p-2 text-sm">
                    <option value={7}>Last 7 Days</option><option value={30}>Last 30 Days</option><option value={90}>Last 90 Days</option>
                 </select>
            </div>
            {loading ? <div className="h-24"><Spinner message="Loading analytics..." /></div> : !data || data.conversations === 0 ? (
                <div className="text-center py-8 text-dark-text-secondary">No data yet. Try sending messages in the Live Chat tab to see analytics.</div>
            ) : (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kpis.map(kpi => (
                        <div key={kpi.label} className="bg-dark-bg p-4 rounded-lg text-center">
                            <p className="text-3xl font-bold text-white"><AnimatedCounter value={kpi.value ?? 0} suffix={kpi.suffix} /></p>
                            <p className="text-xs text-dark-text-secondary">{kpi.label}</p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

const EmbedTab: React.FC<{ setNotification: (n: any) => void }> = ({ setNotification }) => {
    const [embedData, setEmbedData] = useState<WebAIEmbedData | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleRequest = async () => {
        setLoading(true);
        try {
            const data = await webAIService.requestEmbedCode('demo@zulari.app');
            setEmbedData(data);
        } catch(err: any) {
            setNotification({ message: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!embedData) return;
        navigator.clipboard.writeText(embedData.embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-white mb-4">Embed & Access</h2>
            {embedData ? (
                <div className="space-y-4">
                    <p className="text-sm text-dark-text-secondary">Copy this code and paste it just before the `&lt;/body&gt;` tag on your website.</p>
                    <pre className="bg-dark-bg p-4 rounded-lg text-xs font-mono whitespace-pre-wrap relative">
                        <code>{embedData.embedCode}</code>
                        <button onClick={handleCopy} className="absolute top-2 right-2 p-1 bg-dark-border rounded">{copied ? '✅' : 'Copy'}</button>
                    </pre>
                    <a href={embedData.previewUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-dark-bg hover:bg-dark-border text-white font-bold py-2 px-4 rounded-lg">Preview Assistant ↗</a>
                </div>
            ) : (
                <button onClick={handleRequest} disabled={loading} className="w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-600">
                    {loading ? <Spinner /> : 'Generate Embed Code'}
                </button>
            )}
        </Card>
    );
};

const LogsTab: React.FC<{ setNotification: (n: any) => void }> = ({ setNotification }) => {
    const [logs, setLogs] = useState<WebAILogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        setLoading(true);
        const to = new Date();
        const from = new Date(to);
        from.setDate(from.getDate() - 7);
        const fromStr = format(from, 'yyyy-MM-dd');
        const toStr = format(to, 'yyyy-MM-dd');
        webAIService.fetchWebAILogs(fromStr, toStr)
            .then(setLogs)
            .catch(err => setNotification({ message: `Failed to load logs: ${err.message}`, type: 'error' }))
            .finally(() => setLoading(false));
    }, [setNotification]);

    return (
        <Card>
            <h2 className="text-xl font-bold text-white mb-4">Conversation Logs</h2>
            {loading ? <Spinner /> : logs.length === 0 ? <p>No logs found.</p> : (
                <div className="overflow-auto max-h-[60vh]">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-dark-card"><tr className="text-xs text-dark-text-secondary"><th className="p-2 text-left">Timestamp</th><th className="p-2 text-left">User</th><th className="p-2 text-left">Message</th><th className="p-2 text-left">Bot Reply</th></tr></thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={i} className="border-b border-dark-border"><td className="p-2">{new Date(log.Timestamp).toLocaleString()}</td><td className="p-2">{log['Customer Name']}</td><td className="p-2">{log['User Message']}</td><td className="p-2">{log['Bot Reply']}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};

// --- Main Page Component ---
const WebAssistantServicePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabName>('Training');
    const [settings, setSettings] = useState<WebAIConfigPayload | null>(null);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    const saveSettings = async (newSettings: WebAIConfigPayload) => {
        try {
            await webAIService.saveWebAIConfig(newSettings);
            setSettings(newSettings);
            setNotification({ message: 'Settings saved successfully!', type: 'success' });
        } catch(err: any) {
            setNotification({ message: `Save failed: ${err.message}`, type: 'error' });
        }
    };

    const tabs: { name: TabName, icon: ReactNode }[] = [
        { name: 'Training', icon: ICONS.training }, { name: 'Live Chat', icon: ICONS.chat }, { name: 'Settings', icon: ICONS.settings },
        { name: 'Analytics', icon: ICONS.stats }, { name: 'Embed & Access', icon: ICONS.integrations }, { name: 'Logs', icon: ICONS.history }
    ];

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            {showConfetti && <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl pointer-events-none z-[100]"><div className="animate-confetti-burst">🎉</div></div>}
            
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3"><span className="text-brand-accent">{ICONS.web}</span>Web AI Assistant</h1>
                    <p className="text-dark-text-secondary mt-1">Configure and manage your website's AI chatbot.</p>
                </div>
            </header>
            
            <nav className="flex space-x-2 border-b border-dark-border">
                {tabs.map(tab => (
                    <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`flex items-center gap-2 p-3 border-b-2 text-sm font-semibold ${activeTab === tab.name ? 'border-brand-primary text-white' : 'border-transparent text-dark-text-secondary hover:text-white'}`}>
                        {tab.icon} {tab.name}
                    </button>
                ))}
            </nav>
            
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration: 0.2}}>
                    {activeTab === 'Training' && <TrainingTab setNotification={setNotification} setShowConfetti={setShowConfetti} />}
                    {activeTab === 'Live Chat' && <LiveChatTab settings={settings} />}
                    {activeTab === 'Settings' && <SettingsTab settings={settings} onSave={saveSettings} setNotification={setNotification} setShowConfetti={setShowConfetti} />}
                    {activeTab === 'Analytics' && <AnalyticsTab setNotification={setNotification} />}
                    {activeTab === 'Embed & Access' && <EmbedTab setNotification={setNotification} />}
                    {activeTab === 'Logs' && <LogsTab setNotification={setNotification} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default WebAssistantServicePage;