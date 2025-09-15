

import React, { useState, FormEvent, ReactNode, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ICONS } from '../../constants';
import * as n8n from '../../services/n8nService';
import { WebsiteReportRequest, WebsiteReportHistoryItem } from '../../types';
import ActionNotification from '../../components/ActionNotification';
import SubPageHeader from '../../components/SubPageHeader';

const problemTiles = [
    { key: 'Low traffic', label: 'Low Traffic', icon: '📉' },
    { key: 'Low conversions', label: 'Low Conversions', icon: '💔' },
    { key: 'Slow site / performance', label: 'Slow Site', icon: '🐌' },
    { key: 'Poor content relevance', label: 'Poor Content', icon: '🤷' },
    { key: 'High bounce', label: 'High Bounce Rate', icon: '👋' },
    { key: 'Accessibility issues', label: 'Accessibility', icon: '♿' },
];

const InitialForm: React.FC<{ onStartAnalysis: (data: WebsiteReportRequest, depth: 'quick' | 'standard' | 'deep') => void, isSubmitting: boolean }> = ({ onStartAnalysis, isSubmitting }) => {
    const [formState, setFormState] = useState({
        siteUrl: '',
        primaryProblem: 'Low conversions',
        userEmail: 'demo@zulari.app',
        consent_crawl: false,
        region: 'United States (en-US)',
        competitors: [''],
        industry: 'SaaS',
        priorityPages: '',
        sitemapUrl: '',
        reportStyle: 'action_roadmap',
        budgetBand: '<$5k',
        requiresAuth: false
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleCompetitorChange = (index: number, value: string) => {
        const newCompetitors = [...formState.competitors];
        newCompetitors[index] = value;
        setFormState(prev => ({ ...prev, competitors: newCompetitors }));
    };

    const addCompetitor = () => {
        if (formState.competitors.length < 3) {
            setFormState(prev => ({ ...prev, competitors: [...prev.competitors, ''] }));
        }
    };

    const handleSubmit = (depth: 'quick' | 'standard' | 'deep') => {
        if (!formState.siteUrl || !formState.userEmail || !formState.consent_crawl) return;
        const payload: WebsiteReportRequest = {
            requestId: `req_${crypto.randomUUID()}`,
            userEmail: formState.userEmail,
            siteUrl: formState.siteUrl,
            primaryProblem: formState.primaryProblem,
            region: formState.region,
            depth: depth,
            priorityPages: formState.priorityPages.split(',').map(p => p.trim()).filter(Boolean),
            sitemapUrl: formState.sitemapUrl,
            industry: formState.industry,
            competitors: formState.competitors.filter(Boolean),
            reportStyle: formState.reportStyle as 'exec_summary' | 'technical' | 'action_roadmap',
            budgetBand: formState.budgetBand,
            consent_crawl: formState.consent_crawl,
            auth: { requiresAuth: formState.requiresAuth },
        };
        onStartAnalysis(payload, depth);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold text-white">Get Your Website Scorecard</h2>
                <p className="text-dark-text-secondary">Enter your website to get a free, AI-powered analysis of its conversion potential.</p>
                
                <input type="url" name="siteUrl" value={formState.siteUrl} onChange={handleChange} placeholder="https://yourwebsite.com" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
                <input type="email" name="userEmail" value={formState.userEmail} onChange={handleChange} placeholder="Your Email for Report Delivery" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
                
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-dark-text-secondary">Primary Problem</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {problemTiles.map(tile => (
                            <button type="button" key={tile.key} onClick={() => setFormState(p => ({...p, primaryProblem: tile.key}))} className={`p-3 rounded-lg border-2 text-center transition-colors ${formState.primaryProblem === tile.key ? 'bg-brand-primary/20 border-brand-primary' : 'bg-dark-bg border-dark-border hover:border-dark-text-secondary'}`}>
                                <span className="text-2xl">{tile.icon}</span>
                                <p className="text-xs font-semibold mt-1">{tile.label}</p>
                            </button>
                        ))}
                    </div>
                </div>
                
                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-brand-accent hover:underline">{showAdvanced ? 'Hide' : 'Show'} advanced options</button>

                <AnimatePresence>
                {showAdvanced && (
                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="space-y-4 overflow-hidden bg-dark-bg/50 p-4 rounded-lg">
                        <input type="text" name="priorityPages" value={formState.priorityPages} onChange={handleChange} placeholder="Pages to prioritize (comma-separated)" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm" />
                        <input type="url" name="sitemapUrl" value={formState.sitemapUrl} onChange={handleChange} placeholder="Sitemap URL (optional)" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm" />

                        {formState.competitors.map((c, i) => (
                            <input key={i} type="url" value={c} onChange={e => handleCompetitorChange(i, e.target.value)} placeholder={`Competitor #${i+1} URL`} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm" />
                        ))}
                        {formState.competitors.length < 3 && <button type="button" onClick={addCompetitor} className="text-xs text-brand-accent">+ Add Competitor</button>}
                        
                        <select name="industry" value={formState.industry} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm">
                            <option>SaaS</option><option>E-commerce</option><option>Local Business</option><option>Agency</option><option>Media/Blog</option>
                        </select>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-dark-text-secondary block mb-1">Tone & Report Style</label>
                                <select name="reportStyle" value={formState.reportStyle} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm">
                                    <option value="action_roadmap">Action Roadmap</option>
                                    <option value="exec_summary">Executive Summary</option>
                                    <option value="technical">Technical Deep-dive</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-dark-text-secondary block mb-1">Budget Band</label>
                                <select name="budgetBand" value={formState.budgetBand} onChange={handleChange} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm">
                                    <option value="<$5k">&lt;$5k</option>
                                    <option value="$5k-$25k">$5k - $25k</option>
                                    <option value="$25k-$100k">$25k - $100k</option>
                                    <option value=">$100k">&gt;$100k</option>
                                </select>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm pt-2"><input type="checkbox" name="requiresAuth" checked={formState.requiresAuth} onChange={handleChange} className="h-4 w-4 rounded" /> Authentication needed?</label>
                    </motion.div>
                )}
                </AnimatePresence>
                
                <label className="flex items-start gap-3 p-3 bg-dark-bg rounded-lg cursor-pointer"><input type="checkbox" name="consent_crawl" checked={formState.consent_crawl} onChange={handleChange} required className="mt-1 h-4 w-4 rounded-md" /><div><span className="font-semibold text-white">I consent to the public crawling of this site for analysis.</span><p className="text-xs text-dark-text-secondary">I understand you will not request private credentials.</p></div></label>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-dark-border">
                    <button type="button" onClick={() => handleSubmit('standard')} disabled={isSubmitting} className="flex-1 bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-600">
                        {isSubmitting ? 'Analyzing...' : 'Start Standard Analysis'}
                    </button>
                    <button type="button" onClick={() => handleSubmit('quick')} disabled={isSubmitting} className="flex-1 sm:flex-initial bg-dark-bg hover:bg-dark-border text-white font-semibold py-3 px-4 rounded-lg disabled:bg-slate-600">
                        Run Quick Scan
                    </button>
                </div>
            </form>
            <aside className="lg:col-span-1 bg-dark-bg border border-dark-border rounded-xl p-4 space-y-3 h-fit">
                <h3 className="font-bold text-white text-center">🤖 AI Copilot</h3>
                <div className="bg-dark-card p-3 rounded-lg text-sm"><p className="font-semibold text-brand-accent">💡 Smart Insight</p><p className="text-xs mt-1">Websites that fix the top 3 conversion issues see a 15% lift on average.</p></div>
                <div className="bg-dark-card p-3 rounded-lg text-sm"><p className="font-semibold text-brand-accent">✨ Pro Tip</p><p className="text-xs mt-1">Use the "Advanced Options" to provide competitor URLs for a more detailed analysis.</p></div>
            </aside>
        </div>
    );
};

