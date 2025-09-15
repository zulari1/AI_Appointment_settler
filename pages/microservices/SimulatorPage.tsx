

import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ICONS } from '../../constants';
import * as n8n from '../../services/n8nService';
import { SimulatorJob, DayStatus, SimulatorDayOutput, SimulatorDayResponse } from '../../types';
import SubPageHeader from '../../components/SubPageHeader';
import ActionNotification from '../../components/ActionNotification';
import { renderHtmlReportInIframe } from '../../utils/safeUtils';

const MotionDiv = motion.div as any;
const SIMULATOR_JOB_ID_KEY = 'zulari-simulator-job-id';

// --- Sub-components ---

const OnboardingModal: React.FC<{ onStart: (payload: any) => void, isStarting: boolean }> = ({ onStart, isStarting }) => {
    const [formData, setFormData] = useState({
        user_name: 'John Doe',
        user_email: 'john@acme.com',
        company: 'Acme Inc.',
        website: 'https://acme.com',
        industry: 'SaaS',
        team_size: '11-50',
        monthly_revenue: 50000,
        primary_goal: 'Increase Leads',
        competitor_url: 'https://competitor.com'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            action: "sim_create",
            job_meta: { requested_by: "demo@zulari.app" },
            payload: formData
        };
        onStart(payload);
    };

    return (
        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <MotionDiv initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-dark-card border border-dark-border rounded-xl p-8 text-center flex flex-col items-center w-full max-w-lg">
                <h2 className="text-3xl font-bold text-white">🚀 5-Day AI Business Simulator</h2>
                <p className="text-dark-text-secondary mt-2">Let's get some basic info to tailor your simulation.</p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-3 w-full text-left">
                    <input type="text" value={formData.user_name} onChange={e => setFormData(p => ({ ...p, user_name: e.target.value }))} placeholder="Your Name" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm" />
                    <input type="email" value={formData.user_email} onChange={e => setFormData(p => ({ ...p, user_email: e.target.value }))} placeholder="Your Email" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm" />
                    <input type="text" value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} placeholder="Company Name" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm" />
                    <input type="url" value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} placeholder="https://yourwebsite.com" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm" />
                    <button type="submit" disabled={isStarting} className="w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-600 mt-2">
                        {isStarting ? 'Starting...' : 'Start 5-Day Simulation'}
                    </button>
                </form>
            </MotionDiv>
        </MotionDiv>
    );
};

