import React, { useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ICONS } from '../constants';
import { ResearchReport } from '../types';
import * as researchService from '../services/n8nService';
import ActionNotification from '../components/ActionNotification';
import InfoTooltip from '../components/InfoTooltip';

type ResearchMode = 'competitor_analysis' | 'website_audit' | 'keyword_research';
type PageStatus = 'idle' | 'processing' | 'completed' | 'failed';

// --- Reusable UI Components ---

const FormField: React.FC<{ label: string, children: React.ReactNode, required?: boolean, hint?: string }> = ({ label, children, required, hint }) => (
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
);

// --- Form Components ---

const CompetitorAnalysisForm: React.FC<{ formState: any, setFormState: any, isBusy: boolean }> = ({ formState, setFormState, isBusy }) => {
    const handleChange = (field: string, value: any) => setFormState((prev: any) => ({ ...prev, [field]: value }));

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
};

const WebsiteAuditForm: React.FC<{ formState: any, setFormState: any, isBusy: boolean }> = ({ formState, setFormState, isBusy }) => {
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
};

const KeywordResearchForm: React.FC<{ formState: any, setFormState: any, isBusy: boolean }> = ({ formState, setFormState, isBusy }) => {
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
};

const EngagingProcessingView: React.FC = () => {
    const stages = [
        { duration: 30000, message: "Gathering your market data...", detail: "Initializing AI research agents..." },
        { duration: 90000, message: "Scanning competitors...", detail: "Analyzing top 10 SERP results and their strategies." },
        { duration: 180000, message: "Analyzing keywords...", detail: "💡 Did you know? 72% of B2B buyers research vendors online first." },
        { duration: 300000, message: "Finding opportunities...", detail: "📈 AI is crunching 2.4M data points for you..." },
        { duration: 600000, message: "Finalizing deep dive insights...", detail: "✅ Finished trend analysis. Starting competitor gap scan..." },
    ];

    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let stageTimer: number;
        let progressTimer: number;

        const advanceStage = (stageIndex: number) => {
            if (stageIndex >= stages.length) return;
            setCurrentStageIndex(stageIndex);
            stageTimer = window.setTimeout(() => advanceStage(stageIndex + 1), stages[stageIndex].duration);
        };
        
        advanceStage(0);

        progressTimer = window.setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(progressTimer);
                    return 100;
                }
                return p + 0.16; // Approx 10 minutes to 100%
            });
        }, 1000);

        return () => {
            clearTimeout(stageTimer);
            clearInterval(progressTimer);
        };
    }, []);

    const currentStage = stages[Math.min(currentStageIndex, stages.length - 1)];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-dark-card border-2 border-dark-border rounded-xl p-6 shadow-lg text-center my-4 relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-sweep animate-gradient-sweep opacity-10"></div>
            <div className="relative z-10">
                <div className="relative inline-block h-16 w-16">
                     <div className="absolute h-full w-full bg-brand-primary/20 rounded-full animate-pulse-ring"></div>
                     <div className="relative h-16 w-16 bg-dark-bg rounded-full flex items-center justify-center text-white text-3xl animate-dna-spin" style={{animationDuration: '5s'}}>
                        {ICONS.dna}
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    <motion.h3 
                        key={currentStage.message}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="text-xl font-bold text-white mt-4"
                    >
                       {currentStage.message}
                    </motion.h3>
                </AnimatePresence>
                 <AnimatePresence mode="wait">
                    <motion.p
                        key={currentStage.detail}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-sm text-dark-text-secondary mt-2 h-4"
                    >
                        {currentStage.detail}
                    </motion.p>
                </AnimatePresence>
                <div className="w-full bg-dark-bg rounded-full h-2.5 my-4 border border-dark-border">
                    <div className="bg-brand-primary h-full rounded-full" style={{ width: `${progress}%`, transition: 'width 1s linear' }}></div>
                </div>
                <p className="text-xs text-dark-text-secondary">
                    This deep dive can take several minutes. Feel free to keep this tab open. If you close it, we'll email you the report when it's ready.
                </p>
            </div>
        </motion.div>
    );
};

