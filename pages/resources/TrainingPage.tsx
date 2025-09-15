import React, { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { ICONS } from '../../constants';
import * as n8n from '../../services/n8nService';
import { UnifiedTrainingDoc, AddTrainingDocResponse } from '../../types';
import ActionNotification from '../../components/ActionNotification';
import SubPageHeader from '../../components/SubPageHeader';

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

// --- Sub-components ---interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
}


const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, prefix = "", suffix = "" }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    useEffect(() => {
        const controls = animate(animatedValue, value, {
            duration: 1, ease: "easeOut",
            onUpdate: latest => setAnimatedValue(latest)
        });
        return controls.stop;
    }, [value, animatedValue]);
    return <span>{prefix}{Math.round(animatedValue).toLocaleString()}{suffix}</span>;
};interface HeaderBusinessImpactProps {
  metrics: { totalRevenue: number, totalRuns: number, avgIq: number };
}


const HeaderBusinessImpact: React.FC<HeaderBusinessImpactProps> = ({ metrics }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400"><AnimatedCounter value={metrics.totalRevenue} prefix="$" /></p>
            <p className="text-xs text-dark-text-secondary mt-1">Total Revenue Unlocked</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white"><AnimatedCounter value={metrics.totalRuns} /></p>
            <p className="text-xs text-dark-text-secondary mt-1">Total Training Runs</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-brand-accent"><AnimatedCounter value={metrics.avgIq} suffix="%" /></p>
            <p className="text-xs text-dark-text-secondary mt-1">Average AI Intelligence</p>
        </div>
    </div>
);interface IQMeterProps {
  iq: number;
}


const IQMeter: React.FC<IQMeterProps> = ({ iq }) => (
    <div>
        <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs font-semibold text-dark-text-secondary">Agent IQ</span>
            <span className="text-lg font-bold text-brand-accent">{iq}%</span>
        </div>
        <div className="w-full bg-dark-bg h-2.5 rounded-full border border-dark-border"><motion.div className="bg-brand-primary h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${iq}%` }} /></div>
    </div>
);interface DocumentListProps {
  docs: UnifiedTrainingDoc[];
}


