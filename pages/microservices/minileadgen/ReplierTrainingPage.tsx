import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import * as n8n from '../../../services/n8nService';
import { UnifiedTrainingDoc } from '../../../types';
import ActionNotification from '../../../components/ActionNotification';
import { ICONS } from '../../../constants';

// --- Helper Functions ---
const parseCurrency = (s: string = ''): number => {
    const num = Number(String(s).replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(num) ? num : 0;
};
const parsePercent = (s: string = ''): number => {
    const num = parseFloat(String(s).replace('%', ''));
    return Number.isFinite(num) ? num : 0;
};
const stripQuotes = (s: string = ''): string => s.replace(/^"+|"+$/g, '').trim();

// --- Sub-components ---interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}


const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, prefix = "", suffix = "", decimals = 0 }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    useEffect(() => {
        const controls = animate(animatedValue, value, {
            duration: 1.2, ease: "easeOut",
            onUpdate: latest => setAnimatedValue(latest)
        });
        return controls.stop;
    }, [value]);
    return <span>{prefix}{animatedValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};interface GapPanelProps {
  metrics: any;
}


const GapPanel: React.FC<GapPanelProps> = ({ metrics }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 text-center">🚨 YOUR LEAD GENERATION GAP</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white"><AnimatedCounter value={metrics.leadGenIq} suffix="%" /></p><p className="text-xs">Lead Gen IQ</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white"><AnimatedCounter value={metrics.responseAiIq} suffix="%" /></p><p className="text-xs">Response AI IQ</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-green-400"><AnimatedCounter value={metrics.currentRevenue} prefix="$" /></p><p className="text-xs">Current Revenue</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-amber-400"><AnimatedCounter value={metrics.potentialRevenue} prefix="$" /></p><p className="text-xs">Potential Revenue</p></div>
        </div>
        <div className="mt-4 pt-4 border-t border-dark-border text-center space-y-2">
            <p className="font-bold text-red-400 animate-shake">⚠️ You’re losing <AnimatedCounter value={metrics.lostRevenuePerWeek} prefix="$" decimals={0}/>/week in missed responses.</p>
            <p className="text-sm text-dark-text-secondary">Top 10% users run at 95% uptime. Yours: <span className="font-bold text-white">{metrics.uptime}%</span>.</p>
        </div>
    </div>
);