const ReportResult: React.FC<{ report: ResearchReport; onReset: () => void }> = ({ report, onReset }) => {
    const { bodyContent, styleContent } = useMemo(() => {
        const html = report.html_output || '<body>Report failed to render.</body>';
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const bodyContent = doc.body.innerHTML;
            const styleContent = Array.from(doc.querySelectorAll('style')).map(s => s.innerHTML).join('\n');
            return { bodyContent, styleContent };
        } catch (e) {
            console.error("Failed to parse report HTML:", e);
            return { bodyContent: '<p>Error: Could not display report content.</p>', styleContent: '' };
        }
    }, [report.html_output]);

    useEffect(() => {
        if (!styleContent) return;
        const styleTag = document.createElement('style');
        styleTag.id = 'dynamic-report-styles';
        styleTag.innerHTML = styleContent;
        document.head.appendChild(styleTag);
        return () => {
            const existingTag = document.getElementById('dynamic-report-styles');
            if (existingTag) {
                document.head.removeChild(existingTag);
            }
        };
    }, [styleContent]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-2xl font-bold text-white text-center">Your AI Research Report is Ready!</h2>
            <div className="bg-white p-6 rounded-lg text-black overflow-auto max-h-[70vh] border border-dark-border">
                <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
            </div>
            <div className="text-center">
                <button onClick={onReset} className="bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg">
                    + Run New Analysis
                </button>
            </div>
        </motion.div>
    );
};

