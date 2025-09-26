import React, { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import * as salesService from '../services/salesService';
import * as n8n from '../services/n8nService';
import { deriveRow } from '../utils/salesUtils';
import { computeKpisRobust } from '../utils/computeKpisRobust';
import { SalesRow, SalesFilter, SalesKpis, UnifiedTrainingDoc, AddTrainingDocResponse, WebAITrainingDoc, SalesEscalationRules } from '../types';
import { computeSalesAgentIQ } from '../utils/trainingUtils';
import ActionNotification from '../components/ActionNotification';
import SalesHero from '../components/sales/SalesHero';
import SalesFilterBar from '../components/sales/SalesFilterBar';
import SalesList from '../components/sales/SalesList';
import SalesDetailDrawer from '../components/sales/SalesDetailDrawer';
import SalesSettingsModal from '../components/sales/SalesSettingsModal';
import IntegrationBanner from '../components/IntegrationBanner';

type View = 'inbox' | 'training';

// --- Helper Functions ---
const parseCurrency = (s: string = ''): number => {
    const num = Number(String(s).replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(num) ? num : 0;
};
const parsePercent = (s: string = ''): number => {
    const num = parseFloat(String(s).replace('%', ''));
    return Number.isFinite(num) ? num : 0;
};
const stripQuotes = (s: string = '') => s.replace(/^"+|"+$/g, '').trim();

const AnimatedCounter: React.FC<{ value: number, prefix?: string, suffix?: string, decimals?: number }> = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        const controls = animate(animatedValue, value, {
            duration: 1.2,
            ease: "easeOut",
            onUpdate: (latest) => setAnimatedValue(latest)
        });
        return () => controls.stop();
    }, [value, animatedValue]);

    return <span>{prefix}{animatedValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};


// --- New Sales AI Training View Components ---

const RevenueLeakagePanel: React.FC<{ data: any }> = ({ data }) => (
    <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-bold text-white mb-2">💸 REVENUE LEAKAGE</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span>Pipeline Unlocked:</span><span className="font-bold text-white text-right"><AnimatedCounter value={data.pipelineUnlocked} prefix="$" /></span>
            <span>Share:</span><span className="font-bold text-white text-right"><AnimatedCounter value={data.share} suffix="%" /> of total</span>
            <span>Runs:</span><span className="font-bold text-white text-right"><AnimatedCounter value={data.runs} /></span>
        </div>
        <p className="text-xs text-dark-text-secondary mt-2">Last Win: "{data.lastWin}"</p>
        <div className="mt-3 pt-3 border-t border-dark-border text-center animate-shake">
            <p className="text-red-400 font-bold text-xl"><AnimatedCounter value={data.revenueAtRisk} prefix="$" /></p>
            <p className="text-xs text-red-400/80">⚠️ At Risk (lost to competitors / missed follow-up)</p>
        </div>
    </div>
);

const SalesIQMeter: React.FC<{ iq: number, docs: UnifiedTrainingDoc[] }> = ({ iq, docs }) => (
    <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
        <h3 className="text-lg font-bold text-white mb-2">🎯 SALES IQ METER</h3>
        <div className="flex items-center gap-4">
            <span className="font-bold text-2xl text-brand-accent">{iq}%</span>
            <div className="w-full bg-dark-card rounded-full h-4 border border-dark-border p-0.5">
                <motion.div className="bg-brand-primary h-full rounded-full" initial={{ width: '0%' }} animate={{ width: `${iq}%` }} />
            </div>
        </div>
        <div className="text-xs text-dark-text-secondary mt-2">
            <p>Docs: {docs.length}/5 critical assets added</p>
            <p className="font-semibold text-brand-accent">Next Unlock: +Case Study (+20 pts) → Closer Level</p>
        </div>
    </div>
);

const SalesDocsTable: React.FC<{ docs: UnifiedTrainingDoc[], onAdd: () => void }> = ({ docs, onAdd }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
        <h2 className="text-xl font-bold text-white mb-2">🏗️ Build Your Sales Machine</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {docs.length > 0 ? docs.map(doc => (
                <div key={doc.doc_id} className="bg-dark-bg p-3 rounded-md">
                    <p className="font-semibold">📄 {doc.doc_name} ({doc.doc_type})</p>
                    <p className="text-xs text-dark-text-secondary">Status: {doc.doc_status} | Last Updated: {doc.last_updated}</p>
                    <p className="text-xs text-dark-text-secondary">Summary: "{stripQuotes(doc.last_summary)}"</p>
                </div>
            )) : <p className="text-sm text-center text-dark-text-secondary py-4">No documents trained yet.</p>}
        </div>
        <button onClick={onAdd} className="w-full mt-4 bg-dark-bg hover:bg-dark-border font-semibold py-2 rounded-lg">+ Add Document</button>
    </div>
);

