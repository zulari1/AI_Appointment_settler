import React, { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, animate, AnimatePresence } from 'framer-motion';
import { ICONS } from '../../constants';
import * as n8n from '../../services/n8nService';
import { DashboardUser, RoiJob } from '../../types';
import ActionNotification from '../../components/ActionNotification';
import { safeNum } from '../../utils/safeUtils';
import { format, differenceInMilliseconds } from 'date-fns';
import ServiceCard from '../../components/ServiceCard';

const AnimatedCounter: React.FC<{ value: number, prefix?: string, suffix?: string, decimals?: number }> = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        const controls = animate(animatedValue, value, {
            duration: 1.5,
            ease: "easeOut",
            onUpdate: (latest) => setAnimatedValue(latest)
        });
        return () => controls.stop();
    }, [value, animatedValue]);

    return <span>{prefix}{safeNum(animatedValue, decimals)}{suffix}</span>;
};

const ProgressRing: React.FC<{ percentage: number, color: string }> = ({ percentage, color }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 68 68">
                <circle className="text-dark-border" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="34" cy="34" />
                <motion.circle
                    className={color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="34"
                    cy="34"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-xl">
                <AnimatedCounter value={percentage} suffix="%" />
            </div>
        </div>
    );
};

const SparkLine: React.FC<{ data: number[], colorClass: string }> = ({ data, colorClass }) => {
  if (data.length < 2) return <div className="h-6 w-full bg-dark-bg/50 rounded" />;
  const width = 100;
  const height = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / range) * (height - 4) + 2}`).join(' ');
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className={`stroke-current ${colorClass}`}>
      <polyline fill="none" strokeWidth="2" points={points} />
    </svg>
  );
};

const TopRoiMetrics: React.FC<{ roiData: RoiJob[], dashboardData: DashboardUser | null }> = ({ roiData, dashboardData }) => {
    const latestRoi = roiData.length > 0 ? roiData[0] : null;
    const totalRoi = latestRoi ? parseInt(latestRoi.total_roi_percent.replace('%', '')) : 0;
    const revenueGrowth = latestRoi ? latestRoi.revenue_upside : 0;
    const timeValue = latestRoi ? latestRoi.time_saving_value : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-dark-bg border border-dark-border rounded-xl p-5 flex items-center gap-4">
                <ProgressRing percentage={totalRoi} color="text-green-400" />
                <div>
                    <p className="text-3xl font-bold text-white"><AnimatedCounter value={totalRoi} suffix="%" /></p>
                    <p className="text-sm font-medium text-dark-text-secondary">Total ROI</p>
                </div>
            </div>
            <div className="bg-dark-bg border border-dark-border rounded-xl p-5">
                <p className="text-sm font-medium text-dark-text-secondary">Revenue Growth</p>
                <p className="text-3xl font-bold text-green-400"><AnimatedCounter value={revenueGrowth} prefix="$" /></p>
            </div>
            <div className="bg-dark-bg border border-dark-border rounded-xl p-5">
                <p className="text-sm font-medium text-dark-text-secondary">Time Saved Value</p>
                <p className="text-3xl font-bold text-blue-400"><AnimatedCounter value={timeValue} prefix="$" /></p>
            </div>
            <div className="bg-dark-bg border border-dark-border rounded-xl p-5">
                <p className="text-sm font-medium text-dark-text-secondary">AI Impact Score</p>
                <p className="text-3xl font-bold text-amber-400"><AnimatedCounter value={((dashboardData?.last_ai_readiness_score || 0) + (dashboardData?.last_website_score || 0)) / 20} decimals={1} />/10</p>
            </div>
        </div>
    );
};

const ServiceUsageAnalytics: React.FC<{ data: DashboardUser | null, onRerun: (service: string) => void }> = ({ data, onRerun }) => {
    const services = [
        { name: 'AI Readiness', runs: data?.ai_readiness_runs || 0, score: data?.last_ai_readiness_score || 0, trend: [60, 70, 78], color: 'text-green-400' },
        { name: 'Website Analyzer', runs: data?.website_analyzer_runs || 0, score: data?.last_website_score || 0, trend: [75, 70, 82], color: 'text-blue-400' },
        { name: 'Email Rewrite', runs: data?.email_rewrite_runs || 0, score: null, trend: [1, 3, 2, 5, 1], color: 'text-purple-400' },
        { name: 'Lead Gen', runs: data?.leadgen_runs || 0, score: data?.last_leads_count || 0, trend: [50, 80, 120], color: 'text-amber-400' },
    ];
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 h-full">
            <h3 className="text-lg font-bold text-white mb-4">Service Usage Analytics</h3>
            <div className="space-y-4">
                {services.map(s => (
                    <div key={s.name} className="bg-dark-bg p-3 rounded-lg grid grid-cols-4 items-center gap-4">
                        <span className="font-semibold text-sm col-span-1">{s.name}</span>
                        <div className="col-span-1"><SparkLine data={s.trend} colorClass={s.color} /></div>
                        <div className="col-span-1 text-center">
                            <p className="font-bold text-white text-lg">{s.score !== null ? s.score : s.runs}</p>
                            <p className="text-xs text-dark-text-secondary">{s.score !== null ? (s.name === 'Lead Gen' ? 'Leads' : 'Score') : 'Runs'}</p>
                        </div>
                        <div className="col-span-1 text-right">
                            <button onClick={() => onRerun(s.name)} className="text-xs bg-dark-border hover:bg-brand-primary px-3 py-1 rounded">Re-run</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PerformancePanel: React.FC<{ roiData: RoiJob[], dashboardData: DashboardUser | null }> = ({ roiData, dashboardData }) => {
    const successRate = ((dashboardData?.roi_runs || 0) / (dashboardData?.total_simulations || 1)) * 100;
    const avgProcessingTime = useMemo(() => {
        if (roiData.length === 0) return 0;
        const totalMs = roiData.reduce((acc, job) => {
            const start = new Date(job.created_at);
            const end = new Date(job.completed_at);
            return acc + differenceInMilliseconds(end, start);
        }, 0);
        return (totalMs / roiData.length) / 1000;
    }, [roiData]);

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 h-full flex flex-col justify-between">
            <h3 className="text-lg font-bold text-white mb-4">Performance Panel</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-dark-text-secondary">Success Rate</span><span className="font-bold text-white">{safeNum(successRate)}%</span></div>
                    <div className="w-full bg-dark-bg h-2 rounded-full"><div className="bg-green-500 h-2 rounded-full" style={{width: `${successRate}%`}}></div></div>
                </div>
                <div>
                    <p className="text-sm text-dark-text-secondary">Avg. Processing Speed</p>
                    <p className="text-2xl font-bold text-white"><AnimatedCounter value={avgProcessingTime} decimals={1} suffix="s" /></p>
                </div>
                 <div>
                    <p className="text-sm text-dark-text-secondary">System Uptime</p>
                    <p className="text-2xl font-bold text-white">99.8%</p>
                </div>
            </div>
        </div>
    );
};

const TrustBuildingZone: React.FC<{ roiData: RoiJob[], dashboardData: DashboardUser | null }> = ({ roiData, dashboardData }) => {
    const latestRoi = roiData.length > 0 ? roiData[0] : null;
    const achievements = [
        { name: 'Revenue Optimizer', unlocked: latestRoi && parseInt(latestRoi.total_roi_percent) > 20 },
        { name: 'Time Master', unlocked: latestRoi && parseInt(latestRoi.ai_time_saved) > 20 },
        { name: 'Efficiency Pro', unlocked: latestRoi && latestRoi.time_saving_value > 1000 },
    ];

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Achievements & Growth</h3>
            <div className="flex flex-wrap gap-2">
                {achievements.map(a => (
                    <div key={a.name} className={`px-3 py-1 text-xs rounded-full border ${a.unlocked ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-dark-bg text-dark-text-secondary border-dark-border'}`}>
                        {a.unlocked ? '🏆' : '🔒'} {a.name}
                    </div>
                ))}
            </div>
             {/* Growth Trajectory Placeholder */}
            <div className="mt-4">
                <p className="text-sm font-semibold text-dark-text-secondary">Growth Trajectory</p>
                <div className="h-24 bg-dark-bg rounded-lg mt-2 flex items-center justify-center text-dark-text-secondary text-sm">Chart Placeholder</div>
            </div>
        </div>
    );
};

