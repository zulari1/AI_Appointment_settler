

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { ICONS } from '../constants';
import { ResearchReport } from '../types';
import * as researchService from '../services/n8nService';
import ActionNotification from '../components/ActionNotification';
import DOMPurify from 'dompurify';
import InfoTooltip from '../components/InfoTooltip';

type ResearchMode = 'competitor_analysis' | 'website_audit' | 'keyword_research';
type JobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

// --- FORM COMPONENTS (as per new blueprint) ---interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}


const FormField: React.FC<FormFieldProps> = ({ label, children, required, hint }) => (
    <div>
        <label className="block text-sm font-medium text-dark-text-secondary mb-1.5">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        {children}
        {hint && <p className="text-xs text-dark-text-secondary/70 mt-1.5">💡 {hint}</p>}
    </div>
);

const RadioGroup: React.FC<{ options: {value: string, label: string}[], name: string, selectedValue: string, onChange: (value: string) => void }> = ({ options, name, selectedValue, onChange }) => (
    <div className="flex flex-wrap gap-2">
        {options.map(opt => (
            <label key={opt.value} className={`cursor-pointer px-3 py-2 text-sm rounded-lg border-2 transition-colors ${selectedValue === opt.value ? 'bg-brand-primary/20 border-brand-primary' : 'bg-dark-bg border-dark-border hover:border-dark-text-secondary'}`}>
                <input type="radio" name={name} value={opt.value} checked={selectedValue === opt.value} onChange={e => onChange(e.target.value)} className="sr-only" />
                {opt.label}
            </label>
        ))}
    </div>
);

const CheckboxGroup: React.FC<{ options: string[], selectedValues: string[], onChange: (value: string) => void }> = ({ options, selectedValues, onChange }) => (
    <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
            <label key={opt} className={`cursor-pointer p-2 text-sm rounded-lg border flex items-center gap-2 transition-colors ${selectedValues.includes(opt) ? 'bg-brand-primary/20 border-brand-primary' : 'bg-dark-bg border-dark-border hover:border-dark-text-secondary'}`}>
                <input type="checkbox" checked={selectedValues.includes(opt)} onChange={() => onChange(opt)} className="h-4 w-4 rounded bg-dark-border text-brand-primary focus:ring-brand-primary" />
                {opt}
            </label>
        ))}
    </div>
);interface CompetitorAnalysisFormProps {
  formState: any;
  setFormState: any;
  isBusy: boolean;
}