// --- Main Page Component ---
const ResearchAgentPage: React.FC = () => {
    const user = { email: 'demo@zulari.app' };
    const [mode, setMode] = useState<ResearchMode>('competitor_analysis');
    
    const [competitorForm, setCompetitorForm] = useState({ keyword: '', competitorUrl: '', industry: 'SaaS', region: 'United States', analysisDepth: 'quick' });
    const [auditForm, setAuditForm] = useState({ siteUrl: '', primaryGoals: [], reportTone: 'Executive Summary' });
    const [keywordForm, setKeywordForm] = useState({ seedKeywords: '', industry: 'Digital Marketing', difficulty: 'easy' });

    const [status, setStatus] = useState<PageStatus>('idle');
    const [latestReport, setLatestReport] = useState<ResearchReport | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    
    const [reports, setReports] = useState<ResearchReport[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);

    // NEW state for filtering and pagination
    const [agentFilter, setAgentFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const REPORTS_PER_PAGE = 6;
    const [visibleReportsCount, setVisibleReportsCount] = useState(REPORTS_PER_PAGE);
    
    const fetchReports = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const data = await researchService.fetchReportsForUser(user.email, 1, 100);
            setReports(data.reports || []);
        } catch (err: any) {
            setNotification({ message: `Failed to load reports: ${err.message}`, type: 'error' });
        } finally {
            setIsLoadingHistory(false);
        }
    }, [user.email]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleReportsCount(REPORTS_PER_PAGE);
    }, [agentFilter, dateFilter]);

    const filteredReports = useMemo(() => {
        let dateBoundary: Date | null = null;
        if (dateFilter !== 'all') {
            dateBoundary = new Date();
            const daysToSubtract = dateFilter === 'last_7_days' ? 7 : 30;
            dateBoundary.setDate(dateBoundary.getDate() - daysToSubtract);
            dateBoundary.setHours(0, 0, 0, 0); // Start of the day
        }

        return reports
            .filter(report => {
                // Agent filter
                if (agentFilter !== 'all' && report.agent_id !== agentFilter) {
                    return false;
                }
                // Date filter
                if (dateBoundary) {
                    const reportDate = new Date(report.timestamp);
                    if (reportDate < dateBoundary) {
                        return false;
                    }
                }
                return true;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [reports, agentFilter, dateFilter]);

    const displayedReports = useMemo(() => {
        return filteredReports.slice(0, visibleReportsCount);
    }, [filteredReports, visibleReportsCount]);
    
    const handleShowMore = () => {
        setVisibleReportsCount(prev => prev + REPORTS_PER_PAGE);
    };

    const hasMore = visibleReportsCount < filteredReports.length;

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('processing');
        setLatestReport(null);
        setErrorMessage('');

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

        try {
            const response = await researchService.startResearch(payload);
            if (!response || !Array.isArray(response) || response.length === 0 || !response[0].html_output) {
                throw new Error("Invalid response format from the server. The report might be empty.");
            }
            
            setStatus('completed');
            setLatestReport(response[0]);
            setNotification({ message: 'Report generated successfully!', type: 'success' });
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            fetchReports();

        } catch (err: any) {
            const msg = err.message || 'Failed to start research.';
            setStatus('failed');
            setErrorMessage(msg);
            setNotification({ message: msg, type: 'error' });
        }
    };
    
    const handleReset = () => {
        setStatus('idle');
        setLatestReport(null);
        setErrorMessage('');
    };

    const cards: { id: ResearchMode; name: string; desc: string; icon: React.ReactNode; }[] = [
        { id: 'competitor_analysis', name: 'Competitor Analysis', desc: 'See what competitors rank for', icon: ICONS.research },
        { id: 'website_audit', name: 'Website Self-Audit', desc: 'Check your site’s SEO health', icon: ICONS.web },
        { id: 'keyword_research', name: 'Keyword & Market Research', desc: 'Discover keyword opportunities', icon: ICONS.stats }
    ];

    const isBusy = status === 'processing';
    
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
        const html = selectedReport.html_output || selectedReport.html_output_url;
        if (html) {
            // Using srcDoc for sandboxing and simplicity
            return <iframe srcDoc={html} className="w-full h-full border-0 rounded-lg bg-white" sandbox="allow-scripts allow-same-origin" title="Research Report" />;
        }
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

                <AnimatePresence mode="wait">
                    {status === 'completed' && latestReport ? (
                        <motion.div key="result" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                             <ReportResult report={latestReport} onReset={handleReset} />
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
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
                            {status === 'processing' && <EngagingProcessingView />}
                            {status === 'failed' && (
                                <div className="mt-4 p-4 bg-red-900/50 text-red-300 rounded-lg border border-red-700 text-center">
                                    <p className="font-semibold">Research Failed</p>
                                    <p className="text-sm mt-1">{errorMessage}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                 <div className="bg-dark-card p-6 rounded-xl border border-dark-border">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-white">Your Intelligence Dashboard</h2>
                        
                        <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
                            <select
                                value={agentFilter}
                                onChange={e => setAgentFilter(e.target.value)}
                                className="bg-dark-bg border border-dark-border rounded-lg p-2 text-sm w-full sm:w-auto"
                                aria-label="Filter by agent"
                            >
                                <option value="all">All Agents</option>
                                <option value="competitor_analysis">Competitor Analysis</option>
                                <option value="website_audit">Website Audit</option>
                                <option value="keyword_research">Keyword Research</option>
                            </select>
                            <select
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                className="bg-dark-bg border border-dark-border rounded-lg p-2 text-sm w-full sm:w-auto"
                                aria-label="Filter by date"
                            >
                                <option value="all">All Time</option>
                                <option value="last_7_days">Last 7 Days</option>
                                <option value="last_30_days">Last 30 Days</option>
                            </select>
                        </div>
                    </div>
                    {isLoadingHistory ? <p className="text-center py-8 text-dark-text-secondary">Loading reports...</p> : displayedReports.length === 0 ? (
                        <p className="text-center py-8 text-dark-text-secondary">
                            {reports.length > 0 ? 'No reports match your filters.' : 'Your generated reports will appear here.'}
                        </p>
                    ) : (
                        <>
                            <div className="mt-4 grid md:grid-cols-2 gap-4">
                                {displayedReports.map(report => (
                                    <div key={report.requestId || report.timestamp} className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                                        <h4 className="font-semibold text-white truncate">{report.potential_focus_keyword}</h4>
                                        <p className="text-xs text-dark-text-secondary capitalize">{report.agent_id.replace(/_/g, ' ')} - {new Date(report.timestamp).toLocaleDateString()}</p>
                                        <p className="text-sm text-dark-text-secondary mt-2 line-clamp-2">{report.short_summary}</p>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => setSelectedReport(report)} className="text-xs bg-dark-border hover:bg-brand-primary px-3 py-1 rounded">View</button>
                                            <button className="text-xs bg-dark-border hover:bg-brand-primary px-3 py-1 rounded">Download</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {hasMore && (
                                <div className="text-center mt-6">
                                    <button onClick={handleShowMore} className="bg-dark-border hover:bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                                        Show More Reports
                                    </button>
                                </div>
                            )}
                        </>
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