const TrainingWizardModal: React.FC<{ agentName: string, docType: string, onClose: () => void, onSuccess: () => void }> = ({ agentName, docType: initialDocType, onClose, onSuccess }) => {
    const [wizardStep, setWizardStep] = useState(1);
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState(initialDocType);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<{ conversion: number, revenue: number } | null>(null);

    const handlePredict = () => {
        // Mock prediction
        const conversion = Math.round(6 + Math.random() * 4);
        const revenue = Math.round(1500 + Math.random() * 500);
        setPrediction({ conversion, revenue });
        setWizardStep(2);
    };

    const handleSubmit = async () => {
        if (!docName.trim() || !subject.trim() || !body.trim()) {
            setError('All fields are required.');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                user_email: "demouser@zulari", agent_name: agentName,
                doc_id: `doc_${Date.now()}`, doc_name: docName, doc_type: docType, doc_status: "Complete",
                uploaded_date: new Date().toISOString().split('T')[0],
                last_updated: new Date().toISOString().split('T')[0],
                last_summary: `Trained to answer: '${subject}'`,
                conversion_rate: `Predicted +${prediction?.conversion || 8}%`,
                revenue_value: prediction?.revenue || 1600,
                revenue_share_percent: 18,
                content: `Subject: ${subject}\n\n${body}`
            };
            const response = await n8n.addResponseAiTemplate(payload);
            if (Array.isArray(response) && response[0]?.status === 'Successfull') {
                onSuccess();
            } else { throw new Error('Webhook returned an unexpected response.'); }
        } catch (err: any) {
            setError(err.message || 'An error occurred during submission.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
                <AnimatePresence mode="wait">
                    {wizardStep === 1 ? (
                        <motion.div key="step1" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            <h3 className="font-bold text-white text-lg">Step 1: Add Template Details</h3>
                            <input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Template Name (e.g., Hot Lead v1)" className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border mt-2" />
                            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject Line" className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border mt-2" />
                            <textarea rows={8} value={body} onChange={e => setBody(e.target.value)} placeholder="Message Body..." className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border font-mono mt-2" />
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={onClose} className="bg-dark-bg hover:bg-dark-border px-4 py-2 text-sm rounded-lg">Cancel</button>
                                <button onClick={handlePredict} disabled={!docName || !subject || !body} className="bg-brand-primary hover:bg-indigo-500 text-white font-semibold px-4 py-2 text-sm rounded-lg disabled:bg-slate-600">📊 Predict Performance</button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="step2" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                             <h3 className="font-bold text-white text-lg">Step 2: Predicted Impact</h3>
                             <div className="my-4 p-4 bg-dark-bg rounded-lg text-center">
                                <p className="text-green-400 text-2xl font-bold">+{prediction?.conversion}%</p>
                                <p className="text-xs text-dark-text-secondary">Predicted Conversion Lift</p>
                                <p className="text-green-400 text-2xl font-bold mt-2">${prediction?.revenue}</p>
                                <p className="text-xs text-dark-text-secondary">Expected Revenue Impact</p>
                             </div>
                             <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setWizardStep(1)} className="bg-dark-bg hover:bg-dark-border px-4 py-2 text-sm rounded-lg">Back</button>
                                <button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-secondary hover:bg-emerald-500 text-white font-semibold px-4 py-2 text-sm rounded-lg disabled:bg-slate-600">
                                    {isSubmitting ? 'Saving...' : '✅ Save Template'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


const TrainingHub: React.FC<{ onAddTemplate: (docType: string) => void }> = ({ onAddTemplate }) => {
    const scenarios = [ { name: 'Hot Lead Response', icon: '🔥' }, { name: 'Pricing Inquiry', icon: '💰' }, { name: 'Objection Handling', icon: '🤔' }, { name: 'Meeting Booking', icon: '📅' }];
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-white text-center">TRAINING HUB</h2>
            <p className="text-center text-dark-text-secondary text-sm mb-4">"Add a template. See the impact."</p>
            <div className="bg-dark-bg p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Step 1: Pick a scenario to train</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {scenarios.map(s => <button key={s.name} onClick={() => onAddTemplate(s.name)} className="bg-dark-border hover:bg-brand-primary/80 transition-colors p-3 rounded-lg text-left"><span className="text-xl">{s.icon}</span><p className="font-semibold text-white mt-1 text-sm">{s.name}</p></button>)}
                </div>
            </div>
        </div>
    );
};interface TemplateListProps {
  docs: any[];
}


const TemplateList: React.FC<TemplateListProps> = ({ docs }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-white">Current Response Templates</h2>
        <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-2">
            {docs.length > 0 ? docs.map(doc => (
                <div key={doc.doc_id} className="bg-dark-bg p-3 rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-white">{doc.doc_name}</p>
                        <p className="text-xs text-dark-text-secondary">{doc.doc_type}</p>
                    </div>
                    {doc.conversion_rate && <span className="text-sm font-bold text-green-400">{stripQuotes(doc.conversion_rate)}</span>}
                </div>
            )) : <p className="text-center text-sm text-dark-text-secondary py-8">No templates trained yet. Add one above!</p>}
        </div>
    </div>
);interface ProgressRewardsZoneProps {
  iq: number;
  docCount: number;
}


const ProgressRewardsZone: React.FC<ProgressRewardsZoneProps> = ({ iq, docCount }) => {
    const achievements = [
        { name: 'Beginner', threshold: 5, icon: '🏆' },
        { name: 'Conversion Pro', threshold: 20, icon: '🚀' },
    ];
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
                <h3 className="text-lg font-bold text-white mb-2">AI Intelligence Meter</h3>
                <div className="flex items-center gap-4">
                    <span className="font-bold text-3xl text-brand-accent">{iq}%</span>
                    <div className="w-full bg-dark-bg h-4 rounded-full border border-dark-border p-0.5"><motion.div className="bg-brand-primary h-full rounded-full" initial={{width:0}} animate={{width: `${iq}%`}} /></div>
                </div>
            </div>
            <div className="space-y-2">
                <div className="font-semibold text-white text-center">Achievements</div>
                <div className="flex justify-center gap-2">
                    {achievements.map(ach => (
                        <div key={ach.name} className={`px-3 py-1 rounded-full text-xs border ${docCount >= ach.threshold ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-dark-bg text-dark-text-secondary border-dark-border'}`}>
                            {ach.icon} {ach.name}
                        </div>
                    ))}
                </div>
                <div className="text-center text-xs text-dark-text-secondary font-semibold bg-dark-bg py-1 rounded-full">🔥 You've trained your AI 3 days in a row!</div>
            </div>
        </div>
    );
};


const ReplierTrainingPage: React.FC = () => {
    const [agentsData, setAgentsData] = useState<Record<string, UnifiedTrainingDoc[]>>({});
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDocType, setModalDocType] = useState('Hot Lead Response');

    const fetchData = useCallback(async () => {
        // Don't set loading on subsequent fetches to avoid UI flicker
        try {
            const docs = await n8n.fetchUnifiedTrainingData('demouser@zulari');
            const groupedByAgent = docs.reduce((acc, doc) => {
                if (['Lead Gen', 'Response AI'].includes(doc.agent_name)) {
                    acc[doc.agent_name] = acc[doc.agent_name] || [];
                    acc[doc.agent_name].push(doc);
                }
                return acc;
            }, {} as Record<string, UnifiedTrainingDoc[]>);
            if (!groupedByAgent['Response AI']) groupedByAgent['Response AI'] = [];
            setAgentsData(groupedByAgent);
        } catch (err: any) {
            setNotification({ message: `Failed to load data: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const metrics = useMemo(() => {
        const leadGenData = agentsData['Lead Gen']?.[0];
        const responseDocs = agentsData['Response AI'] || [];
        const responseAiSummary = responseDocs[0];

        if (!leadGenData) return { leadGenIq: 0, responseAiIq: 18, currentRevenue: 0, potentialRevenue: 0, lastSummary: 'N/A', runs: 0, lostRevenuePerWeek: 327, uptime: 32 };
        
        const currentRevenue = parseCurrency(leadGenData.revenue_value);
        const share = parsePercent(leadGenData.revenue_share_percent);
        const potentialRevenue = share > 0 ? currentRevenue / (share / 100) : 0;

        return {
            leadGenIq: parsePercent(leadGenData.agent_iq),
            responseAiIq: responseAiSummary ? parsePercent(responseAiSummary.agent_iq) : 18,
            currentRevenue, potentialRevenue,
            lastSummary: stripQuotes(leadGenData.last_summary),
            runs: parseInt(leadGenData.runs_count || '0', 10),
            lostRevenuePerWeek: (potentialRevenue - currentRevenue) / 4.33,
            uptime: 32
        };
    }, [agentsData]);

    const handleOpenModal = (docType: string) => {
        setModalDocType(docType);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        setIsModalOpen(false);
        setNotification({ message: `Template added successfully! IQ +5 points! 🚀`, type: 'success' });
        fetchData();
    };

    if (loading) {
        return <div className="text-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>;
    }
    
    const responseDocs = agentsData['Response AI'] || [];

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <GapPanel metrics={metrics} />
            <TrainingHub onAddTemplate={handleOpenModal} />
            <TemplateList docs={responseDocs} />
            <ProgressRewardsZone iq={metrics.responseAiIq} docCount={responseDocs.length} />
            {isModalOpen && (
                <TrainingWizardModal
                    agentName="Response AI"
                    docType={modalDocType}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
};

export default ReplierTrainingPage;