const EscalationRules: React.FC<{ rules: SalesEscalationRules, setRules: (rules: SalesEscalationRules) => void, onSave: () => void, isSaving: boolean }> = ({ rules, setRules, onSave, isSaving }) => {
    const handleToggle = (type: 'auto' | 'manual', rule: string) => {
        const currentList = rules[type];
        const newList = currentList.includes(rule) ? currentList.filter(r => r !== rule) : [...currentList, rule];
        setRules({ ...rules, [type]: newList });
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <h2 className="text-xl font-bold text-white mb-2">Smart Escalation Rules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="font-bold mb-2">🤖 AI Handles:</h3>
                    <div className="space-y-2">{['Pricing questions', 'Meeting booking', 'Initial qualification'].map(rule => <label key={rule} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rules.auto.includes(rule)} onChange={() => handleToggle('auto', rule)} /> {rule}</label>)}</div>
                </div>
                 <div>
                    <h3 className="font-bold mb-2">🙋 Escalates to You:</h3>
                    <div className="space-y-2">{['Deals > $10K', 'Angry/frustrated prospects', 'Contract negotiations'].map(rule => <label key={rule} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rules.manual.includes(rule)} onChange={() => handleToggle('manual', rule)} /> {rule}</label>)}</div>
                </div>
            </div>
            <button onClick={onSave} disabled={isSaving} className="mt-4 bg-dark-bg hover:bg-dark-border text-sm font-semibold py-2 px-4 rounded-lg">{isSaving ? 'Saving...' : '💾 Save Rules'}</button>
        </div>
    );
};

const AddDocumentModal: React.FC<{ agentName: string, onClose: () => void, onSuccess: () => void }> = ({ agentName, onClose, onSuccess }) => {
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState<WebAITrainingDoc['doc_type']>('Product Data');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setError(null);
        if (!docName.trim() || !content.trim()) { setError('Name and content are required.'); return; }
        setIsSubmitting(true);
        try {
            const payload = {
                user_email: "alice@store.com", agent_name: agentName,
                doc_id: `doc_${Date.now()}`, doc_name: docName, doc_type: docType,
                doc_status: "Complete", uploaded_date: new Date().toISOString().split('T')[0],
                last_updated: new Date().toISOString().split('T')[0], content
            };
            const response: AddTrainingDocResponse = await n8n.addUnifiedTrainingDoc(payload);
            if (Array.isArray(response) && response[0]?.status === 'Successfull') onSuccess();
            else throw new Error('Webhook returned an unexpected response.');
        } catch (err: any) { setError(err.message || 'Submission failed.');
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-white text-lg">Add Document to {agentName}</h3>
                {error && <p className="text-red-400 text-sm bg-red-900/50 p-2 rounded-md">{error}</p>}
                <select value={docType} onChange={e=>setDocType(e.target.value as any)} className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border">
                    <option>Product Data</option><option>Pricing Guide</option><option>Case Study</option><option>Objection Handling</option><option>Meeting Templates</option>
                </select>
                <input value={docName} onChange={e=>setDocName(e.target.value)} placeholder="Document Title (e.g., Enterprise Pricing)" className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border" />
                <textarea rows={8} value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste content here..." className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border font-mono" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} disabled={isSubmitting} className="bg-dark-bg hover:bg-dark-border px-4 py-2 text-sm rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-primary hover:bg-indigo-500 text-white font-semibold px-4 py-2 text-sm rounded-lg disabled:bg-slate-600">{isSubmitting ? 'Adding...' : '✅ Add & Train'}</button>
                </div>
            </div>
        </div>
    );
};