const NudgeCards: React.FC<{ roiData: RoiJob[] }> = ({ roiData }) => {
    const latestRoi = roiData.length > 0 ? roiData[0] : null;
    const showTopPerformer = latestRoi && parseInt(latestRoi.total_roi_percent) > 200;
    
    return (
        <AnimatePresence>
            {showTopPerformer && (
                 <motion.div initial={{opacity: 0}} animate={{opacity:1}} className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500 rounded-xl p-4 text-center">
                    <p className="text-2xl">🔥</p>
                    <p className="font-bold text-amber-300">Top 5% Performer!</p>
                    <p className="text-xs text-amber-400">Your AI ROI is exceptional this month.</p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const NextStepsCtaZone: React.FC<{ roiData: RoiJob[] }> = ({ roiData }) => {
    const latestRoi = roiData.length > 0 ? roiData[0] : null;
    return (
         <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-3">
             <h3 className="text-lg font-bold text-white mb-2 text-center">Next Steps</h3>
             <Link to="/management/billing" className="block text-center w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 rounded-lg">🚀 Upgrade to Pro</Link>
             <a href={latestRoi?.roi_pdf_url} target="_blank" rel="noopener noreferrer" className={`block text-center w-full bg-dark-bg hover:bg-dark-border font-bold py-3 rounded-lg ${!latestRoi?.roi_pdf_url ? 'opacity-50 pointer-events-none' : ''}`}>📊 View Full ROI Report</a>
             <a href="https://cal.com/zulari-agency" target="_blank" rel="noopener noreferrer" className="block text-center w-full bg-dark-bg hover:bg-dark-border font-bold py-3 rounded-lg">📞 Book Demo Call</a>
        </div>
    );
};

const MicroservicesHubPage: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<DashboardUser | null>(null);
    const [roiData, setRoiData] = useState<RoiJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const navigate = useNavigate();

    const microservices = [
        { title: 'AI Readiness Audit', description: 'Assess your business\'s readiness for AI integration.', icon: ICONS.dna, link: '/microservices/audit', status: 'available' as const },
        { title: 'Website Scorecard', description: 'Get an AI-powered analysis of your website\'s conversion potential.', icon: ICONS.web, link: '/microservices/scorecard', status: 'available' as const },
        { title: 'AI Sales Email Rewrite', description: 'Improve your sales emails with AI-powered suggestions.', icon: ICONS.email, link: '/microservices/email-rewrite', status: 'available' as const },
        { title: 'AI Strategy Call', description: 'Get a free AI business assessment and strategy.', icon: ICONS.chat, link: '/microservices/strategy-call', status: 'available' as const },
        { title: '5-Day AI Business Simulator', description: 'Experience a 5-day simulation of AI transforming your business.', icon: ICONS.rocket, link: '/microservices/simulator', status: 'available' as const },
        { title: 'Mini Lead Gen Pack', description: 'A complete lead generation pipeline in a micro-package.', icon: ICONS.leads, link: '/microservices/mini-leads', status: 'available' as const },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const userEmail = 'demo@zulari.app'; // Hardcoded for demo
            const [dashData, rData] = await Promise.all([
                n8n.fetchMicroservicesDashboardData(userEmail),
                // FIX: Corrected function name from fetchMicroservicesRoiData to fetchRoiData
                n8n.fetchRoiData(userEmail)
            ]);
            setDashboardData(dashData);
            setRoiData(rData.sort((a,b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()));
        } catch (e: any) {
            setError(e.message || 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRerun = (service: string) => {
        setNotification({ message: `Re-run initiated for ${service}. You will be notified upon completion.`, type: 'success' });
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-10 bg-dark-card rounded-lg w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-dark-card rounded-xl"></div>)}
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-64 bg-dark-card rounded-xl"></div>
                    <div className="h-64 bg-dark-card rounded-xl"></div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center p-8 bg-red-900/50 text-red-300 rounded-lg">{error}</div>
    }

    return (
        <div className="space-y-8">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            
            {/* --- DASHBOARD SECTION --- */}
            <div>
                <h1 className="text-3xl font-bold text-white">AI Microservices Dashboard</h1>
                <p className="text-dark-text-secondary">Your real-time performance overview for one-off AI tasks and reports.</p>
            </div>
            
            <TopRoiMetrics roiData={roiData} dashboardData={dashboardData} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ServiceUsageAnalytics data={dashboardData} onRerun={handleRerun} />
                </div>
                <PerformancePanel roiData={roiData} dashboardData={dashboardData} />
            </div>

             <TrustBuildingZone roiData={roiData} dashboardData={dashboardData} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <NudgeCards roiData={roiData} />
                </div>
                <NextStepsCtaZone roiData={roiData} />
            </div>

            {/* --- DIVIDER --- */}
            <div className="border-t border-dark-border my-8"></div>

            {/* --- MICROSERVICES CARDS SECTION --- */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-5">Microservice Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {microservices.map(service => (
                        <ServiceCard
                            key={service.title}
                            {...service}
                            onClick={() => navigate(service.link)}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
};

export default MicroservicesHubPage;