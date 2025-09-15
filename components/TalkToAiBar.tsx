import React, { useState, useEffect, useRef } from 'react';
// FIX: Import missing RawLead type.
import { Lead, RawLead, ScrapeResponse, ScrapeResponseOk } from '../types';
import { ICONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { VITE_WEBHOOK_AI_SCRAPE } from '../env';
import { useAccessControl } from '../hooks/useAccessControl';
import ActionNotification from './ActionNotification';

// FIX: Cast motion.div to 'any' to work around a probable type conflict with React/Framer Motion versions.
const MotionDiv = motion.div as any;

interface TalkToAiBarProps {
    userEmail: string;
    onNewLeads: (newLeads: RawLead[]) => void;
    onRefresh: () => void;
}

const SuccessCard: React.FC<{ result: ScrapeResponseOk, onClear: () => void }> = ({ result, onClear }) => {
    const { stats, leads } = result;
    const previewLeads = leads.slice(0, 5);

    return (
        <MotionDiv 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 p-4 bg-dark-bg border border-dark-border rounded-lg"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                        <span className="text-green-400">✅</span>
                        <span>Found {stats.new} new leads ({stats.found} total matched)</span>
                    </h4>
                    <div className="text-xs text-dark-text-secondary mt-1 space-x-4">
                        <span>New: <span className="font-semibold text-white">{stats.new}</span></span>
                        <span>Duplicates: <span className="font-semibold text-white">{stats.duplicates}</span></span>
                    </div>
                </div>
                <button onClick={onClear} className="text-dark-text-secondary hover:text-white text-xs">× Close</button>
            </div>

            {previewLeads.length > 0 && (
                <div className="mt-4 border-t border-dark-border pt-3 space-y-2">
                    <h5 className="text-xs font-bold uppercase text-dark-text-secondary">Preview</h5>
                    {previewLeads.map((lead, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-dark-border/50">
                            <div>
                                <p className="font-semibold text-white">{lead.fullName || lead.email}</p>
                                <p className="text-xs text-dark-text-secondary">{lead.jobTitle} @ {lead.company}</p>
                            </div>
                            <div className="flex items-center gap-2">
                               {lead.email && <a href={`mailto:${lead.email}`} title={lead.email}>{React.cloneElement(ICONS.email, {className: "h-4 w-4"})}</a>}
                               {lead.linkedin && <a href={lead.linkedin} target="_blank" rel="noreferrer" title={lead.linkedin}>{React.cloneElement(ICONS.linkedin, {className: "h-4 w-4"})}</a>}
                               {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" title={lead.website}>{React.cloneElement(ICONS.web, {className: "h-4 w-4"})}</a>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </MotionDiv>
    );
};

export default function TalkToAiBar({ userEmail, onNewLeads, onRefresh }: TalkToAiBarProps) {
    const [prompt, setPrompt] = useState('');
    const [volume, setVolume] = useState(50);
    const [source, setSource] = useState('linkedin');
    const [status, setStatus] = useState<'idle' | 'searching' | 'queued' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [result, setResult] = useState<ScrapeResponseOk | null>(null);
    const [rawOutput, setRawOutput] = useState<string | null>(null);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const { checkServiceAccess } = useAccessControl(setNotification);

    const countdownRef = useRef<number | null>(null);
    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);
    
    useEffect(() => {
        if (status !== 'queued' || countdown <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return;
        }
        countdownRef.current = window.setInterval(() => {
            setCountdown(c => {
                if (c <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    setStatus('idle');
                    onRefresh();
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current) };
    }, [status, countdown, onRefresh]);

    const isInvalidPrompt = prompt.trim().length > 0 && prompt.trim().length < 10;
    const isBusy = status === 'searching' || status === 'queued';
    
    const sources = [
        { id: 'linkedin', label: 'LinkedIn' },
        { id: 'website', label: 'Website' },
        { id: 'both', label: 'Both' },
    ];

    async function handleSend() {
        if (prompt.trim().length < 10) {
            setMessage('Prompt must be at least 10 characters.');
            setStatus('error');
            return;
        }

        const isAllowed = await checkServiceAccess({ email: userEmail, service: 'lead-gen' });
        if (!isAllowed) {
            return;
        }

        setMessage('');
        setStatus('searching');
        setResult(null);
        setRawOutput(null);

        const payload = {
            action: 'scrape', userEmail, sessionId: 's_' + Date.now(),
            prompt: prompt.trim(), volume: Number(volume), source,
            filters: {},
            timestamp: new Date().toISOString()
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const res = await fetch(VITE_WEBHOOK_AI_SCRAPE, {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const json: any = await res.json().catch(() => null);

            if (!res.ok || !json) {
                throw new Error(`Server returned ${res.status}`);
            }

            if (Array.isArray(json) && json.length > 0 && json[0].output) {
                setStatus('success');
                const outputText = typeof json[0].output === 'string' ? json[0].output : JSON.stringify(json[0].output, null, 2);
                setRawOutput(outputText);
                return;
            }
            
            const typedJson = json as ScrapeResponse;

            if (typedJson.status === 'error') {
                throw new Error(typedJson.message || `Server returned ${res.status}`);
            }

            if (typedJson.status === 'queued') {
                setStatus('queued');
                setCountdown(typedJson.estimatedSeconds || 120);
                return;
            }

            if (typedJson.status === 'ok' && Array.isArray(typedJson.leads)) {
                setStatus('success');
                setResult(typedJson);
                onNewLeads(typedJson.leads as RawLead[]);
                
                setTimeout(() => {
                    if(statusRef.current === 'success') {
                        setStatus('idle');
                        setResult(null);
                    }
                }, 8000);
                return;
            }
            throw new Error('Unexpected response from server.');
        } catch (err: any) {
            clearTimeout(timeoutId);
            setStatus('error');
            if (err.name === 'AbortError') {
                 setMessage('Search timed out. Try again.');
            } else {
                 setMessage(err.message || 'A network error occurred.');
            }
        }
    }
    
    function handleCancel() {
        setStatus('idle');
        setMessage('');
        setCountdown(0);
        if (countdownRef.current) clearInterval(countdownRef.current);
    }

    return (
        <div className={`relative w-full bg-dark-card text-dark-text border border-dark-border rounded-xl shadow-lg p-6 md:p-8 transition-all duration-500 ${status === 'idle' && !result ? 'animate-subtle-pulse' : ''}`}>
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            {status === 'searching' && (
                 <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                    <div className="absolute left-[-50%] top-[-50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent animate-radar-sweep"></div>
                </div>
            )}
            
            <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-semibold text-white">💬 Talk to AI — Find leads by asking</h2>
                <p className="text-sm text-dark-text-secondary mt-1">Example: “Find 50 cafe owners in Berlin with LinkedIn profiles”</p>

                <AnimatePresence>
                    {status === 'success' && result && <SuccessCard result={result} onClear={() => { setStatus('idle'); setResult(null); }}/>}
                    
                    {rawOutput && (
                        <MotionDiv
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="mt-4 p-4 bg-dark-bg border border-dark-border rounded-lg"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    <span className="text-brand-accent">🤖</span>
                                    <span>AI Output</span>
                                </h4>
                                <button onClick={() => { setRawOutput(null); setStatus('idle'); }} className="text-dark-text-secondary hover:text-white text-xs">× Close</button>
                            </div>
                            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/50 p-3 rounded-md max-h-60 overflow-y-auto">{rawOutput}</pre>
                        </MotionDiv>
                    )}
                </AnimatePresence>

                <div className="mt-6">
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder='e.g. "Find 50 cafe owners in Berlin with LinkedIn profiles"'
                      className={`w-full border rounded-lg px-4 py-3 text-lg bg-dark-bg text-dark-text focus:ring-2 focus:ring-brand-primary focus:outline-none transition-colors ${isInvalidPrompt ? 'border-red-500' : 'border-dark-border'}`}
                      aria-label="Lead search prompt"
                      rows={2}
                      disabled={isBusy}
                    />
                </div>
                
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <input type="number" min="1" max="500" value={volume} onChange={e => setVolume(Number(e.target.value))}
                            className="w-20 px-3 py-2 border border-dark-border rounded-md bg-dark-bg text-dark-text disabled:opacity-50" aria-label="Volume" disabled={isBusy} />
                        
                        <div role="radiogroup" aria-label="Lead source" className="flex items-center gap-1 bg-dark-bg p-1 rounded-lg border border-dark-border">
                            {sources.map(s => (
                                <button
                                    key={s.id}
                                    role="radio"
                                    aria-checked={source === s.id}
                                    onClick={() => !isBusy && setSource(s.id)}
                                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                                        source === s.id
                                            ? 'bg-brand-primary text-white'
                                            : 'text-dark-text hover:bg-dark-border'
                                    }`}
                                    disabled={isBusy}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex-grow text-left text-sm h-5">
                            {status === 'error' && <p className="text-red-500">{message}</p>}
                            {isInvalidPrompt && <p className="text-red-500">Prompt must be at least 10 characters.</p>}
                        </div>
                        
                        {status === 'queued' ? (
                            <div className="flex items-center gap-2 p-2 bg-amber-500/10 text-amber-300 rounded-lg">
                                {React.cloneElement(ICONS.hourglass, {className: "h-4 w-4"})}
                                <span className="text-sm font-semibold">Queued. Refresh in {countdown}s</span>
                                <button onClick={handleCancel} className="text-amber-400 hover:text-amber-200" title="Cancel">✖</button>
                            </div>
                        ) : (
                            <button
                                className="w-full md:w-48 h-12 px-6 py-3 rounded-lg bg-brand-primary text-white font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center disabled:bg-slate-600 disabled:cursor-not-allowed"
                                onClick={handleSend}
                                aria-label="Send lead scrape"
                                disabled={isBusy || isInvalidPrompt}
                            >
                                {status === 'searching' ? (
                                    <>
                                        {React.cloneElement(ICONS.paperPlane, { className: "animate-spin h-5 w-5 mr-3"})}
                                        Searching...
                                    </>
                                ) : 'Send'}
                            </button>
                        )}
                    </div>
                </div>
                 <p className="text-xs text-dark-text-secondary opacity-75 mt-4 text-center md:text-right">We’ll only use public data • Results added to your Leads review.</p>
            </div>
        </div>
    );
}