const ProcessingState: React.FC = () => (
    <div className="text-center py-12">
        <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">🤖</div>
        </div>
        <h2 className="text-2xl font-bold text-white mt-4">AI is analyzing your website...</h2>
        <p className="text-dark-text-secondary">This can take up to a few minutes. Please don't close this tab.</p>
    </div>
);interface HtmlRendererProps {
  htmlContent: string;
}


const HtmlRenderer: React.FC<HtmlRendererProps> = ({ htmlContent }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current) {
            iframeRef.current.srcdoc = htmlContent;
        }
    }, [htmlContent]);
    
    return (
        <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts"
            title="Website Analysis Report"
        />
    );
};

const ReportModal: React.FC<{ htmlContent: string, onClose: () => void }> = ({ htmlContent, onClose }) => (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        onClick={onClose}
    >
        <motion.div 
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="bg-dark-card w-full max-w-4xl h-[90vh] rounded-xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-2 text-right border-b border-dark-border flex-shrink-0">
                <button onClick={onClose} className="bg-dark-bg hover:bg-dark-border px-4 py-1.5 rounded-md text-sm">Close ✖</button>
            </div>
            <div className="flex-1 w-full bg-white">
                <HtmlRenderer htmlContent={htmlContent} />
            </div>
        </motion.div>
    </motion.div>
);

