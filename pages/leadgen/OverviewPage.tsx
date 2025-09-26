






import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, animate } from 'framer-motion';
import * as n8n from '../../services/n8nService';
import * as replierService from '../../services/replierService';
import { calcKPIs, deriveRow } from '../../utils/replierUtils';
import { ICONS } from '../../constants';

const AnimatedCounter: React.FC<{ value: number, suffix?: string, prefix?: string }> = ({ value, suffix = '', prefix = '' }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        const controls = animate(animatedValue, value, {
            duration: 1,
            ease: "easeOut",
            onUpdate: (latest) => setAnimatedValue(Math.round(latest))
        });
        return () => controls.stop();
    }, [value, animatedValue]);

    return <span>{prefix}{animatedValue.toLocaleString()}{suffix}</span>;
};

const ProgressRing: React.FC<{ percentage: number }> = ({ percentage }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const [animatedPercentage, setAnimatedPercentage] = useState(0);

    useEffect(() => {
        const controls = animate(animatedPercentage, percentage, {
            duration: 1,
            onUpdate: (latest) => setAnimatedPercentage(Math.round(latest))
        });
        return () => controls.stop();
    }, [percentage, animatedPercentage]);
    
    const offset = circumference - (animatedPercentage / 100) * circumference;

    return (
        <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
                <circle className="text-dark-border" strokeWidth="6" stroke="currentColor" fill="transparent" r={radius} cx="28" cy="28" />
                <motion.circle
                    className="text-brand-accent"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="28"
                    cy="28"
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg">
                {animatedPercentage}%
            </div>
        </div>
    );
};

