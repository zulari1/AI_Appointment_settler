

import React, { useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, animate } from 'framer-motion';
import { ICONS } from '../constants';
import * as n8n from '../services/n8nService';
import { MainDashboardData, RecentEvent } from '../types';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

// --- Helper Functions & Components (as per user request) ---

const stripQuotes = (s = '') => (s || '').replace(/^"+|"+$/g, '').trim();

const parseCurrency = (s = ''): number => {
    if (!s) return 0;
    const num = Number(String(s).replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(num) ? num : 0;
};

const parsePercent = (s: any): number => {
  if (!s) return 0;
  const clean = String(s).trim();
  if (clean.includes('%')) return parseFloat(clean.replace('%', '')) || 0;
  const n = parseFloat(clean);
  if (n > 0 && n <= 1) return n * 100;
  return n || 0;
};interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}


const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        const controls = animate(animatedValue, value, {
            duration: 1.2,
            ease: "easeOut",
            onUpdate: (latest) => setAnimatedValue(latest)
        });
        return () => controls.stop();
    }, [value]);

    return <span>{prefix}{animatedValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};interface SparkLineProps {
  data: number[];
  colorClass: string;
}


const SparkLine: React.FC<SparkLineProps> = ({ data, colorClass }) => {
  if (data.length < 2) return <div className="h-8 w-full bg-dark-bg/50 rounded" />;
  const width = 120;
  const height = 32;
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = (max - min) || 1;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / range) * (height - 4) + 2}`).join(' ');
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className={`stroke-current ${colorClass}`}>
      <polyline fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
};interface ProgressRingProps {
  percentage: number;
  colorClass: string;
  size?: number;
  strokeWidth?: number;
}


const ProgressRing: React.FC<ProgressRingProps> = ({ percentage, colorClass, size = 80, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle className="text-dark-border" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} />
                <motion.circle
                    className={colorClass}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size/2}
                    cy={size/2}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-white">
                <AnimatedCounter value={percentage} suffix="" decimals={0} />
            </div>
        </div>
    );
};interface KpiCardProps {
  title: string;
  value: number;
  subtitle: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sparklineData: number[];
  colorClass: string;
}


const KpiCard: React.FC<KpiCardProps> = 
({ title, value, subtitle, prefix, suffix, decimals, sparklineData, colorClass }) => (
    <div className="bg-dark-bg border border-dark-border rounded-xl p-5 space-y-2 flex flex-col justify-between">
        <div>
            <p className="text-sm font-medium text-dark-text-secondary">{title}</p>
            <p className={`text-4xl font-bold ${colorClass}`}><AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} /></p>
            <p className="text-xs text-dark-text-secondary h-4">{subtitle}</p>
        </div>
        <div className="h-8">
            <SparkLine data={sparklineData} colorClass={colorClass} />
        </div>
    </div>
);interface ServiceCardProps {
  icon: ReactNode;
  title: string;
  runs: number;
  lastSummary: string;
  revenueContribution: number;
  totalRevenueUnlocked: number;
  link: string;
}


const ServiceCard: React.FC<ServiceCardProps> = 
({ icon, title, runs, lastSummary, revenueContribution, totalRevenueUnlocked, link }) => {
    const navigate = useNavigate();
    const contributionPercent = totalRevenueUnlocked > 0 ? (revenueContribution / totalRevenueUnlocked) * 100 : 0;
    return (
        <div onClick={() => navigate(link)} className="bg-dark-bg border border-dark-border rounded-xl p-4 flex flex-col justify-between h-full group hover:border-brand-primary transition-colors cursor-pointer">
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="p-2 bg-dark-card rounded-lg text-brand-accent">{icon}</span>
                    <span className="text-xs font-mono bg-dark-card px-2 py-1 rounded">{runs} Runs</span>
                </div>
                <h4 className="font-bold text-white">{title}</h4>
                <p className="text-xs text-dark-text-secondary mt-1 h-8 line-clamp-2">Last: {lastSummary}</p>
            </div>
            <div className="mt-3">
                <p className="font-bold text-brand-accent text-lg"><AnimatedCounter value={contributionPercent} suffix="%" /></p>
                <p className="text-xs text-dark-text-secondary">of revenue (<AnimatedCounter value={revenueContribution} prefix="$" />)</p>
            </div>
        </div>
    );
};interface RecentActivityFeedProps {
  events: RecentEvent[];
}


const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ events }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 h-full">
        <h3 className="font-bold text-white mb-3">Recent Activity</h3>
        <div className="space-y-3">
            {events.map((event, i) => (
                <a key={i} href={event.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-bg transition-colors">
                    <span className="p-2 bg-dark-bg rounded-full text-brand-accent text-lg">{event.icon}</span>
                    <div>
                        <p className="font-semibold text-sm text-dark-text">{event.title}</p>
                        <p className="text-xs text-dark-text-secondary">{formatDistanceToNow(event.date, { addSuffix: true })}</p>
                    </div>
                </a>
            ))}
        </div>
    </div>
);interface GrowthAchievementsProps {
  score: number;
  achievements: string[];
  streak: number;
}


const GrowthAchievements: React.FC<GrowthAchievementsProps> = ({ score, achievements, streak }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="font-bold text-white">Growth & Achievements</h3>
                <p className="text-xs text-dark-text-secondary">Next milestone: 90</p>
            </div>
            <div className="flex items-center gap-2">
                {streak > 1 && <span className="font-bold text-amber-400 bg-amber-900/50 px-2 py-1 rounded-full text-xs animate-pulse">🔥 {streak} Day Streak!</span>}
            </div>
        </div>
        <div className="flex items-center justify-center gap-6 my-4">
            <ProgressRing percentage={score} colorClass="text-brand-accent" size={100} strokeWidth={10} />
            <div className="space-y-1.5">
                {achievements.map(ach => <span key={ach} className="block text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-1 rounded-full">🏆 {ach}</span>)}
            </div>
        </div>
    </div>
);interface RoiBreakdownChartProps {
  data: { name: string, value: number, color: string }[];
}


const RoiBreakdownChart: React.FC<RoiBreakdownChartProps> = ({ data }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
            <h3 className="font-bold text-white mb-3">ROI Breakdown by Service</h3>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.name} className="flex items-center gap-3 text-sm">
                        <span className="w-24 text-dark-text-secondary text-xs truncate">{item.name}</span>
                        <div className="flex-1 bg-dark-bg rounded-full h-6 p-0.5 border border-dark-border">
                            <motion.div 
                                className={`h-full rounded-full ${item.color} flex items-center justify-end pr-2`}
                                initial={{ width: '0%' }}
                                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            >
                                <span className="font-bold text-xs text-black mix-blend-plus-lighter">${item.value.toLocaleString()}</span>
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Dashboard Page ---

const DashboardPage: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<MainDashboardData | null>(null);
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const userEmail = 'demo@zulari.app'; // Hardcoded for demo
            const [mainData, events] = await Promise.all([
                n8n.fetchMainDashboardData(userEmail),
                n8n.fetchRecentActivity(userEmail),
            ]);
            
            if (mainData) {
                mainData.computed_revenue_unlocked = parseCurrency(mainData.revenue_unlocked);
                mainData.computed_time_saved_hours = Number(mainData.time_saved_hours) || 0;
                mainData.computed_growth_score = Number(mainData.growth_score) || 0;
                setDashboardData(mainData);
            }
            setRecentEvents(events);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sparklineData = useMemo(() => {
        const last7Days = Array(7).fill(0);
        const today = new Date();
        recentEvents.forEach(event => {
            const daysAgo = differenceInDays(today, event.date);
            if (daysAgo >= 0 && daysAgo < 7) {
                last7Days[6 - daysAgo]++;
            }
        });
        return last7Days;
    }, [recentEvents]);
    
    const dailyStreak = useMemo(() => {
        if (recentEvents.length === 0) return 0;
        const eventDays = new Set(recentEvents.map(e => e.date.toISOString().split('T')[0]));
        let streak = 0;
        let currentDate = new Date();
        while (eventDays.has(currentDate.toISOString().split('T')[0])) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
        return streak;
    }, [recentEvents]);

    if (loading) {
        return (
             <div className="space-y-6 animate-pulse">
                <div className="h-10 bg-dark-card rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-dark-card rounded-xl"></div>)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="h-60 bg-dark-card rounded-xl"></div>
                     <div className="h-60 bg-dark-card rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return <div className="text-center text-dark-text-secondary">No dashboard data available.</div>;
    }
    
    const totalRuns = dashboardData.total_runs || 1;
    const revenueUnlocked = dashboardData.computed_revenue_unlocked;
    const overallROI = parsePercent(dashboardData.overall_roi_percent);
    
    const serviceContributions = [
        { key: 'research', name: 'Research AI', runs: dashboardData.research_runs, summary: stripQuotes(dashboardData.last_research_summary), icon: ICONS.research, link: '/services/research-ai', color: 'bg-green-500' },
        { key: 'sales', name: 'Sales AI', runs: dashboardData.sales_runs, summary: stripQuotes(dashboardData.last_sales_summary), icon: ICONS.sales, link: '/services/sales-ai', color: 'bg-blue-500' },
        { key: 'support', name: 'Support AI', runs: dashboardData.support_runs, summary: `CSAT: ${dashboardData.last_support_csat}`, icon: ICONS.support, link: '/services/support-ai', color: 'bg-purple-500' },
        { key: 'leadgen', name: 'Lead Gen', runs: dashboardData.leadgen_runs, summary: `${dashboardData.last_leads_count} leads`, icon: ICONS.leads, link: '/leadgen', color: 'bg-amber-500' },
        { key: 'web', name: 'Web AI', runs: dashboardData.web_runs, summary: 'Last task completed', icon: ICONS.web, link: '/services/web-ai', color: 'bg-red-500' },
        { key: 'custom', name: 'Custom AI', runs: dashboardData.custom_runs, summary: 'Last solution generated', icon: ICONS.custom, link: '/services/custom-solution', color: 'bg-sky-500' }
    ];

    const roiBreakdownData = serviceContributions.map(s => ({
        name: s.name,
        value: Math.round((s.runs / totalRuns) * revenueUnlocked),
        color: s.color
    }));

    const timeSavedWeeks = dashboardData.computed_time_saved_hours / 40;
    const hiresEquivalent = revenueUnlocked > 5000 ? Math.round(revenueUnlocked / 5000) : 0;
    const revenueSubtitle = hiresEquivalent > 0 ? `Equivalent to ${hiresEquivalent} new ${hiresEquivalent > 1 ? 'hires' : 'hire'}` : 'Projected monthly value';

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white">Welcome back, {dashboardData.user_name}!</h1>
                <p className="text-dark-text-secondary">Here's your AI-powered performance at a glance.</p>
            </header>

            {/* Top KPI Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Overall ROI" value={overallROI} suffix="%" subtitle={`Last Run: ${dashboardData.last_roi_percent}`} sparklineData={sparklineData} colorClass="text-green-400" />
                <KpiCard title="Revenue Unlocked" value={revenueUnlocked} prefix="$" subtitle={revenueSubtitle} sparklineData={sparklineData.map(v => v * 1000)} colorClass="text-green-400" />
                <KpiCard title="Time Saved" value={timeSavedWeeks} decimals={1} suffix=" weeks" subtitle="= Work weeks freed" sparklineData={sparklineData.map(v => v * 10)} colorClass="text-blue-400" />
                <KpiCard title="Growth Score" value={dashboardData.computed_growth_score} suffix="/100" subtitle="Your AI adoption & impact score" sparklineData={sparklineData.map(v => v * 5)} colorClass="text-amber-400" />
            </div>

            {/* Service Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                 {serviceContributions.map(s => {
                    const revenueContribution = Math.round((s.runs / totalRuns) * revenueUnlocked);
                    return (
                        <ServiceCard
                            key={s.key}
                            icon={s.icon}
                            title={s.name}
                            runs={s.runs}
                            lastSummary={s.summary}
                            revenueContribution={revenueContribution}
                            totalRevenueUnlocked={revenueUnlocked}
                            link={s.link}
                        />
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1"><RecentActivityFeed events={recentEvents} /></div>
                 <div className="lg:col-span-2"><GrowthAchievements score={dashboardData.computed_growth_score} achievements={(dashboardData.achievements_unlocked || '').split(',').map(a => a.trim()).filter(Boolean)} streak={dailyStreak} /></div>
            </div>

            <RoiBreakdownChart data={roiBreakdownData} />
        </div>
    );
};

export default DashboardPage;