const DocumentList: React.FC<DocumentListProps> = ({ docs }) => {
    const statusPill = (status: string) => {
        const styles = {
            'Complete': 'bg-green-500/20 text-green-400',
            'Partial': 'bg-amber-500/20 text-amber-400',
            'Empty': 'bg-red-500/20 text-red-400',
        };
        return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status as keyof typeof styles]}`}>{status}</span>;
    };
    return (
        <div className="mt-4 pt-4 border-t border-dark-border space-y-2">
            <h4 className="text-sm font-bold text-white">Training Documents ({docs.length})</h4>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {docs.map(doc => (
                    <div key={doc.doc_id} className="bg-dark-bg p-2 rounded-md flex justify-between items-center text-sm">
                        <div>
                            <p className="font-semibold text-white">{doc.doc_name}</p>
                            <p className="text-xs text-dark-text-secondary">{doc.doc_type} • Updated: {doc.last_updated}</p>
                        </div>
                        {statusPill(doc.doc_status)}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AgentCard: React.FC<{ agentName: string, docs: UnifiedTrainingDoc[], isExpanded: boolean, onToggleExpand: () => void, onAddDocument: () => void }> = ({ agentName, docs, isExpanded, onToggleExpand, onAddDocument }) => {
    if (docs.length === 0) return null;
    const summary = docs[0];
    const iq = parsePercent(summary.agent_iq);
    const revenue = parseCurrency(summary.revenue_value);

    return (
        <motion.div layout className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-white">{agentName}</h3>
                    <div className="text-right">
                        <p className="font-bold text-lg text-green-400">${revenue.toLocaleString()}</p>
                        <p className="text-xs text-dark-text-secondary">{summary.revenue_share_percent} of revenue</p>
                    </div>
                </div>
                <p className="text-xs text-dark-text-secondary mt-2 h-8 line-clamp-2">Last summary: {stripQuotes(summary.last_summary)}</p>
                <div className="mt-3">
                    <IQMeter iq={iq} />
                </div>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <DocumentList docs={docs} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex gap-2 mt-4">
                <button onClick={onToggleExpand} className="flex-1 bg-dark-bg hover:bg-dark-border text-sm font-semibold py-2 rounded-lg">{isExpanded ? 'Collapse' : 'View Documents'}</button>
                <button onClick={onAddDocument} className="bg-brand-primary hover:bg-indigo-500 text-sm font-semibold py-2 px-4 rounded-lg">+</button>
            </div>
        </motion.div>
    );
};

const AddDocumentModal: React.FC<{ agentName: string, onClose: () => void, onSuccess: () => void }> = ({ agentName, onClose, onSuccess }) => {
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState('FAQ');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!docName.trim() || !docType.trim() || !content.trim()) {
            setError('All fields are required.');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                user_email: "alice@store.com",
                agent_name: agentName,
                doc_id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                doc_name: docName,
                doc_type: docType,
                doc_status: "Complete",
                uploaded_date: new Date().toISOString().split('T')[0],
                last_updated: new Date().toISOString().split('T')[0],
                content: content // The webhook might need the content
            };
            const response: AddTrainingDocResponse = await n8n.addUnifiedTrainingDoc(payload);
            if (Array.isArray(response) && response[0]?.status === 'Successfull') {
                onSuccess();
            } else {
                throw new Error('Webhook returned an unexpected response.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during submission.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-white text-lg">Add Document to {agentName}</h3>
                {error && <p className="text-red-400 text-sm bg-red-900/50 p-2 rounded-md">{error}</p>}
                <input value={docName} onChange={e=>setDocName(e.target.value)} placeholder="Document Name (e.g., Return Policy)" className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border" />
                <select value={docType} onChange={e=>setDocType(e.target.value)} className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border">
                    <option>FAQ</option><option>Company DNA</option><option>Product Data</option><option>Personality</option>
                </select>
                <textarea rows={8} value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste content here..." className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border font-mono" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} disabled={isSubmitting} className="bg-dark-bg hover:bg-dark-border px-4 py-2 text-sm rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-primary hover:bg-indigo-500 text-white font-semibold px-4 py-2 text-sm rounded-lg disabled:bg-slate-600">
                        {isSubmitting ? 'Adding...' : 'Add Document'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const TrainingPage: React.FC = () => {
    const [agentsData, setAgentsData] = useState<Record<string, UnifiedTrainingDoc[]>>({});
    const [globalMetrics, setGlobalMetrics] = useState({ totalRevenue: 0, totalRuns: 0, avgIq: 0 });
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
    const [modalState, setModalState] = useState<{ isOpen: boolean, agentName?: string }>({ isOpen: false });
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const docs = await n8n.fetchUnifiedTrainingData('alice@store.com');
            const groupedByAgent: Record<string, UnifiedTrainingDoc[]> = docs.reduce((acc, doc) => {
                acc[doc.agent_name] = acc[doc.agent_name] || [];
                acc[doc.agent_name].push(doc);
                return acc;
            }, {} as Record<string, UnifiedTrainingDoc[]>);
            setAgentsData(groupedByAgent);

            // Calculate global metrics from the denormalized data
            let totalRevenue = 0;
            let totalRuns = 0;
            let totalIq = 0;
            const uniqueAgents = Object.values(groupedByAgent);
            uniqueAgents.forEach(agentDocs => {
                if (agentDocs.length > 0) {
                    const summary = agentDocs[0];
                    totalRevenue += parseCurrency(summary.revenue_value);
                    totalRuns += parseInt(summary.runs_count, 10) || 0;
                    totalIq += parsePercent(summary.agent_iq);
                }
            });
            const avgIq = uniqueAgents.length > 0 ? Math.round(totalIq / uniqueAgents.length) : 0;
            setGlobalMetrics({ totalRevenue, totalRuns, avgIq });

        } catch (err: any) {
            setNotification({ message: `Failed to load training data: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleExpand = (agentName: string) => {
        setExpandedAgent(prev => (prev === agentName ? null : agentName));
    };

    const handleOpenModal = (agentName: string) => {
        setModalState({ isOpen: true, agentName });
    };

    const handleModalSuccess = () => {
        setModalState({ isOpen: false });
        setNotification({ message: 'Document added! Refreshing dashboard...', type: 'success' });
        fetchData();
    };

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SubPageHeader title="Unified Training Center" icon={ICONS.training} />
            <HeaderBusinessImpact metrics={globalMetrics} />
            {loading ? (
                <div className="text-center p-8 text-dark-text-secondary">Loading agent data...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(agentsData).map(([agentName, docs]) => (
                        <AgentCard 
                            key={agentName}
                            agentName={agentName}
                            docs={docs}
                            isExpanded={expandedAgent === agentName}
                            onToggleExpand={() => handleToggleExpand(agentName)}
                            onAddDocument={() => handleOpenModal(agentName)}
                        />
                    ))}
                </div>
            )}
            {modalState.isOpen && modalState.agentName && (
                <AddDocumentModal 
                    agentName={modalState.agentName}
                    onClose={() => setModalState({ isOpen: false })}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
};

export default TrainingPage;