const PipelineDiagram: React.FC = () => {
    // FIX: Change icon type to React.ReactElement to allow cloning with props.
    const agents: { name: string; icon: React.ReactElement; color: string; ring: string; }[] = [
        { name: 'Hunter', icon: ICONS.research, color: 'text-green-400', ring: 'ring-green-500/50' },
        { name: 'Researcher', icon: ICONS.dna, color: 'text-blue-400', ring: 'ring-blue-500/50' },
        { name: 'Personalizer', icon: ICONS.email, color: 'text-purple-400', ring: 'ring-purple-500/50' },
        { name: 'Outreach', icon: ICONS.paperPlane, color: 'text-amber-400', ring: 'ring-amber-500/50' },
        { name: 'Replier', icon: ICONS.reply, color: 'text-red-400', ring: 'ring-red-500/50' }
    ];

    return (
        <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
            {agents.map((agent, index) => (
                <React.Fragment key={agent.name}>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`relative w-12 h-12 bg-dark-bg rounded-full flex items-center justify-center ring-2 ${agent.ring}`}>
                            <div className={`absolute h-full w-full rounded-full animate-pulse-ring ${agent.color}`}></div>
                            {/* FIX: Cast props to 'any' to resolve TypeScript error with cloneElement and SVG props. */}
                            {React.cloneElement(agent.icon, { className: `h-6 w-6 ${agent.color}` } as any)}
                        </div>
                        <span className="text-xs font-semibold text-dark-text-secondary">{agent.name}</span>
                    </div>
                    {index < agents.length - 1 && (
                         <div className="w-8 h-1 bg-dark-border rounded-full hidden md:block"></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

// FIX: Change icon type to React.ReactElement to allow cloning with props.
const KpiCard: React.FC<{ label: string, value: number, icon: React.ReactElement }> = ({ label, value, icon }) => (
    <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-dark-text-secondary">{label}</p>
            {/* FIX: Cast props to 'any' to resolve TypeScript error with cloneElement and SVG props. */}
            <span className="text-dark-text-secondary">{React.cloneElement(icon, {className: 'w-5 h-5'} as any)}</span>
        </div>
        <p className="text-3xl font-bold text-white"><AnimatedCounter value={value} /></p>
    </div>
);

const UnifiedMetricsDashboard: React.FC<{ kpis: any }> = ({ kpis }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <KpiCard label="Leads Found" value={kpis.found} icon={ICONS.leads} />
            <KpiCard label="Researched" value={kpis.researched} icon={ICONS.research} />
            <KpiCard label="Personalized" value={kpis.personalized} icon={ICONS.email} />
            <KpiCard label="Emails Sent" value={kpis.sent} icon={ICONS.paperPlane} />
            <KpiCard label="Replies Handled" value={kpis.repliesHandled} icon={ICONS.reply} />
            <KpiCard label="Meetings Booked" value={kpis.meetings} icon={ICONS.calendar} />
            <KpiCard label="Escalations" value={kpis.escalations} icon={ICONS.warning} />
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
                <ProgressRing percentage={kpis.aiSuccessRate} />
                <p className="text-sm text-dark-text-secondary mt-2">AI Success Rate</p>
            </div>
        </div>
    );
};

const FunnelTable: React.FC<{ kpis: any }> = ({ kpis }) => {
    const totalLeads = kpis.found || 1;
    const funnelSteps = [
        { name: 'Leads Found', count: kpis.found, conversion: 100 },
        { name: 'Researched', count: kpis.researched, conversion: totalLeads > 0 ? Math.round((kpis.researched / totalLeads) * 100) : 0 },
        { name: 'Personalized', count: kpis.personalized, conversion: kpis.researched > 0 ? Math.round((kpis.personalized / kpis.researched) * 100) : 0 },
        { name: 'Sent', count: kpis.sent, conversion: kpis.personalized > 0 ? Math.round((kpis.sent / kpis.personalized) * 100) : 0 },
        { name: 'Replied', count: kpis.repliesHandled, conversion: null },
        { name: 'Meetings Booked', count: kpis.meetings, conversion: null },
    ];
    
    return (
         <div className="w-full text-sm">
            <div className="grid grid-cols-3 gap-2 font-bold text-dark-text-secondary text-xs uppercase px-2 py-1">
                <span>Stage</span>
                <span className="text-right">Count</span>
                <span className="text-right">Conversion</span>
            </div>
            {funnelSteps.map(step => (
                <div key={step.name} className="grid grid-cols-3 gap-2 px-2 py-2 border-b border-dark-border last:border-0">
                    <span className="font-semibold text-white">{step.name}</span>
                    <span className="text-right font-mono text-white">{step.count.toLocaleString()}</span>
                    <span className={`text-right font-mono ${step.conversion === null ? 'text-dark-text-secondary' : 'text-green-400'}`}>
                        {step.conversion !== null ? `${step.conversion}%` : '—'}
                    </span>
                </div>
            ))}
        </div>
    );
};

const HowItWorksSection: React.FC = () => {
    const agents = [
        { name: 'Hunter', description: "Finds high-potential leads from LinkedIn, web, and business data." },
        { name: 'Researcher', description: "Enriches leads with detailed context (industry, company, role, insights)." },
        { name: 'Personalizer', description: "Writes persuasive multi-touch email sequences." },
        { name: 'Outreach', description: "Delivers campaigns, tracks replies, and books meetings." },
        { name: 'Replier (Inbox Assistant) 📨', description: "Scans incoming replies, suggests responses, and auto-handles routine conversations. Escalates tricky cases to you with a single click → keeps conversations warm until booked." },
    ];
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 className="text-xl font-bold text-white text-center mb-4">How it Works (The 5-Agent Pipeline)</h3>
            <div className="space-y-3">
                {agents.map((agent, i) => (
                    <div key={agent.name} className="bg-dark-bg p-3 rounded-lg">
                        <h4 className="font-semibold text-white">Agent {i + 1}: {agent.name}</h4>
                        <p className="text-xs text-dark-text-secondary mt-1">{agent.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AgentCTA: React.FC<{ to: string, title: string, description: string, icon: React.ReactNode }> = ({ to, title, description, icon }) => (
    <Link to={to} className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-brand-primary transition-colors group animate-fade-in flex flex-col justify-between">
        <div>
            <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl">{icon}</span>
                <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <p className="text-sm text-dark-text-secondary">{description}</p>
        </div>
        <p className="text-sm font-semibold text-brand-primary mt-4 group-hover:underline">
            Manage Agent &rarr;
        </p>
    </Link>
);

const OverviewPage: React.FC = () => {
    const [kpis, setKpis] = useState({ found: 0, researched: 0, personalized: 0, sent: 0, repliesHandled: 0, aiSuccessRate: 0, meetings: 0, escalations: 0 });
    
    const fetchKpis = useCallback(async () => {
        try {
            const [leadGenRes, replierRes] = await Promise.all([
                n8n.fetchLeads(1, 10000, 'All'),
                replierService.fetchReplierRows()
            ]);
            
            const leads = leadGenRes.leads;
            const derivedReplierRows = replierRes.rows.map(deriveRow);
            const replierKpisData = calcKPIs(derivedReplierRows);
            
            const sentCount = leads.filter(l => ['Send', 'Response'].includes(l.progressStep)).length;

            const newKpis = {
                found: leadGenRes.total,
                researched: leads.filter(l => l.progressStep !== 'Hunt').length,
                personalized: leads.filter(l => ['Personalize', 'Send', 'Response'].includes(l.progressStep)).length,
                sent: sentCount,
                repliesHandled: derivedReplierRows.length,
                aiSuccessRate: replierKpisData.aiSuccessRate,
                meetings: replierKpisData.bookedMeetings,
                escalations: replierKpisData.escalations,
            };
            setKpis(newKpis);

        } catch (e) {
            console.error("Failed to fetch KPIs", e);
        }
    }, []);

    useEffect(() => {
        fetchKpis();
    }, [fetchKpis]);
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">AI Command Center: Your 24/7 Growth Engine</h1>
                <p className="text-lg text-dark-text-secondary mt-2">Find, enrich, personalize, contact, and now reply to leads automatically — until the meeting is booked.</p>
                <p className="text-brand-accent font-semibold mt-2">⚡ “Turn strangers into customers, while you sleep.”</p>
            </div>
            
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <UnifiedMetricsDashboard kpis={kpis} />
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <HowItWorksSection />
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center">
                         <h3 className="text-xl font-bold text-white">ROI Framing (Enhanced)</h3>
                         <p className="text-dark-text-secondary mt-1">With the Replier, your funnel doesn’t end at sending emails — it closes the loop. Each AI-handled reply = hours saved from manual inbox management. This means more meetings, less friction, and zero lost leads.</p>
                    </div>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                     <h3 className="text-xl font-bold text-white mb-4 text-center">Funnel Progress</h3>
                    <FunnelTable kpis={kpis} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <AgentCTA to="/leadgen/hunter" title="Agent 1: Hunter" description="Start a new lead hunt &rarr; Find fresh prospects" icon={ICONS.research} />
                <AgentCTA to="/leadgen/researcher" title="Agent 2: Researcher" description="Enrich your scraped leads &rarr; Unlock insights" icon={ICONS.dna} />
                <AgentCTA to="/leadgen/personalizer" title="Agent 3: Personalizer" description="Turn insights into persuasive emails &rarr; Set tone & style" icon={ICONS.email} />
                <AgentCTA to="/leadgen/outreach" title="Agent 4: Outreach" description="Launch campaigns &rarr; Get replies & meetings" icon={ICONS.paperPlane} />
                <AgentCTA to="/leadgen/replier" title="Agent 5: Replier" description="Review AI-handled replies &rarr; Manage escalations" icon={ICONS.reply} />
            </div>
            <p className="text-center text-xs text-dark-text-secondary pt-4">Your AI agents don’t just find leads. They nurture them until conversion.</p>
        </div>
    );
};

export default OverviewPage;