import React, { useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
// FIX: Import 'animate' from framer-motion to resolve reference error.
import { motion, AnimatePresence, animate } from 'framer-motion';
import * as supportService from '../services/supportService';
import * as n8n from '../services/n8nService';
import { calcKPIs, parseTimestamp } from '../utils/supportUtils';
import ActionNotification from '../components/ActionNotification';
import SupportHero from '../components/support/SupportHero';
import SupportFiltersBar from '../components/support/SupportFiltersBar';
import SupportList from '../components/support/SupportList';
import SupportDetailDrawer from '../components/support/SupportDetailDrawer';
import SettingsModal from '../components/support/SettingsModal';
import { SupportRow, Status, Filter, UnifiedTrainingDoc, AddTrainingDocResponse, SupportChaosMetrics, EscalationRules, WebAITrainingDoc } from '../types';
import IntegrationBanner from '../components/IntegrationBanner';

type View = 'inbox' | 'training';

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


// --- New Support AI Training View ---
const SupportAITrainingView: React.FC = () => {
    const [docs, setDocs] = useState<UnifiedTrainingDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDocType, setModalDocType] = useState<WebAITrainingDoc['doc_type']>('FAQ');
    const [isSavingRules, setIsSavingRules] = useState(false);
    
    // Mock Data as per blueprint
    const chaosMetrics: SupportChaosMetrics = { unread_emails: 124, pending_chats: 32, avg_response_time: 4.5, after_hours_count: 56, latest_complaint_preview: "My order still hasn't arrived...", potential_auto_responses: 75 };
    const [escalationRules, setEscalationRules] = useState<EscalationRules>({ auto: ['Business hours & location', 'Shipping & return policy', 'Product availability'], manual: ['Refund requests', 'Complaints & angry tone', 'Custom orders'] });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const allDocs = await n8n.fetchUnifiedTrainingData('alice@store.com');
            setDocs(allDocs.filter(d => d.agent_name === 'Support AI'));
        } catch (e: any) {
            setNotification({ message: `Failed to fetch training data: ${e.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const calculateSupportAI_IQ = (docs: UnifiedTrainingDoc[], rules: EscalationRules) => {
        const iqBreakdown = {
            faq_count: 0, faq_points: 0, policy_count: 0, policy_points: 0,
            escalation_setup: 0, esc_pts: 0, total_iq: 0,
        };

        docs.forEach(doc => {
            if (doc.doc_type === 'FAQ' && doc.doc_status === 'Complete') {
                iqBreakdown.faq_count++;
                iqBreakdown.faq_points += 5;
            }
            if (['Policy', 'SOP', 'Company DNA'].includes(doc.doc_type) && doc.doc_status === 'Complete') {
                iqBreakdown.policy_count++;
                iqBreakdown.policy_points += 10;
            }
        });

        if (rules && (rules.auto.length > 0 || rules.manual.length > 0)) {
            iqBreakdown.escalation_setup = 1;
            iqBreakdown.esc_pts = 15;
        }

        iqBreakdown.total_iq = iqBreakdown.faq_points + iqBreakdown.policy_points + iqBreakdown.esc_pts;
        return iqBreakdown;
    };
    
    const iqData = useMemo(() => calculateSupportAI_IQ(docs, escalationRules), [docs, escalationRules]);

    const handleOpenModal = (docType: WebAITrainingDoc['doc_type']) => {
        setModalDocType(docType);
        setIsModalOpen(true);
    }
    
    const handleSuccess = () => {
        setIsModalOpen(false);
        setNotification({message: 'Document added successfully!', type: 'success'});
        fetchData();
    }
    
     const handleSaveRules = async () => {
        setIsSavingRules(true);
        setNotification(null);
        try {
            const payload = {
                user_email: "alice@store.com",
                agent_name: "Support AI",
                doc_id: `escalation_rules_${Date.now()}`,
                doc_name: "Escalation Rules",
                doc_type: "Policy",
                doc_status: "Complete",
                uploaded_date: new Date().toISOString().split('T')[0],
                last_updated: new Date().toISOString().split('T')[0],
                content: JSON.stringify(escalationRules)
            };
            const response: AddTrainingDocResponse = await n8n.addUnifiedTrainingDoc(payload);
            if (Array.isArray(response) && response[0]?.status === 'Successfull') {
                 setNotification({ message: 'Escalation rules saved successfully as a policy document!', type: 'success' });
                 fetchData();
            } else {
                throw new Error('Webhook returned an unexpected response for saving rules.');
            }
        } catch (err: any) {
            setNotification({ message: err.message || 'Failed to save rules.', type: 'error' });
        } finally {
            setIsSavingRules(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div></div>;
    }

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 text-center">😰 YOUR SUPPORT CHAOS</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-red-400"><AnimatedCounter value={chaosMetrics.unread_emails} /></p><p className="text-xs">Unread Emails</p></div>
                    <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-red-400"><AnimatedCounter value={chaosMetrics.pending_chats} /></p><p className="text-xs">Pending Chats</p></div>
                    <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-red-400"><AnimatedCounter value={chaosMetrics.avg_response_time} decimals={1} suffix="h" /></p><p className="text-xs">Avg Response</p></div>
                    <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-red-400"><AnimatedCounter value={chaosMetrics.after_hours_count} /></p><p className="text-xs">After-Hours Msgs</p></div>
                </div>
                <p className="text-center text-sm text-dark-text-secondary mt-4">💔 Latest customer: "{chaosMetrics.latest_complaint_preview}"</p>
                <p className="text-center text-sm font-bold text-brand-accent mt-2">👆 Your AI can handle {chaosMetrics.potential_auto_responses}% of these instantly!</p>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-2">🧠 AI INTELLIGENCE TRACKER</h2>
                <div className="flex items-center gap-4">
                    <p className="font-bold text-2xl text-brand-accent">{iqData.total_iq}/100</p>
                    <div className="w-full bg-dark-bg rounded-full h-4 border border-dark-border"><motion.div className="bg-brand-primary h-full rounded-full" initial={{width:0}} animate={{width: `${iqData.total_iq}%`}} /></div>
                </div>
                <div className="mt-2 text-xs text-dark-text-secondary">
                    <p>• FAQ docs: {iqData.faq_count} × 5 points = {iqData.faq_points}</p>
                    <p>• Policy docs: {iqData.policy_count} × 10 points = {iqData.policy_points}</p>
                    <p>• Escalation rules: {iqData.escalation_setup} × 15 points = {iqData.esc_pts}</p>
                </div>
            </div>

            <AddDocumentCard onAdd={handleOpenModal} iqPoints={5} />
            
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <h3 className="font-bold text-white mb-2">📊 Current Documents</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {docs.map(doc => (
                        <div key={doc.doc_id} className="bg-dark-bg p-2 rounded-md flex justify-between items-center text-sm">
                            <p>📄 {doc.doc_type}: {doc.doc_name}</p>
                            <span className="text-xs text-green-400 font-semibold">+ {doc.doc_type === 'FAQ' ? 5 : 10} IQ</span>
                        </div>
                    ))}
                </div>
            </div>
            
             <EscalationRulesCard rules={escalationRules} setRules={setEscalationRules} onSave={handleSaveRules} isSaving={isSavingRules} />

             <AnimatePresence>
                {isModalOpen && <AddDocumentModal agentName="Support AI" docType={modalDocType} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />}
             </AnimatePresence>
        </div>
    );
};

const AddDocumentModal: React.FC<{ agentName: string, docType: WebAITrainingDoc['doc_type'], onClose: () => void, onSuccess: () => void }> = ({ agentName, docType, onClose, onSuccess }) => {
    const [docName, setDocName] = useState('');
    const [currentDocType, setCurrentDocType] = useState(docType);
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
                doc_id: `doc_${Date.now()}`, doc_name: docName, doc_type: currentDocType,
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
                <select value={currentDocType} onChange={e=>setCurrentDocType(e.target.value as any)} className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border"><option>FAQ</option><option>Policy</option><option>SOP</option><option>Chat Scripts</option></select>
                <input value={docName} onChange={e=>setDocName(e.target.value)} placeholder="Document Title (e.g., Return Policy)" className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border" />
                <textarea rows={8} value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste content here..." className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border font-mono" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} disabled={isSubmitting} className="bg-dark-bg hover:bg-dark-border px-4 py-2 text-sm rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-primary hover:bg-indigo-500 text-white font-semibold px-4 py-2 text-sm rounded-lg disabled:bg-slate-600">{isSubmitting ? 'Adding...' : '✅ Add Document'}</button>
                </div>
            </div>
        </div>
    );
};

const AddDocumentCard: React.FC<{ onAdd: (type: WebAITrainingDoc['doc_type']) => void, iqPoints: number }> = ({ onAdd, iqPoints }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">📚 TEACH YOUR AI</h2>
        <div className="flex flex-wrap gap-2 mb-4">
            {(['FAQ', 'Policy', 'SOP', 'Chat Scripts'] as const).map(type => (
                <button key={type} onClick={() => onAdd(type)} className="bg-dark-bg hover:bg-dark-border text-sm font-semibold py-2 px-3 rounded-lg">📋 {type}</button>
            ))}
        </div>
        <p className="text-sm text-brand-accent font-semibold">🎯 This will add +{iqPoints} IQ points and handle return questions!</p>
    </div>
);

const EscalationRulesCard: React.FC<{ rules: EscalationRules, setRules: (rules: EscalationRules) => void, onSave: () => Promise<void>, isSaving: boolean }> = ({ rules, setRules, onSave, isSaving }) => {
    const allRules = {
        auto: ['Business hours & location', 'Shipping & return policy', 'Product availability', 'Basic how-to questions'],
        manual: ['Refund requests', 'Complaints & angry tone', 'Technical problems', 'Custom orders']
    };

    const handleToggle = (type: 'auto' | 'manual', rule: string) => {
        const currentList = rules[type];
        const newList = currentList.includes(rule) ? currentList.filter(r => r !== rule) : [...currentList, rule];
        setRules({ ...rules, [type]: newList });
    };
    
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
             <h2 className="text-xl font-bold text-white mb-4">🛡️ ESCALATION RULES</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-bold text-white mb-2">🤖 AI Handles Automatically:</h3>
                    <div className="space-y-2">{allRules.auto.map(rule => <label key={rule} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rules.auto.includes(rule)} onChange={() => handleToggle('auto', rule)} /> {rule}</label>)}</div>
                </div>
                 <div>
                    <h3 className="font-bold text-white mb-2">🙋 Escalate to You:</h3>
                    <div className="space-y-2">{allRules.manual.map(rule => <label key={rule} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rules.manual.includes(rule)} onChange={() => handleToggle('manual', rule)} /> {rule}</label>)}</div>
                </div>
             </div>
             <button onClick={onSave} disabled={isSaving} className="mt-4 bg-dark-bg hover:bg-dark-border text-sm font-semibold py-2 px-4 rounded-lg disabled:bg-slate-600">
                {isSaving ? 'Saving...' : '💾 Save Rules'}
             </button>
        </div>
    );
};


const CustomerSupportAIDashboardPage: React.FC = () => {
    const [allRows, setAllRows] = useState<SupportRow[]>([]);
    const [kpis, setKpis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('pending');
    const [selectedRow, setSelectedRow] = useState<SupportRow | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [view, setView] = useState<View>('inbox');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const loadingRef = useRef(false);

    const fetchData = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const data = await supportService.fetchSheetData();
            const mappedRows = supportService.mapValuesToObjects(data.values);
            setAllRows(mappedRows);
            setKpis(calcKPIs(mappedRows));
        } catch (e: any) {
            setError(e.message || "Failed to fetch data.");
            setAllRows([]);
            setKpis(null);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (action: 'approve' | 'escalate', row: SupportRow, notes?: string) => {
        const newStatus: Status = action === 'approve' ? 'Complete' : 'Escalated';
        const optimisticRows = allRows.map(r => r.rowNumber === row.rowNumber ? {...r, Status: newStatus} : r);
        setAllRows(optimisticRows);
        setSelectedRow(null);

        try {
            await supportService.patchRow(row.rowNumber, { 
                Status: newStatus,
                HumanResponse: action === 'approve' ? "Approved via UI" : "Escalated via UI",
                "CRM Notes": notes || ""
            });
            
            await supportService.postAction({
                action,
                userEmail: "demo@zulari.app",
                rowNumber: row.rowNumber,
                customerName: row['Customer Name'],
                customerEmail: row['Customer Email Address'],
                subject: row['Inquiry Topic'],
                notes: notes || `Actioned via UI`
            });

            setNotification({ message: `Your ${action} is queued. You’ll receive a confirmation email shortly.`, type: 'success' });
            setTimeout(() => fetchData(), 1000);
        } catch(e: any) {
            setNotification({ message: `Action failed: ${e.message}`, type: 'error' });
            fetchData(); // Revert
        }
    };

    const filteredRows = useMemo(() => {
        const today = new Date().toDateString();
        switch (filter) {
            case 'today':
                return allRows.filter(r => parseTimestamp(r.Timestamp)?.toDateString() === today);
            case 'pending':
                return allRows.filter(r => ['Pending', 'In Progress', 'New'].includes(r.Status as string));
            case 'escalated':
                 return allRows.filter(r => String(r['Escalation Flag']).toUpperCase() === 'TRUE' || String(r['Escalation Flag']).toUpperCase() === 'YES' || r.Status === 'Escalated');
            case 'completed':
                return allRows.filter(r => r.Status === 'Complete');
            case 'all':
            default:
                return allRows;
        }
    }, [allRows, filter]);
    
    const groupedRows = useMemo(() => {
        const groups: { [key: string]: SupportRow[] } = { Today: [], Yesterday: [], Older: [] };
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        filteredRows.forEach(row => {
            const date = parseTimestamp(row.Timestamp);
            if (!date) {
                groups.Older.push(row);
                return;
            }
            const dateString = date.toDateString();
            if (dateString === today) groups.Today.push(row);
            else if (dateString === yesterday) groups.Yesterday.push(row);
            else groups.Older.push(row);
        });
        
        return Object.entries(groups)
            .map(([title, items]) => ({ title, items }))
            .filter(g => g.items.length > 0);
    }, [filteredRows]);

    return (
        <div className="space-y-6">
             <IntegrationBanner serviceName="Support AI" required={['Gmail']}>
                {notification && <ActionNotification message={notification.message} type={notification.type} />}
                <SupportHero 
                    kpis={kpis}
                    loading={loading}
                    onSync={fetchData}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />
                
                <div className="flex items-center justify-between">
                    <SupportFiltersBar activeFilter={filter} setFilter={setFilter} />
                    <div className="flex items-center gap-2 p-1 bg-dark-card rounded-lg border border-dark-border">
                        <button onClick={() => setView('inbox')} className={`px-3 py-1 text-sm rounded-md ${view === 'inbox' ? 'bg-brand-primary' : ''}`}>Inbox</button>
                        <button onClick={() => setView('training')} className={`px-3 py-1 text-sm rounded-md ${view === 'training' ? 'bg-brand-primary' : ''}`}>Training</button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {view === 'inbox' ? (
                            <SupportList
                                loading={loading}
                                error={error}
                                groupedRows={groupedRows}
                                onSelectRow={setSelectedRow}
                                onRetry={fetchData}
                            />
                        ) : (
                            <SupportAITrainingView />
                        )}
                    </motion.div>
                </AnimatePresence>

                <SupportDetailDrawer
                    row={selectedRow}
                    onClose={() => setSelectedRow(null)}
                    onAction={handleAction}
                />
                
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
                <footer className="text-center text-xs text-dark-text-secondary mt-4">
                    Only your sheet data is used. We never send customer data anywhere except the training & settings webhooks you explicitly call.
                </footer>
            </IntegrationBanner>
        </div>
    );
};

export default CustomerSupportAIDashboardPage;