const DayCard: React.FC<{ dayNumber: number, title: string, description: string, status: DayStatus, onRun: () => void, onView: () => void, jobData: SimulatorJob | null }> = ({ dayNumber, title, description, status, onRun, onView, jobData }) => {
    const getSummary = () => {
        if (!jobData || status !== 'completed') return null;
        switch(dayNumber) {
            case 1: return `Score: ${jobData.day1_score}`;
            case 2: return `Score: ${jobData.day2_score}`;
            case 3: return `2 Emails Drafted`;
            case 4: return `${jobData.day4_leads_count} Leads Found`;
            case 5: return `ROI: +${jobData.day5_roi_value}%`;
            default: return null;
        }
    };
    
    return (
        <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${status !== 'locked' ? 'bg-dark-card border-dark-border' : 'bg-dark-bg border-dark-border opacity-60'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className={`font-bold ${status !== 'locked' ? 'text-white' : 'text-dark-text-secondary'}`}>Day {dayNumber}: {title}</h3>
                    <p className="text-sm text-dark-text-secondary mt-1">{description}</p>
                </div>
                <div className="flex-shrink-0 ml-2">
                    {status === 'completed' && <span className="text-xs font-bold text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full">Completed</span>}
                    {status === 'running' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    {status === 'pending' && <span className="text-xs font-bold text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-full animate-pulse">Pending...</span>}
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
                <div>
                    {status === 'ready' && <button onClick={onRun} className="text-sm bg-brand-primary hover:bg-indigo-500 text-white font-semibold py-1 px-3 rounded-md">Run Day {dayNumber}</button>}
                    {status === 'completed' && <button onClick={onView} className="text-sm bg-dark-border hover:bg-brand-primary text-white font-semibold py-1 px-3 rounded-md">View Result</button>}
                </div>
                {status === 'completed' && getSummary() && (
                    <p className="text-sm font-semibold text-brand-accent bg-dark-bg px-2 py-1 rounded">{getSummary()}</p>
                )}
            </div>
        </div>
    );
};

const ResultModal: React.FC<{ output: SimulatorDayOutput | null, onClose: () => void }> = ({ output, onClose }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (output?.html || output?.html_output) {
            renderHtmlReportInIframe(iframeRef.current, output.html || output.html_output || '');
        }
    }, [output]);

    const renderContent = () => {
        if (!output) return null;
        if (output.html || output.html_output) {
            return <iframe ref={iframeRef} className="w-full h-full border-0" sandbox="allow-scripts" title={`Day ${output.day} Report`} />
        }
        // Handle non-HTML outputs
        switch(output.day) {
            case 3: // Sales Copy
                return (
                    <div className="p-6 space-y-4">
                        <div className="bg-dark-bg p-3 rounded">
                            <h4 className="font-bold">Email A Subject:</h4><p>{output.summary}</p>
                            <h4 className="font-bold mt-2">Email A Body:</h4><p className="whitespace-pre-wrap">{output.pdf_url}</p>
                        </div>
                        <div className="bg-dark-bg p-3 rounded">
                            <h4 className="font-bold">Email B Subject:</h4><p>{output.score}</p>
                            <h4 className="font-bold mt-2">Email B Body:</h4><p className="whitespace-pre-wrap">{output.artifact_url}</p>
                        </div>
                    </div>
                );
            default:
                 return (
                    <div className="p-6 text-gray-800">
                        <h4 className="font-bold text-xl mb-2">{output.summary}</h4>
                        {output.pdf_url && <a href={output.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Download Full Report</a>}
                        <pre className="text-xs whitespace-pre-wrap mt-4 bg-gray-100 p-4 rounded">{JSON.stringify(output, null, 2)}</pre>
                    </div>
                );
        }
    }

    return (
        <AnimatePresence>
            {output && (
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
                    <MotionDiv initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-dark-card w-full max-w-4xl h-[90vh] rounded-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="p-4 flex justify-between items-center border-b border-dark-border">
                            <h3 className="text-lg font-bold text-white">Day {output.day}: {output.title}</h3>
                            <button onClick={onClose} className="bg-dark-bg hover:bg-dark-border px-4 py-1.5 rounded-md text-sm">Close ✖</button>
                        </header>
                        <div className="flex-1 w-full bg-white text-black">
                           {renderContent()}
                        </div>
                    </MotionDiv>
                </MotionDiv>
            )}
        </AnimatePresence>
    );
};interface RunModalProps {
  day: number;
  description: string;
}


const RunModal: React.FC<RunModalProps> = ({ day, description }) => {
    const stages = [ "Initializing AI Agent...", "Analyzing your business data...", "Generating insights and report...", "Finalizing deliverables..." ];
    const [currentStage, setCurrentStage] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStage(prev => (prev + 1) % stages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
                <h2 className="text-2xl font-bold text-white">Running Day {day}: {description}</h2>
                <AnimatePresence mode="wait">
                    <motion.p key={currentStage} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-dark-text-secondary mt-2">{stages[currentStage]}</motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};interface ProgressTrackerProps {
  completedDays: number;
}


const ProgressTracker: React.FC<ProgressTrackerProps> = ({ completedDays }) => (
    <div className="flex items-center justify-center gap-2 md:gap-4">
        {[1,2,3,4,5].map(day => (
            <React.Fragment key={day}>
                <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${completedDays >= day ? 'bg-brand-primary border-brand-primary text-white' : 'border-dark-border text-dark-text-secondary'}`}>
                        {completedDays >= day ? '✓' : day}
                    </div>
                    <span className={`text-xs ${completedDays >= day ? 'text-white' : 'text-dark-text-secondary'}`}>Day {day}</span>
                </div>
                {day < 5 && <div className="flex-1 h-0.5 bg-dark-border mt-[-16px]"></div>}
            </React.Fragment>
        ))}
    </div>
);

const SimulatorPage: React.FC = () => {
    const [jobId, setJobId] = useState<string | null>(() => localStorage.getItem(SIMULATOR_JOB_ID_KEY));
    const [jobData, setJobData] = useState<SimulatorJob | null>(null);
    const [loading, setLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const [runningDay, setRunningDay] = useState<number | null>(null);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [selectedResult, setSelectedResult] = useState<SimulatorDayOutput | null>(null);

    const pollingRef = useRef<number | null>(null);

    const parseAndSetJobData = useCallback((sheetValues: any[][], currentJobId: string) => {
        if (!sheetValues || sheetValues.length < 2) { return; }
        const headers = sheetValues[0].map(h => h.trim());
        const colMap: Record<string, number> = {};
        headers.forEach((h, i) => colMap[h] = i);
        const jobIdIndex = colMap['job_id'];

        const jobRow = sheetValues.slice(1).find(row => row[jobIdIndex] === currentJobId);

        if (jobRow) {
            const parsedJob: any = {};
            for (const header in colMap) { parsedJob[header] = jobRow[colMap[header]]; }
            setJobData(parsedJob as SimulatorJob);
        } else {
             localStorage.removeItem(SIMULATOR_JOB_ID_KEY);
             setJobId(null);
        }
    }, []);

    const fetchSheetData = useCallback(async () => {
        if (!jobId) { setLoading(false); return; }
        setLoading(true);
        try {
            const res = await n8n.getSimulatorsSheet(jobId);
            parseAndSetJobData(res.values, jobId);
        } catch (err: any) { setNotification({ message: `Failed to fetch simulator data: ${err.message}`, type: 'error' }); }
        finally { setLoading(false); }
    }, [jobId, parseAndSetJobData]);

    useEffect(() => { fetchSheetData(); }, [fetchSheetData]);

    const stopPolling = () => { if (pollingRef.current) clearInterval(pollingRef.current); pollingRef.current = null; };

    const startPolling = (day: number) => {
        stopPolling();
        let pollCount = 0;
        pollingRef.current = window.setInterval(async () => {
            pollCount++;
            try {
                const res = await n8n.getSimulatorsSheet(jobId!);
                const headers = res.values[0];
                const colMap: Record<string, number> = {};
                headers.forEach((h: string, i: number) => colMap[h.trim()] = i);
                const jobIdIndex = colMap['job_id'];
                const jobRow = res.values.slice(1).find((r: any[]) => r[jobIdIndex] === jobId);
                if (jobRow && jobRow[colMap[`day${day}_completed`]] && jobRow[colMap[`day${day}_completed`]] !== 'PENDING') {
                    stopPolling();
                    setRunningDay(null);
                    setNotification({ message: `Day ${day} completed!`, type: 'success' });
                    fetchSheetData();
                } else if (pollCount > 12) { // Poll for 2 minutes (12 * 10s)
                    stopPolling();
                    setRunningDay(null);
                    setNotification({ message: `Day ${day} is taking a while. We'll email you the results.`, type: 'error' });
                    fetchSheetData();
                }
            } catch (err) { stopPolling(); setRunningDay(null); }
        }, 10000);
    };

    const handleStart = async (payload: any) => {
        setIsStarting(true);
        try {
            const res = await n8n.createSimJob(payload);
            localStorage.setItem(SIMULATOR_JOB_ID_KEY, res.job_id);
            setJobId(res.job_id);
            setNotification({ message: 'Simulation created! You can now run Day 1.', type: 'success' });
        } catch (err: any) { setNotification({ message: `Failed to create simulator: ${err.message}`, type: 'error' }); }
        finally { setIsStarting(false); }
    };
    
    const handleRunDay = async (day: number) => {
        if (!jobId) return;
        setRunningDay(day);
        let res: SimulatorDayResponse | undefined;
        try {
            const payload = { action: "sim_day", job_meta: { job_id: jobId, requested_by: "demo@zulari.app" }, day, payload: { website: jobData?.website } };
            res = await n8n.runSimDay(payload);
            if (res.status === 'completed') {
                setNotification({ message: `Day ${day} completed!`, type: 'success' });
                fetchSheetData();
            } else if (res.status === 'accepted') {
                setNotification({ message: `Day ${day} is running. We'll notify you when it's done.`, type: 'success' });
                startPolling(day);
                fetchSheetData();
            }
        } catch (err: any) { setNotification({ message: `Failed to run Day ${day}: ${err.message}`, type: 'error' });
        } finally { if (res?.status !== 'accepted') setRunningDay(null); }
    };

    const dayDefs = [
        { day: 1, title: 'AI Readiness Audit', desc: 'Get a full report on your business\'s AI potential.' },
        { day: 2, title: 'Website Scorecard', desc: 'Score your website and get 3 actionable fixes.' },
        { day: 3, title: 'AI Sales Email Rewrite', desc: 'Let AI craft a high-converting sales email.' },
        { day: 4, title: 'Mini Lead Gen Pack', desc: 'Receive 10 targeted leads for your business.' },
        { day: 5, title: 'ROI Projection', desc: 'See the potential financial impact of AI.' },
    ];

    const getDayStatus = (day: number): DayStatus => {
        if (!jobData) return 'locked';
        const dayCompletedKey = `day${day}_completed`;
        const isCompleted = jobData[dayCompletedKey] && jobData[dayCompletedKey] !== 'PENDING' && jobData[dayCompletedKey] !== 'FALSE';
        if (isCompleted) return 'completed';
        if (jobData[dayCompletedKey] === 'PENDING') return 'pending';
        if (day === 1) return 'ready';
        const prevDayCompletedKey = `day${day - 1}_completed`;
        const isPrevDayCompleted = jobData[prevDayCompletedKey] && jobData[prevDayCompletedKey] !== 'PENDING' && jobData[prevDayCompletedKey] !== 'FALSE';
        return isPrevDayCompleted ? 'ready' : 'locked';
    };
    
    const completedDays = jobData ? dayDefs.filter(d => getDayStatus(d.day) === 'completed').length : 0;
    
    const handleViewResult = (day: number) => {
        if (!jobData) return;
        const output: SimulatorDayOutput = {
            day: day as 1 | 2 | 3 | 4 | 5,
            title: jobData[`day${day}_summary`] || dayDefs[day - 1].title,
            summary: jobData[`day${day}_summary`] || 'No summary available.',
            pdf_url: jobData[`day${day}_pdf`],
            html: jobData[`day${day}_html_output`],
            score: Number(jobData[`day${day}_score`]),
            fixes: jobData.day2_fixes_json ? JSON.parse(jobData.day2_fixes_json) : undefined,
            artifact_url: jobData.day3_email_a_body, // Using for email body
            completed_at: jobData[`day${day}_completed`],
        };
        // Special handling for Day 3 emails
        if (day === 3) {
            output.summary = jobData.day3_email_a_subject; // Subject A
            output.pdf_url = jobData.day3_email_a_body; // Body A
            output.score = Number(jobData.day3_email_b_subject); // Subject B
            output.artifact_url = jobData.day3_email_b_body; // Body B
        }

        setSelectedResult(output);
    };

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            {runningDay && <RunModal day={runningDay} description={dayDefs.find(d => d.day === runningDay)?.title || ''} />}
            <ResultModal output={selectedResult} onClose={() => setSelectedResult(null)} />

            <SubPageHeader title="5-Day AI Business Simulator" icon={ICONS.rocket} />

            {!jobId && !loading && <OnboardingModal onStart={handleStart} isStarting={isStarting} />}

            {jobId && (
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8">
                    {loading ? <p>Loading simulator state...</p> : (
                        <>
                            <ProgressTracker completedDays={completedDays} />
                            {completedDays === 5 && 
                                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center my-4 p-4 bg-green-900/50 border border-green-700 rounded-lg">
                                    <h2 className="text-2xl font-bold text-white">🎉 Simulation Complete! 🎉</h2>
                                </motion.div>
                            }
                            <div className="space-y-4 mt-6">
                                {dayDefs.map(({ day, title, desc }) => (
                                    <DayCard 
                                        key={day} 
                                        dayNumber={day} 
                                        title={title} 
                                        description={desc} 
                                        status={runningDay === day ? 'running' : getDayStatus(day)}
                                        onRun={() => handleRunDay(day)}
                                        onView={() => handleViewResult(day)}
                                        jobData={jobData}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SimulatorPage;