const SalesAITrainingView: React.FC = () => {
    const [docs, setDocs] = useState<UnifiedTrainingDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSavingRules, setIsSavingRules] = useState(false);
    const [escalationRules, setEscalationRules] = useState<SalesEscalationRules>({
        auto: ['Pricing questions', 'Meeting booking', 'Initial qualification'],
        manual: ['Deals > $10K', 'Angry/frustrated prospects', 'Contract negotiations']
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const allDocs = await n8n.fetchUnifiedTrainingData('alice@store.com');
            setDocs(allDocs.filter(d => d.agent_name === 'Sales AI'));
        } catch (e: any) {
            setNotification({ message: `Failed to fetch training data: ${e.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const salesSummary = useMemo(() => docs.length > 0 ? docs[0] : null, [docs]);

    const revenueMetrics = useMemo(() => {
        if (!salesSummary) return { pipelineUnlocked: 0, share: 0, runs: 0, lastWin: '', revenueAtRisk: 0 };
        const pipelineUnlocked = parseCurrency(salesSummary.revenue_value);
        const share = parsePercent(salesSummary.revenue_share_percent);
        const revenueAtRisk = share > 0 ? (pipelineUnlocked / share) * (100 - share) : pipelineUnlocked * 2.5;
        return {
            pipelineUnlocked,
            share,
            runs: parseInt(salesSummary.runs_count || '0', 10),
            lastWin: stripQuotes(salesSummary.last_summary),
            revenueAtRisk
        };
    }, [salesSummary]);
    
    const iqScore = useMemo(() => salesSummary ? parsePercent(salesSummary.agent_iq) : 0, [salesSummary]);

    const handleSaveRules = async () => {
        setIsSavingRules(true);
        try {
            const payload = {
                user_email: "alice@store.com", agent_name: "Sales AI", doc_name: "Sales Escalation Rules",
                doc_type: "Policy", doc_status: "Complete", uploaded_date: new Date().toISOString().split('T')[0],
                last_updated: new Date().toISOString().split('T')[0], content: JSON.stringify(escalationRules)
            };
            await n8n.addUnifiedTrainingDoc(payload);
            setNotification({ message: 'Escalation rules saved!', type: 'success' });
            fetchData();
        } catch (err: any) {
            setNotification({ message: err.message || 'Failed to save rules.', type: 'error' });
        } finally {
            setIsSavingRules(false);
        }
    };
    
    if (loading) return <div className="text-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>;

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueLeakagePanel data={revenueMetrics} />
                <SalesIQMeter iq={iqScore} docs={docs} />
            </div>
            <SalesDocsTable docs={docs} onAdd={() => setIsModalOpen(true)} />
            <EscalationRules rules={escalationRules} setRules={setEscalationRules} onSave={handleSaveRules} isSaving={isSavingRules} />
            
            <AnimatePresence>
                {isModalOpen && <AddDocumentModal agentName="Sales AI" onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchData(); setNotification({ message: 'Training data added!', type: 'success' }); }} />}
            </AnimatePresence>
        </div>
    );
};

// --- Main Page Component ---
const SalesAIAgentDashboardPage: React.FC = () => {
    const [view, setView] = useState<View>('training'); // Default to training view
    const [kpis, setKpis] = useState<SalesKpis | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [selectedRow, setSelectedRow] = useState<SalesRow | null>(null);
    
    const pageContent = (
        <>
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SalesHero kpis={kpis} isLoading={loading} isPaused={isPaused} onPauseToggle={() => setIsPaused(!isPaused)} onSync={() => {}} onOpenSettings={() => setIsSettingsOpen(true)} onOpenTraining={() => setView('training')} />
            
            <div className="flex items-center gap-2 p-1 bg-dark-card rounded-lg border border-dark-border self-start">
                <button onClick={() => setView('inbox')} className={`px-3 py-1 text-sm rounded-md ${view === 'inbox' ? 'bg-brand-primary' : ''}`}>Inbox</button>
                <button onClick={() => setView('training')} className={`px-3 py-1 text-sm rounded-md ${view === 'training' ? 'bg-brand-primary' : ''}`}>Training</button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {view === 'inbox' ? (
                        <div className="text-center p-8 bg-dark-card rounded-lg border border-dark-border">
                            <h3 className="font-bold text-white">Inbox View</h3>
                            <p className="text-dark-text-secondary">This area is for managing live sales conversations.</p>
                        </div>
                    ) : <SalesAITrainingView />}
                </motion.div>
            </AnimatePresence>

            <SalesDetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} onAction={() => {}} />
            <SalesSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );

    return (
        <div className="space-y-6">
            <IntegrationBanner serviceName="Sales AI" required={['Gmail', 'Calendar']}>
                {pageContent}
            </IntegrationBanner>
        </div>
    );
};

export default SalesAIAgentDashboardPage;