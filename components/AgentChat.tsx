import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, ChatSummaryItem, ChatScoreItem } from '../types';
import * as n8n from '../services/n8nService';
import { ICONS } from '../constants';
import { useAccessControl } from '../hooks/useAccessControl';
import ActionNotification from './ActionNotification';

// FIX: Cast motion.div to 'any' to work around a probable type conflict with React/Framer Motion versions.
const MotionDiv = motion.div as any;

const Spinner: React.FC = () => (
    <div className="flex justify-center items-center py-8">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="ml-4 text-dark-text-secondary">Generating AI response...</p>
    </div>
);

const SummaryCard: React.FC<{ data: ChatSummaryItem, lead: Lead }> = ({ data, lead }) => (
    <div className="p-4 bg-dark-bg rounded-lg space-y-4">
        <div>
            <h4 className="text-lg font-semibold text-white">{data.contact?.name || lead.displayName}</h4>
            <p className="text-sm text-dark-text-secondary">{data.contact?.title || lead.title} • {data.contact?.company || lead.company}</p>
        </div>
        <p className="text-sm text-dark-text font-medium" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.summary) }} />
        {data.bullets && data.bullets.length > 0 && (
            <details className="text-sm">
                <summary className="cursor-pointer text-dark-text-secondary hover:text-white">Key points</summary>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-dark-text-secondary">
                    {data.bullets.map((b, i) => <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(b) }} />)}
                </ul>
            </details>
        )}
        <div className="flex flex-wrap gap-2 text-xs border-t border-dark-border pt-3">
            <a href={`mailto:${data.contact?.email || lead.email}`} className="flex items-center gap-1.5 px-3 py-1 border border-dark-border rounded-full hover:bg-dark-border">Email</a>
            {(data.contact?.linkedin || lead.linkedinUrl) && <a href={data.contact?.linkedin || lead.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1 border border-dark-border rounded-full hover:bg-dark-border">LinkedIn</a>}
            {(data.contact?.website || lead.websiteUrl) && <a href={data.contact?.website || lead.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1 border border-dark-border rounded-full hover:bg-dark-border">Website</a>}
        </div>
    </div>
);

const ScoreCard: React.FC<{ data: ChatScoreItem }> = ({ data }) => {
    const scoreColor = data.score >= 80 ? 'text-green-400' : data.score >= 60 ? 'text-amber-400' : 'text-red-400';
    
    return (
        <div className="p-4 bg-dark-bg rounded-lg space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className={`text-5xl font-bold ${scoreColor}`}>{data.score}</p>
                    <p className="text-sm text-dark-text-secondary">Lead Score</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-brand-accent">{data.recommendation}</p>
                    <p className="text-xs text-dark-text-secondary">Confidence: {data.confidencePercent}%</p>
                </div>
            </div>
            
            {data.scoreBreakdown && (
                <div>
                    <h5 className="text-xs font-bold uppercase text-dark-text-secondary mb-2">Breakdown</h5>
                    <div className="space-y-1">
                    {Object.entries(data.scoreBreakdown).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                            <span className="capitalize text-dark-text-secondary">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-mono font-semibold text-white">{value} pts</span>
                        </div>
                    ))}
                    </div>
                </div>
            )}
             
            {data.strengths?.length > 0 && (
                 <div>
                    <h5 className="text-xs font-bold uppercase text-green-400 mb-2">Strengths</h5>
                    <ul className="list-disc pl-4 text-xs space-y-1 text-dark-text-secondary">
                        {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            )}

            {data.weaknesses?.length > 0 && (
                 <div>
                    <h5 className="text-xs font-bold uppercase text-red-400 mb-2">Weaknesses</h5>
                    <ul className="list-disc pl-4 text-xs space-y-1 text-dark-text-secondary">
                        {data.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};


const AgentChat: React.FC<{ open: boolean; onClose: () => void; lead: Lead | null; userEmail: string; onRunResearch: (lead: Lead) => void; }> = ({ open, onClose, lead, userEmail, onRunResearch }) => {
    const [loading, setLoading] = useState(false);
    const [summaryResult, setSummaryResult] = useState<ChatSummaryItem | null>(null);
    const [scoreResult, setScoreResult] = useState<ChatScoreItem | null>(null);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const { checkServiceAccess } = useAccessControl(setNotification);
    const [sessionId] = useState('s_' + Date.now());

    const runCommand = async (cmd: 'summary' | 'score') => {
        if (!lead) return;
        
        const isAllowed = await checkServiceAccess({ email: userEmail, service: 'lead-gen' });
        if (!isAllowed) return;

        setLoading(true);
        setError('');
        
        try {
            const commandResult = await n8n.runChatCommand({
                action: 'command',
                command: cmd,
                userEmail,
                sessionId,
                lead: {
                    name: lead.displayName,
                    email: lead.email,
                    linkedin: lead.linkedinUrl,
                    company: lead.company,
                    title: lead.title,
                    location: lead.location || lead.country,
                }
            });

            if (commandResult.type === 'summary') {
                const payload = commandResult.payload as ChatSummaryItem[];
                setSummaryResult(payload && payload.length > 0 ? payload[0] : null);
            } else if (commandResult.type === 'score') {
                 const payload = commandResult.payload as ChatScoreItem[];
                setScoreResult(payload && payload.length > 0 ? payload[0] : null);
            }

        } catch (e: any) {
            console.error(e);
            if (e.message === 'no_result' || e.message === 'invalid_score') {
                 setError('No result from AI. Try running research or try again.');
            } else {
                 setError(e.message || 'Network error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && lead) {
            setSummaryResult(null);
            setScoreResult(null);
            runCommand('summary');
        }
    }, [open, lead]);


    if (!open || !lead) return null;

    return (
        <AnimatePresence>
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
                <MotionDiv initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    className="absolute right-0 top-0 h-full w-full max-w-md bg-dark-card shadow-xl flex flex-col border-l border-dark-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    <header className="flex-shrink-0 p-4 border-b border-dark-border flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-lg text-white">AI Command Panel</h3>
                            <p className="text-xs text-dark-text-secondary">Lead: {lead?.displayName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-dark-bg">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </header>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {loading && <Spinner />}

                        {error && !loading && (
                            <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-lg border border-red-700">
                                <p className="font-semibold">An Error Occurred</p>
                                <p className="text-sm">{error}</p>
                                <div className="mt-3 flex gap-2">
                                    <button onClick={() => runCommand('summary')} className="text-xs px-2 py-1 rounded border border-red-500 hover:bg-red-500/20">Retry</button>
                                    <button onClick={() => { onClose(); onRunResearch(lead); }} className="text-xs px-2 py-1 rounded border border-red-500 hover:bg-red-500/20">Run Research</button>
                                </div>
                            </div>
                        )}

                        {!loading && !error && (
                            <>
                                {summaryResult && <SummaryCard data={summaryResult} lead={lead} />}
                                {scoreResult && <ScoreCard data={scoreResult} />}
                            </>
                        )}
                    </div>

                    <footer className="p-3 border-t border-dark-border flex-shrink-0 flex items-center gap-2">
                        <button onClick={() => runCommand('summary')} disabled={loading} className="flex-1 bg-dark-bg hover:bg-dark-border text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-wait">
                           {loading ? '...' : 'Get Summary'}
                        </button>
                        <button onClick={() => runCommand('score')} disabled={loading} className="flex-1 bg-dark-bg hover:bg-dark-border text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-wait">
                            {loading ? '...' : 'Get Score'}
                        </button>
                    </footer>
                </MotionDiv>
            </MotionDiv>
        </AnimatePresence>
    );
};

export default AgentChat;