const scoreToNumber = (score: string): number => {
    if (!score || typeof score !== 'string') return 0;
    const cleanedScore = score.toUpperCase().replace('-', '').replace('+', '');
    const letter = cleanedScore.charAt(0);
    const gradeMap: { [key: string]: number } = { 'A': 95, 'B': 85, 'C': 75, 'D': 65, 'F': 55 };
    let base = gradeMap[letter] || 0;
    if (score.includes('+')) base += 3;
    if (score.includes('-')) base -= 3;
    const numericPart = score.match(/\d+/);
    if (numericPart) return parseInt(numericPart[0], 10);
    return base;
};

const scoreToColor = (scoreValue: number): { text: string; } => {
    if (scoreValue >= 90) return { text: 'text-brand-secondary' }; // green
    if (scoreValue >= 80) return { text: 'text-sky-400' }; // blue
    if (scoreValue >= 70) return { text: 'text-amber-400' }; // yellow
    return { text: 'text-red-500' }; // red
};interface ScoreGaugeProps {
  score: string;
}


const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
    const numericScore = useMemo(() => scoreToNumber(score), [score]);
    const color = useMemo(() => scoreToColor(numericScore), [numericScore]);
    const circumference = 2 * Math.PI * 20; // radius = 20
    const offset = circumference - (numericScore / 100) * circumference;

    return (
        <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
                <circle className="text-dark-border" strokeWidth="4" stroke="currentColor" fill="transparent" r="20" cx="22" cy="22" />
                <motion.circle
                    className={color.text}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="20"
                    cx="22"
                    cy="22"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center font-bold text-lg ${color.text}`}>
                {score || 'N/A'}
            </div>
        </div>
    );
};

const ReportsHistory: React.FC<{ onViewReport: (html: string) => void }> = ({ onViewReport }) => {
    const [previousReports, setPreviousReports] = useState<WebsiteReportHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');

    useEffect(() => {
        const loadPrevious = async () => {
            setIsLoading(true);
            try {
                const reports = await n8n.fetchWebsiteReportHistory();
                setPreviousReports(reports);
            } catch (err) {
                console.error(err);
                setNotification({ message: 'Could not load previous reports.', type: 'error'});
            } finally {
                setIsLoading(false);
            }
        };
        loadPrevious();
    }, []);

    const filteredAndSortedReports = useMemo(() => {
        return previousReports
            .filter(report => 
                (report.siteUrl || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                (report.short_summary || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                if (sortBy === 'score-desc') return scoreToNumber(b.score) - scoreToNumber(a.score);
                if (sortBy === 'score-asc') return scoreToNumber(a.score) - scoreToNumber(b.score);
                // Default to date-desc
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
    }, [previousReports, searchTerm, sortBy]);
    
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <h2 className="text-2xl font-bold text-white mb-4">📜 Reports History</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input 
                    type="search" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search reports by URL or summary..."
                    className="flex-grow bg-dark-bg border border-dark-border rounded-lg p-2 text-sm"
                />
                <select 
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-dark-bg border border-dark-border rounded-lg p-2 text-sm"
                >
                    <option value="date-desc">Sort by Date (Newest)</option>
                    <option value="score-desc">Sort by Score (High to Low)</option>
                    <option value="score-asc">Sort by Score (Low to High)</option>
                </select>
            </div>

            {isLoading ? <p className="text-center py-8 text-dark-text-secondary">Loading history...</p> : 
             filteredAndSortedReports.length === 0 ? <p className="text-center py-8 text-dark-text-secondary">No previous reports found.</p> :
             (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSortedReports.map(report => {
                         const isNew = new Date(report.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000;
                         return (
                            <motion.div
                                key={report.requestId || report.timestamp}
                                className="bg-dark-bg border border-dark-border rounded-xl p-4 flex flex-col justify-between group hover:border-brand-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand-primary/10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {isNew && <span className="text-xs font-bold text-brand-accent bg-brand-primary/20 px-2 py-1 rounded-full mb-2 inline-block">NEW</span>}
                                        <p className="font-semibold text-white truncate" title={report.siteUrl}>{report.siteUrl}</p>
                                        <p className="text-sm text-dark-text-secondary line-clamp-2 mt-1">{report.short_summary}</p>
                                    </div>
                                    <ScoreGauge score={report.score} />
                                </div>
                                <div className="border-t border-dark-border mt-3 pt-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-xs text-dark-text-secondary">
                                        {React.cloneElement(ICONS.calendar, { className: 'h-4 w-4' })}
                                        <span>{new Date(report.date).toLocaleDateString()}</span>
                                    </div>
                                    <button onClick={() => onViewReport(report.html_output)} className="text-sm font-semibold text-brand-primary group-hover:text-brand-accent">
                                        View Report →
                                    </button>
                                </div>
                            </motion.div>
                         );
                    })}
                </div>
            )}
        </div>
    );
};

const WebsiteScorecardPage: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
    const [resultHtml, setResultHtml] = useState<string | null>(null);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [selectedReportHtml, setSelectedReportHtml] = useState<string | null>(null);

    const handleStartAnalysis = useCallback(async (data: WebsiteReportRequest) => {
        setStatus('processing');
        setNotification(null);
        setResultHtml(null);
        try {
            const response = await n8n.generateWebsiteReport(data);
            if (response && Array.isArray(response) && response[0] && typeof response[0].html === 'string') {
                setResultHtml(response[0].html);
                setStatus('completed');
                setNotification({ message: 'Analysis complete!', type: 'success' });
            } else {
                throw new Error('Invalid report format received from the server. Expected an array with an HTML report.');
            }
        } catch (err: any) {
            console.error(err);
            setStatus('failed');
            setNotification({ message: `Error: ${err.message}`, type: 'error' });
        }
    }, []);
    
    const handleReset = () => {
        setStatus('idle');
        setResultHtml(null);
    };

    return (
        <div className="space-y-8">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SubPageHeader title="Website Conversion Scorecard" icon={ICONS.web} />
            
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8">
                {status === 'idle' && <InitialForm onStartAnalysis={handleStartAnalysis} isSubmitting={false} />}
                {status === 'processing' && <ProcessingState />}
                {status === 'failed' && (
                    <div className="text-center py-12">
                        <p className="text-red-400">Analysis failed. Please try again.</p>
                        <button onClick={handleReset} className="mt-4 bg-brand-primary p-2 rounded text-white font-semibold">Try Again</button>
                    </div>
                )}
                {status === 'completed' && resultHtml && (
                    <div className="w-full mx-auto animate-fade-in space-y-6">
                        <div className="w-full h-[80vh] bg-white rounded-xl overflow-hidden shadow-lg">
                           <HtmlRenderer htmlContent={resultHtml} />
                        </div>
                        <footer className="text-center">
                            <button onClick={handleReset} className="bg-dark-bg border border-dark-border hover:bg-dark-border text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                Run New Analysis
                            </button>
                        </footer>
                    </div>
                )}
            </div>
            
            <ReportsHistory onViewReport={setSelectedReportHtml} />

            <AnimatePresence>
                {selectedReportHtml && (
                    <ReportModal htmlContent={selectedReportHtml} onClose={() => setSelectedReportHtml(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default WebsiteScorecardPage;