const CompetitorAnalysisForm: React.FC<CompetitorAnalysisFormProps> = ({ formState, setFormState, isBusy }) => {
    const handleChange = (field: string, value: any) => setFormState((prev: any) => ({ ...prev, [field]: value }));
    const handleAdditionalCompetitorChange = (index: number, value: string) => {
        const newCompetitors = [...formState.additionalCompetitors];
        newCompetitors[index] = value;
        handleChange('additionalCompetitors', newCompetitors);
    };
    const addCompetitorField = () => handleChange('additionalCompetitors', [...formState.additionalCompetitors, '']);

    return (
        <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <FormField label="Target Keyword" required hint="The main keyword you want to compete for.">
                    <input type="text" value={formState.keyword} onChange={e => handleChange('keyword', e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isBusy} />
                </FormField>
                <FormField label="Primary Competitor URL" required hint="Your biggest competitor's website.">
                    <input type="url" value={formState.competitorUrl} onChange={e => handleChange('competitorUrl', e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isBusy} />
                </FormField>
            </div>
             <FormField label="Additional Competitors" hint="Add up to 3 more competitors for a broader analysis.">
                {formState.additionalCompetitors.map((c: string, i: number) => (
                    <input key={i} type="url" value={c} onChange={e => handleAdditionalCompetitorChange(i, e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 mt-1" disabled={isBusy} />
                ))}
                {formState.additionalCompetitors.length < 3 && <button type="button" onClick={addCompetitorField} className="text-xs text-brand-accent mt-1">+ Add More</button>}
            </FormField>
             <div className="grid md:grid-cols-2 gap-4">
                <FormField label="Industry/Niche" required hint="Helps contextualize competitive landscape.">
                    <select value={formState.industry} onChange={e => handleChange('industry', e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isBusy}>
                        <option>SaaS</option><option>E-commerce</option><option>Professional Services</option><option>Healthcare</option>
                    </select>
                </FormField>
                 <FormField label="Geographic Focus" hint="Target market location.">
                    <select value={formState.region} onChange={e => handleChange('region', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isBusy}>
                        <option>United States</option><option>Europe</option><option>Global</option>
                    </select>
                </FormField>
            </div>
            <FormField label="Analysis Depth">
                <RadioGroup name="analysisDepth" selectedValue={formState.analysisDepth} onChange={v => handleChange('analysisDepth', v)} options={[{value: 'quick', label: 'Quick Scan (~5 min)'}, {value: 'deep', label: 'Deep Dive (~15 min)'}]} />
            </FormField>
        </div>
    );
};interface WebsiteAuditFormProps {
  formState: any;
  setFormState: any;
  isBusy: boolean;
}


const WebsiteAuditForm: React.FC<WebsiteAuditFormProps> = ({ formState, setFormState, isBusy }) => {
    const handleChange = (field: string, value: any) => setFormState((prev: any) => ({ ...prev, [field]: value }));
    const handleGoalChange = (goal: string) => {
        const newGoals = formState.primaryGoals.includes(goal) ? formState.primaryGoals.filter((g: string) => g !== goal) : [...formState.primaryGoals, goal];
        handleChange('primaryGoals', newGoals);
    };

    return (
        <div className="space-y-4">
             <FormField label="Your Website URL" required hint="The site you want us to analyze.">
                <input type="url" value={formState.siteUrl} onChange={e => handleChange('siteUrl', e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isBusy} />
            </FormField>
             <FormField label="Primary Goals" hint="Select all that apply.">
                <CheckboxGroup options={['Increase Conversions', 'Improve SEO', 'Better UX', 'Mobile Optimization']} selectedValues={formState.primaryGoals} onChange={handleGoalChange} />
            </FormField>
            <FormField label="Report Tone/Style">
                <RadioGroup name="reportTone" selectedValue={formState.reportTone} onChange={v => handleChange('reportTone', v)} options={[{value: 'Executive Summary', label: 'Executive Summary'}, {value: 'Technical Deep-dive', label: 'Technical Deep-dive'}, {value: 'Action-Focused', label: 'Action-Focused'}]} />
            </FormField>
        </div>
    );
};interface KeywordResearchFormProps {
  formState: any;
  setFormState: any;
  isBusy: boolean;
}


const KeywordResearchForm: React.FC<KeywordResearchFormProps> = ({ formState, setFormState, isBusy }) => {
    const handleChange = (field: string, value: any) => setFormState((prev: any) => ({ ...prev, [field]: value }));

    return (
        <div className="space-y-4">
             <FormField label="Seed Keywords" required hint="2-5 main keywords in your market.">
                <input type="text" value={formState.seedKeywords} onChange={e => handleChange('seedKeywords', e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isBusy} />
            </FormField>
             <FormField label="Market/Industry" required hint="Your business sector.">
                 <select value={formState.industry} onChange={e => handleChange('industry', e.target.value)} required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isBusy}>
                    <option>Digital Marketing</option><option>SaaS</option><option>E-commerce</option><option>Finance</option>
                </select>
            </FormField>
             <FormField label="Keyword Difficulty Preference">
                 <RadioGroup name="difficulty" selectedValue={formState.difficulty} onChange={v => handleChange('difficulty', v)} options={[{value: 'easy', label: 'Easy Wins'}, {value: 'balanced', label: 'Balanced Mix'}, {value: 'high_value', label: 'High Value Targets'}]} />
            </FormField>
        </div>
    );
};interface ProcessingStateProps {
  message: string;
}


const ProcessingState: React.FC<ProcessingStateProps> = ({ message }) => {
    const stages = ["SERP Data Collection", "Competitor Page Crawling", "AI Intelligence Analysis", "Report Generation"];
    let currentStageIndex = -1;
    if (message.includes("SERP") || message.includes("Submitting")) currentStageIndex = 0;
    if (message.includes("Crawling")) currentStageIndex = 1;
    if (message.includes("Analyzing")) currentStageIndex = 2;
    if (message.includes("complete")) currentStageIndex = 3;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-dark-card border-2 border-brand-primary/50 rounded-xl p-6 shadow-lg text-center"
        >
            <h3 className="text-xl font-bold text-white mb-2">🤖 AI Analysis in Progress</h3>
            <div className="w-full bg-dark-bg rounded-full h-2.5 my-4">
                <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${(currentStageIndex + 1) / stages.length * 100}%` }}></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-dark-text-secondary">
                {stages.map((stage, i) => (
                    <div key={stage} className={`flex items-center gap-1.5 ${currentStageIndex >= i ? 'text-white' : ''}`}>
                        <span className={`transition-colors ${currentStageIndex > i ? 'text-green-400' : ''}`}>
                            {currentStageIndex > i ? '✅' : '⏳'}
                        </span>
                        <span>{stage}</span>
                    </div>
                ))}
            </div>
             <p className="text-sm text-dark-text-secondary mt-4">{message}</p>
        </motion.div>
    );
};


const ResearchAgentPage: React.FC = () => {
    const user = { email: 'demo@zulari.app' };
    const [mode, setMode] = useState<ResearchMode>('competitor_analysis');
    
    // Form states
    const [competitorForm, setCompetitorForm] = useState({ keyword: '', competitorUrl: '', additionalCompetitors: [''], industry: 'SaaS', region: 'United States', analysisDepth: 'quick' });
    const [auditForm, setAuditForm] = useState({ siteUrl: '', primaryGoals: [], reportTone: 'Executive Summary' });
    const [keywordForm, setKeywordForm] = useState({ seedKeywords: '', industry: 'Digital Marketing', difficulty: 'easy' });

    const [jobState, setJobState] = useState<{ status: JobStatus, runId: string | null, message: string }>({ status: 'idle', runId: null, message: '' });
    const [reports, setReports] = useState<ResearchReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
    
    const pollerRef = useRef<{ stop: () => void } | null>(null);

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await researchService.fetchReportsForUser(user.email, 1, 100);
            setReports(data.reports || []);
        } catch (err: any) {
            setNotification({ message: `Failed to load reports: ${err.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [user.email]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setNotification(null);

        let inputPayload = {};
        if (mode === 'competitor_analysis') {
            inputPayload = { ...competitorForm, crawl_depth: competitorForm.analysisDepth === 'deep' ? 3 : 1 };
        } else if (mode === 'website_audit') {
            inputPayload = { ...auditForm };
        } else if (mode === 'keyword_research') {
            inputPayload = { ...keywordForm, query: keywordForm.seedKeywords.split(',')[0].trim() };
        }

        const payload = {
            idempotencyKey: `research-${Date.now()}`,
            request_type: mode,
            email: user.email,
            timestamp: new Date().toISOString(),
            input: inputPayload,
        };

        setJobState({ status: 'processing', runId: null, message: 'Submitting request...' });
        try {
            // Mocking the API call
            await new Promise(res => setTimeout(res, 1000));
            const response = { status: 'queued', runId: `run_${Date.now()}`, estimatedSeconds: 30 };
            
            setJobState({ status: 'queued', runId: response.runId, message: `Job queued! (Est: ${response.estimatedSeconds}s)` });
            
            // Mock poller
            const stages = ['Fetching SERP results', 'Crawling competitor pages', 'Analyzing content with AI', 'Report Generation'];
            let stageIndex = 0;
            const poller = setInterval(() => {
                if (stageIndex < stages.length) {
                    setJobState(prev => ({ ...prev, status: 'processing', message: stages[stageIndex] }));
                    stageIndex++;
                } else {
                    clearInterval(poller);
                    setJobState({ status: 'completed', runId: null, message: 'Analysis complete!' });
                    setNotification({ message: 'Report ready — saved to Reports.', type: 'success' });
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 3000);
                    fetchReports();
                }
            }, 5000);
            
        } catch (err: any) {
            setJobState({ status: 'failed', runId: null, message: err.message || 'Failed to start research.' });
        }
    };
    
    const cards: { id: ResearchMode; name: string; desc: string; icon: React.ReactNode; }[] = [
        { id: 'competitor_analysis', name: 'Competitor Analysis', desc: 'See what competitors rank for', icon: ICONS.research },
        { id: 'website_audit', name: 'Website Self-Audit', desc: 'Check your site’s SEO health', icon: ICONS.web },
        { id: 'keyword_research', name: 'Keyword & Market Research', desc: 'Discover keyword opportunities', icon: ICONS.stats }
    ];

    const isBusy = jobState.status === 'queued' || jobState.status === 'processing';
    
    const renderForm = () => {
        switch (mode) {
            case 'competitor_analysis': return <CompetitorAnalysisForm formState={competitorForm} setFormState={setCompetitorForm} isBusy={isBusy} />;
            case 'website_audit': return <WebsiteAuditForm formState={auditForm} setFormState={setAuditForm} isBusy={isBusy} />;
            case 'keyword_research': return <KeywordResearchForm formState={keywordForm} setFormState={setKeywordForm} isBusy={isBusy} />;
            default: return null;
        }
    };
    
    const renderReportContent = () => {
        if (!selectedReport) return null;
        
        if (selectedReport.html_output) {
            const sanitizedHtmlForSrcDoc = selectedReport.html_output.replace(/"/g, '&quot;');
            return <iframe srcDoc={sanitizedHtmlForSrcDoc} className="w-full h-full border-0 rounded-lg bg-white" sandbox="allow-scripts allow-same-origin" title="Research Report" />;
        }
        
        if (selectedReport.html_output_url) {
            return <iframe src={selectedReport.html_output_url} className="w-full h-full border-0 rounded-lg bg-white" sandbox="allow-scripts allow-same-origin" title="Research Report" />;
        }
        
        // Fallback to JSON view if no HTML is available
        return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(selectedReport, null, 2)}</pre>;
    };


    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            {showConfetti && <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl pointer-events-none z-[100]"><div className="animate-confetti-burst">🎉</div></div>}
            
            <header className="text-center">
                <h1 className="text-3xl font-bold text-white">AI Market Intelligence</h1>
                <p className="text-dark-text-secondary mt-1">Know Your Competition, Website & Market.</p>
            </header>

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cards.map(card => (
                        <button key={card.id} onClick={() => setMode(card.id)} disabled={isBusy}
                            className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${mode === card.id ? 'bg-dark-card border-brand-primary shadow-lg shadow-brand-primary/10' : 'bg-dark-bg border-dark-border hover:border-dark-text-secondary'}`}
                        >
                            <span className="text-2xl">{card.icon}</span>
                            <h3 className="font-bold text-white mt-2">{card.name}</h3>
                            <p className="text-xs text-dark-text-secondary">{card.desc}</p>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleStart} className="bg-dark-card p-6 rounded-xl border border-dark-border space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div key={mode} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration: 0.2}}>
                            {renderForm()}
                        </motion.div>
                    </AnimatePresence>
                     <div className="border-t border-dark-border pt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-dark-text-secondary">Join 5,000+ businesses using our intelligence.</p>
                        <button type="submit" disabled={isBusy} className="w-full md:w-auto flex justify-center items-center bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg disabled:bg-slate-600">
                             {isBusy ? 'Processing...' : '🚀 Start Analysis'}
                        </button>
                    </div>
                </form>

                <AnimatePresence>
                    {isBusy && <ProcessingState message={jobState.message} />}
                </AnimatePresence>

                 <div className="bg-dark-card p-6 rounded-xl border border-dark-border">
                    <h2 className="text-xl font-bold text-white">Your Intelligence Dashboard</h2>
                    {isLoading ? <p className="text-center py-8 text-dark-text-secondary">Loading reports...</p> : reports.length === 0 ? (
                        <p className="text-center py-8 text-dark-text-secondary">Your generated reports will appear here.</p>
                    ) : (
                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                            {reports.map(report => (
                                <div key={report.requestId} className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                                    <h4 className="font-semibold text-white truncate">{report.potential_focus_keyword}</h4>
                                    <p className="text-xs text-dark-text-secondary capitalize">{report.agent_id.replace('_', ' ')} - {new Date(report.timestamp).toLocaleDateString()}</p>
                                    <p className="text-sm text-dark-text-secondary mt-2 line-clamp-2">{report.short_summary}</p>
                                    <div className="mt-3 flex gap-2">
                                        <button onClick={() => setSelectedReport(report)} className="text-xs bg-dark-border hover:bg-brand-primary px-3 py-1 rounded">View</button>
                                        <button className="text-xs bg-dark-border hover:bg-brand-primary px-3 py-1 rounded">Download</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
            {selectedReport && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
                    <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} className="bg-dark-card border border-dark-border rounded-xl p-2 md:p-4 max-w-4xl w-full h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                         <header className="p-2 md:p-0 mb-2 flex-shrink-0">
                            <h3 className="font-bold text-white text-lg">Report: {selectedReport.potential_focus_keyword}</h3>
                         </header>
                         <div className="flex-grow bg-dark-bg rounded-lg">
                           {renderReportContent()}
                         </div>
                         <footer className="mt-2 md:mt-4 flex-shrink-0 text-center">
                            <button onClick={() => setSelectedReport(null)} className="bg-dark-border hover:bg-dark-bg px-6 py-2 rounded-lg text-sm w-full sm:w-auto">Close</button>
                         </footer>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default ResearchAgentPage;
