
import React, { useState, useEffect, FormEvent, useRef, ReactNode } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { ICONS } from '../constants';
import * as n8n from '../services/n8nService';
import { CustomSolutionFormData, CustomSolutionMetric, CustomSolutionStakeholder, CustomSolutionPayload } from '../types';
import ActionNotification from '../components/ActionNotification';

// --- Reusable UI Components ---
const ProgressBar: React.FC<{ step: number; totalSteps: number }> = ({ step, totalSteps }) => {
    const progress = Math.max(10, (step / totalSteps) * 100);
    return (
        <div className="w-full bg-dark-bg rounded-full h-2.5 my-4 border border-dark-border">
            <motion.div
                className="bg-brand-primary h-full rounded-full"
                initial={{ width: '10%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
        </div>
    );
};

const WizardStep: React.FC<{ step: number; title: string; children: ReactNode; }> = ({ step, title, children }) => (
    <motion.div
        key={step}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
    >
        <h2 className="text-3xl font-bold text-white text-center">{title}</h2>
        {children}
    </motion.div>
);

const AIHelper: React.FC<{ step: number }> = ({ step }) => {
    let title = "Let's Get Started!";
    let insights: { title: string, text: string }[] = [{ title: "Why this info?", text: "Providing your name, email, and company helps us tailor the final solution and send it to you securely." }];
    let tips: { title: string, text: string }[] = [{ title: "Quick Tip", text: "Use your work email to ensure you receive the results." }];

    switch (step) {
        case 1:
            title = "Solution Architect";
            insights = [{ title: "Smart Insight", text: "73% of companies your size focus on efficiency first. This typically delivers 23% ROI in 90 days." }];
            tips = [{ title: "Quick Tip", text: "Be specific! The more details you provide, the better the solution we can create." }];
            break;
        case 2:
            title = "Analyzing Your Pain";
            insights = [{ title: "Pattern Detected", text: "Time constraints + data overwhelm = classic automation opportunity! Solution match: 94% confidence." }];
            tips = [{ title: "Cost Calculator", text: "Current waste: 20h × $50 = $1,000/week. Annual impact: $52,000 lost!" }];
            break;
        case 3:
            title = "Integration Analysis";
            insights = [{ title: "Smart Recommendations", text: "Perfect stack for automation! Recommended flows: Slack → Notion, Gmail → CRM." }];
            tips = [{ title: "Potential Issues", text: "Salesforce might need custom API development. Est. +2 weeks." }];
            break;
        case 4:
            title = "Investment Advisor";
            insights = [{ title: "Industry Benchmarks", text: "Companies your size typically budget $12-18K with a timeline of 6-8 weeks for a 280% avg ROI." }];
            tips = [{ title: "Smart Recommendation", text: "Your $15K budget is perfectly sized for your goals. Recommended tier: 'Growth Package'." }];
            break;
        case 5:
            title = "Success Predictor";
            insights = [{ title: "Goal Analysis", text: "Your targets are realistic and achievable! Success probability: 87% based on similar projects." }];
            tips = [{ title: "Quick Win Identified", text: "Email automation will show results in week 1! Instant dopamine hit guaranteed." }];
            break;
        case 6:
            title = "Decision Navigator";
            insights = [
                { title: "🎯 Approval Strategy", text: "Based on your stakeholders: \n1. Lead with ROI for CFO\n2. Address security for CTO\n3. Show training plan for team" },
                { title: "💼 Proposal Strategy", text: "We'll customize your proposal to address each stakeholder's specific concerns." }
            ];
            tips = [
                { title: "📊 Success Probability", text: "With your approval complexity: \nTimeline: 1-2 wks \nSuccess rate: 78% \nTypical objections: Budget concerns, Implementation" }
            ];
            break;
    }

    return (
        <div className="bg-dark-bg border border-dark-border rounded-xl p-4 space-y-4 h-full hidden lg:block">
            <h3 className="font-bold text-white text-center">🤖 {title}</h3>
            {insights.map((insight, i) => (
                 <div key={i} className="bg-dark-card p-3 rounded-lg">
                    <p className="font-semibold text-brand-accent text-sm">{insight.title}</p>
                    <p className="text-xs text-dark-text-secondary mt-1 whitespace-pre-wrap">{insight.text}</p>
                </div>
            ))}
            {tips.map((tip, i) => (
                <div key={i} className="bg-dark-card p-3 rounded-lg">
                    <p className="font-semibold text-brand-accent text-sm">{tip.title}</p>
                    <p className="text-xs text-dark-text-secondary mt-1 whitespace-pre-wrap">{tip.text}</p>
                </div>
            ))}
        </div>
    );
};

// --- Wizard Step Components ---
const OnboardingStep: React.FC<{ data: any, update: Function }> = ({ data, update }) => (
    <div className="max-w-md mx-auto space-y-4 text-center">
        <p className="text-dark-text-secondary">We'll ask 7 smart questions to design your perfect automation in 5 minutes.</p>
        <input type="text" value={data.firstName} onChange={e => update('firstName', e.target.value)} placeholder="What's your first name?" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-center" />
        <input type="email" value={data.email} onChange={e => update('email', e.target.value)} placeholder="Work email address" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-center" />
        <input type="text" value={data.company} onChange={e => update('company', e.target.value)} placeholder="Company/Organization" required className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-center" />
        <p className="text-xs text-dark-text-secondary">🔒 Your information is secure and private</p>
    </div>
);
const ObjectiveStep: React.FC<{ data: any, update: Function }> = ({ data, update }) => {
    const objectives = [ { icon: '💰', title: 'Revenue' }, { icon: '⚡', title: 'Efficiency' }, { icon: '😊', title: 'Experience' }, { icon: '📊', title: 'Insights' }, { icon: '📈', title: 'Scale' }, { icon: '🚀', title: 'Innovate' } ];
    return (
         <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-dark-text-secondary text-center">Choose your primary objective for 2024.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {objectives.map(obj => (
                    <button type="button" key={obj.title} onClick={() => update('primaryObjective', obj.title)} className={`p-4 rounded-xl border-2 text-center transition-all ${data.primaryObjective === obj.title ? 'bg-brand-primary/20 border-brand-primary' : 'bg-dark-bg border-dark-border hover:border-dark-text-secondary'}`}>
                        <span className="text-3xl">{obj.icon}</span>
                        <p className="font-bold mt-2">{obj.title}</p>
                    </button>
                ))}
            </div>
             <textarea value={data.specificGoal} onChange={e => update('specificGoal', e.target.value)} placeholder="💬 Describe your specific goal..." rows={3} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
        </div>
    );
};

const PainPointsStep: React.FC<{ data: any, update: Function }> = ({ data, update }) => {
    const challenges = ['⏰ Time Constraints', '👥 Resource Limits', '🧩 Process Complexity', '📊 Data Overwhelm', '🔄 Poor Coordination', '😤 Customer Issues'];
    const urgencies: { value: CustomSolutionFormData['urgency'], label: string}[] = [{value: 'critical', label: 'Critical - ASAP'}, {value: 'important', label: 'Important - Within 3 months'}, {value: 'moderate', label: 'Moderate - When convenient'}];
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-dark-text-secondary text-center">Let's identify your biggest pain points.</p>
            <div className="grid grid-cols-2 gap-2">
                {challenges.map(c => <button type="button" key={c} onClick={() => update('primaryChallenge', c)} className={`p-3 text-sm rounded-lg ${data.primaryChallenge === c ? 'bg-brand-primary text-white' : 'bg-dark-bg hover:bg-dark-border'}`}>{c}</button>)}
            </div>
            <textarea value={data.impactDescription} onChange={e => update('impactDescription', e.target.value)} placeholder="📝 Describe the specific impact (time/cost)..." rows={3} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
            <div>
                <label className="text-sm text-dark-text-secondary block mb-2">Pain Intensity Level: {data.painIntensity}/10</label>
                <input type="range" min="1" max="10" value={data.painIntensity} onChange={e => update('painIntensity', +e.target.value)} className="w-full" />
            </div>
            <div>
                <label className="text-sm text-dark-text-secondary block mb-2">Urgency Assessment</label>
                <div className="flex flex-col gap-2">{urgencies.map(u => <label key={u.value} className="flex items-center gap-2 p-2 rounded-lg bg-dark-bg"><input type="radio" name="urgency" value={u.value} checked={data.urgency === u.value} onChange={e=>update('urgency', e.target.value)} />{u.label}</label>)}</div>
            </div>
        </div>
    );
};

const KNOWN_TOOLS: { [key: string]: { name: string; status: 'integrable' | 'complex' | 'api'; logo: string; category: string } } = {
  slack: { name: 'Slack', status: 'integrable', logo: '💬', category: 'Communication' },
  gmail: { name: 'Google Workspace', status: 'integrable', logo: '📧', category: 'Email' },
  notion: { name: 'Notion', status: 'integrable', logo: '📝', category: 'Project Mgmt' },
  salesforce: { name: 'Salesforce', status: 'complex', logo: '☁️', category: 'CRM' },
  zendesk: { name: 'Zendesk', status: 'complex', logo: '🎧', category: 'Support'},
  hubspot: { name: 'HubSpot', status: 'complex', logo: '🧡', category: 'CRM'},
  sheets: { name: 'Google Sheets', status: 'integrable', logo: '📄', category: 'Analytics'},
};
const TOOL_CATEGORIES = ['CRM', 'Communication', 'Project Mgmt', 'Email', 'Finance', 'Design', 'Analytics', 'Cloud Storage'];

const TechStackStep: React.FC<{ data: any, update: Function }> = ({ data, update }) => {
    const [techSearch, setTechSearch] = useState('');
    const addTool = (toolName: string) => {
        const normalized = toolName.toLowerCase();
        const existing = data.techStack.find((t: any) => t.name.toLowerCase() === normalized);
        if (toolName && !existing) {
            const known = Object.values(KNOWN_TOOLS).find(t => t.name.toLowerCase() === normalized);
            const newTool = { name: toolName, status: known?.status || 'api' };
            update('techStack', [...data.techStack, newTool]);
        }
        setTechSearch('');
    };
    const removeTool = (toolName: string) => {
        update('techStack', data.techStack.filter((t: any) => t.name !== toolName));
    };
    const complexityScore = data.techStack.reduce((score: number, tool: any) => {
        if(tool.status === 'integrable') return score + 10;
        if(tool.status === 'complex') return score + 5;
        return score + 2;
    }, 0);
    const automationReadyPercent = Math.min(100, Math.round(complexityScore / (data.techStack.length * 10) * 100));

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <input type="text" value={techSearch} onChange={e => setTechSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTool(techSearch))} placeholder="🔍 Search and add your tools (e.g., Slack, Notion...)" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
            <div className="p-4 bg-dark-bg rounded-lg min-h-[120px] border border-dark-border">
                {data.techStack.map((tool: any, i: number) => <button type="button" onClick={() => removeTool(tool.name)} key={i} className="inline-flex items-center gap-2 bg-dark-border rounded-full px-3 py-1 text-sm mr-2 mb-2">{KNOWN_TOOLS[tool.name.toLowerCase()]?.logo} {tool.name} <span className="text-xs">&times;</span></button>)}
            </div>
            {data.techStack.length > 0 && <div><label className="text-sm">Integration Complexity: {automationReadyPercent}% Automation-Ready!</label><progress value={automationReadyPercent} max="100" className="w-full" /></div>}
            <textarea value={data.customTools} onChange={e => update('customTools', e.target.value)} placeholder="🤔 Any tools missing? Describe them here..." rows={2} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
        </div>
    );
};

const ResourcesStep: React.FC<{ data: any, update: Function }> = ({ data, update }) => {
    const annualSavings = Math.round((data.painIntensity / 10) * 52000 + data.budget * 2);
    const paybackMonths = data.budget > 0 ? (data.budget / (annualSavings / 12)).toFixed(1) : '0';
    const fiveYearValue = (annualSavings * 5 - data.budget).toLocaleString();
    const roi = data.budget > 0 ? Math.round(((annualSavings - data.budget) / data.budget) * 100) : 0;
    return (
    <div className="max-w-2xl mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <select value={data.teamSize} onChange={e => update('teamSize', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3"><option>1-5</option><option>6-20</option><option>21-100</option><option>100+</option></select>
            <select value={data.timeline} onChange={e => update('timeline', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3"><option>1-2 months</option><option>3-6 months</option><option>6+ months</option></select>
        </div>
        <div>
            <label className="text-sm text-dark-text-secondary block mb-2">Team Tech Level: {data.techLevel}/5</label>
            <input type="range" min="1" max="5" value={data.techLevel} onChange={e => update('techLevel', +e.target.value)} className="w-full" />
        </div>
        <div>
            <label className="text-sm text-dark-text-secondary block mb-2">Budget: ${data.budget.toLocaleString()}</label>
            <input type="range" min="1000" max="50000" step="1000" value={data.budget} onChange={e => update('budget', +e.target.value)} className="w-full" />
        </div>
        <div className="bg-dark-bg rounded-lg p-4 text-center">
            <p className="font-bold text-white">🔥 Instant ROI Calculation</p>
            <p className="text-2xl text-green-400 font-bold">{roi}% ROI (Year 1)</p>
            <p className="text-sm text-dark-text-secondary">Payback in {paybackMonths} months • 5-Year Value: ${fiveYearValue}</p>
        </div>
    </div>
)};

const SuccessMetricsStep: React.FC<{ data: any, update: Function }> = ({ data, update }) => {
    const addMetric = () => update('metrics', [...data.metrics, { name: 'Revenue Impact', current: '', target: ''}]);
    return (
     <div className="max-w-2xl mx-auto space-y-4">
        {data.metrics.map((metric: any, i: number) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-end">
                <select value={metric.name} onChange={e => { const newMetrics = [...data.metrics]; newMetrics[i].name = e.target.value; update('metrics', newMetrics); }} className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-sm"><option>Time Saved</option><option>Revenue Impact</option><option>Customer Satisfaction</option></select>
                <input value={metric.current} onChange={e => { const newMetrics = [...data.metrics]; newMetrics[i].current = e.target.value; update('metrics', newMetrics); }} placeholder="Current State" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2" />
                <input value={metric.target} onChange={e => { const newMetrics = [...data.metrics]; newMetrics[i].target = e.target.value; update('metrics', newMetrics); }} placeholder="Target Goal" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2" />
            </div>
        ))}
        <button type="button" onClick={addMetric} className="text-sm text-brand-accent">+ Add Another Metric</button>
        <div>
            <label className="text-sm text-dark-text-secondary block mb-2">Risk Tolerance: {data.riskTolerance}/5 ({data.riskTolerance > 3 ? 'Aggressive' : 'Conservative'})</label>
            <input type="range" min="1" max="5" value={data.riskTolerance} onChange={e => update('riskTolerance', +e.target.value)} className="w-full" />
        </div>
    </div>
);
}

const InfluencePicker: React.FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onChange(i)}
                    className={`w-3 h-3 rounded-full transition-colors ${i <= value ? 'bg-brand-primary' : 'bg-dark-border hover:bg-dark-text-secondary'}`}
                    aria-label={`Set influence to ${i}`}
                />
            ))}
        </div>
    );
};

const StakeholdersStep: React.FC<{ data: any, update: Function }> = ({ data, update }) => {
    const addStakeholder = () => update('stakeholders', [...data.stakeholders, { name: '', influence: 3, concern: '' }]);
    const updateStakeholder = (index: number, field: keyof CustomSolutionStakeholder, value: any) => {
        const newStakeholders = [...data.stakeholders];
        newStakeholders[index] = { ...newStakeholders[index], [field]: value };
        update('stakeholders', newStakeholders);
    };

    const decisionMakers = [
        { value: 'me', label: "That's me (I can approve this)" },
        { value: 'manager', label: "My manager/supervisor" },
        { value: 'committee', label: "Executive committee/board" },
        { value: 'team', label: "Shared decision with team" },
    ];

    const complexities = [
        { value: 'simple', label: "🟢 Simple (Just me - decision today)" },
        { value: 'standard', label: "🟡 Standard (Manager approval - 1-2 weeks)" },
        { value: 'complex', label: "🔴 Complex (Multiple approvals - 1+ months)" },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-dark-text-secondary text-center">Help us navigate your approval process</p>
            
            <div className="space-y-2">
                <label className="font-semibold text-dark-text-secondary">DECISION MAKER:</label>
                {decisionMakers.map(dm => (
                    <label key={dm.value} className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg cursor-pointer hover:bg-dark-border">
                        <input type="radio" name="decisionMaker" value={dm.value} checked={data.decisionMaker === dm.value} onChange={e => update('decisionMaker', e.target.value)} className="w-4 h-4 text-brand-primary bg-dark-border border-dark-border focus:ring-brand-primary"/>
                        <span>{dm.label}</span>
                    </label>
                ))}
            </div>

            <div>
                <label className="font-semibold text-dark-text-secondary">KEY STAKEHOLDERS:</label>
                <div className="bg-dark-bg rounded-lg p-3 mt-1 space-y-2">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-xs font-bold text-dark-text-secondary px-2">
                        <span>Name/Role</span>
                        <span>Influence</span>
                        <span>Primary Concern</span>
                    </div>
                    {data.stakeholders.map((s: CustomSolutionStakeholder, i: number) => (
                        <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                            <input value={s.name} onChange={e => updateStakeholder(i, 'name', e.target.value)} placeholder="e.g., Sarah (CTO)" className="bg-dark-border p-2 rounded-md text-sm w-full"/>
                            <InfluencePicker value={s.influence} onChange={val => updateStakeholder(i, 'influence', val)} />
                            <input value={s.concern} onChange={e => updateStakeholder(i, 'concern', e.target.value)} placeholder="e.g., Security & Privacy" className="bg-dark-border p-2 rounded-md text-sm w-full"/>
                        </div>
                    ))}
                    <button type="button" onClick={addStakeholder} className="text-sm text-brand-accent hover:underline px-2">+ Add Stakeholder</button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="font-semibold text-dark-text-secondary">APPROVAL COMPLEXITY:</label>
                {complexities.map(c => (
                     <label key={c.value} className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg cursor-pointer hover:bg-dark-border">
                        <input type="radio" name="approvalComplexity" value={c.value} checked={data.approvalComplexity === c.value} onChange={e => update('approvalComplexity', e.target.value)} className="w-4 h-4 text-brand-primary bg-dark-border border-dark-border focus:ring-brand-primary"/>
                        <span>{c.label}</span>
                    </label>
                ))}
            </div>

             <div>
                <label className="font-semibold text-dark-text-secondary block mb-1">DECISION TIMELINE:</label>
                <select value={data.decisionTimeline} onChange={e => update('decisionTimeline', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3">
                    <option>Within 1 week</option>
                    <option>2-4 weeks</option>
                    <option>1-3 months</option>
                    <option>3+ months</option>
                </select>
            </div>

             <div className="bg-dark-bg border border-dark-border rounded-xl p-4 space-y-2">
                <p className="font-semibold text-brand-accent">💡 Would a stakeholder presentation help?</p>
                <p className="text-sm text-dark-text-secondary">We can create a custom deck with your ROI data.</p>
                 <label className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={data.includePresentation} onChange={e => update('includePresentation', e.target.checked)} className="w-4 h-4 rounded text-brand-primary bg-dark-border border-dark-border focus:ring-brand-primary" /> Yes, include presentation materials</label>
            </div>
        </div>
    );
};

const AnimatedInsight: React.FC<{ value: number, label: string, prefix?: string, suffix?: string, duration?: number }> = ({ value, label, prefix = '', suffix = '', duration = 1.5 }) => {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const controls = animate(0, value, {
            duration,
            onUpdate(latest) {
                node.textContent = Math.round(latest).toLocaleString();
            }
        });
        return () => controls.stop();
    }, [value, duration]);
    return (
        <div className="flex justify-between items-baseline text-sm">
            <span>{label}</span>
            <span className="font-bold text-white text-base">
                {prefix}<span ref={ref}>0</span>{suffix}
            </span>
        </div>
    );
};

const SolutionGenerationStep: React.FC<{ onShowBlueprint: () => void }> = ({ onShowBlueprint }) => {
    const analysisSteps = [
        "Goal analysis complete", "Pain points mapped and quantified", "Technology stack compatibility verified",
        "Resource requirements calculated", "Success metrics benchmarked", "Stakeholder strategy developed",
        "Custom workflow generation in progress...", "ROI optimization calculations..."
    ];
    const [completedSteps, setCompletedSteps] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCompletedSteps(prev => {
                if (prev < analysisSteps.length) {
                    return prev + 1;
                }
                clearInterval(interval);
                setShowConfetti(true);
                setTimeout(() => setIsComplete(true), 500); 
                return prev;
            });
        }, 600);
        return () => clearInterval(interval);
    }, []);

    const insightData = {
        opportunities: 5, efficiency: 67, quickWins: 3, compatibility: 100, savings: 47200, timeline: 4, score: 94
    };

    return (
        <div className="text-center py-8 relative">
            {showConfetti && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl pointer-events-none z-[100]"><div className="animate-confetti-burst">🎊</div></div>}
            <h2 className="text-3xl font-bold text-white mb-4">🤖 Generating Your Custom AI Solution</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-left">
                    <h3 className="font-bold text-dark-text-secondary text-sm uppercase mb-2">Analysis Progress</h3>
                    <ul className="space-y-1.5 text-sm">
                        {analysisSteps.map((step, i) => (
                            <li key={i} className={`flex items-center gap-2 transition-opacity duration-300 ${completedSteps > i ? 'opacity-100' : 'opacity-40'}`}>
                                <span className={completedSteps > i ? 'text-green-400' : 'text-dark-text-secondary'}>{completedSteps > i ? '✅' : '⏳'}</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="bg-dark-bg border border-dark-border rounded-lg p-4 text-left space-y-2">
                     <h3 className="font-bold text-dark-text-secondary text-sm uppercase mb-2">🧠 AI Insights Preview</h3>
                     <AnimatedInsight value={insightData.opportunities} label="💡 Automation opportunities" />
                     <AnimatedInsight value={insightData.efficiency} label="📊 Efficiency improvement possible" suffix="%" />
                     <AnimatedInsight value={insightData.quickWins} label="⚡ Quick wins available (Week 1)" />
                     <AnimatedInsight value={insightData.compatibility} label="🔗 Tool compatibility" suffix="%" />
                     <AnimatedInsight value={insightData.savings} label="💰 Annual savings projected" prefix="$" />
                     <AnimatedInsight value={insightData.timeline} label="⏱️ Implementation timeline" suffix="-week" />
                     <div className="pt-2 mt-2 border-t border-dark-border">
                        <AnimatedInsight value={insightData.score} label="🎯 Your Custom Solution Score" suffix="/100" duration={2.5}/>
                     </div>
                </div>
            </div>
            
            <AnimatePresence>
            {isComplete && (
                <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-8 flex justify-center items-center gap-4">
                     <button onClick={onShowBlueprint} className="bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg">
                        🎯 View Complete Solution Blueprint →
                    </button>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};


// --- Main Page Component ---
const CustomSolutionPage: React.FC = () => {
    const [step, setStep] = useState(0); // 0: Onboarding, 1-6: Wizard, 7: Analyzing, 8: Blueprint
    const [formData, setFormData] = useState<CustomSolutionFormData>({
        firstName: '', email: '', company: '', primaryObjective: '', specificGoal: '', primaryChallenge: '', impactDescription: '', painIntensity: 5, urgency: 'important',
        techStack: [], customTools: '',
        teamSize: '1-5', techLevel: 3, manager: 'me', budget: 15000, timeline: '1-2 months',
        metrics: [{ name: 'Time Saved', current: '', target: '' }], riskTolerance: 2,
        decisionMaker: 'me',
        stakeholders: [],
        approvalComplexity: 'standard', decisionTimeline: '2-4 weeks', includePresentation: true,
    });
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [solutionData, setSolutionData] = useState<any>(null);

    const updateFormData = (field: keyof CustomSolutionFormData, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };
    
    const handleNext = async () => {
        if (step < 6) {
            setStep(s => s + 1);
        } else {
            setIsSubmitting(true);
            try {
                const payload: CustomSolutionPayload = { ...formData };
                await n8n.submitCustomSolution(payload);
                setStep(7); // Go to Analyzing step
            } catch (err: any) {
                setNotification({ message: err.message || "An unexpected error occurred.", type: 'error'});
                // Don't reset step on error, let them try again
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(s => s - 1);
    };

    const totalWizardSteps = 7; // 1 onboarding + 6 wizard steps

    const renderStepContent = () => {
        switch(step) {
            case 0: return <WizardStep step={0} title="🎯 Let's Get Started"><OnboardingStep data={formData} update={updateFormData} /></WizardStep>;
            case 1: return <WizardStep step={1} title="🎯 What drives your business?"><ObjectiveStep data={formData} update={updateFormData} /></WizardStep>;
            case 2: return <WizardStep step={2} title="😫 What's holding your business back?"><PainPointsStep data={formData} update={updateFormData} /></WizardStep>;
            case 3: return <WizardStep step={3} title="🔧 What tools does your team use?"><TechStackStep data={formData} update={updateFormData} /></WizardStep>;
            case 4: return <WizardStep step={4} title="💼 Let's plan your automation investment"><ResourcesStep data={formData} update={updateFormData} /></WizardStep>;
            case 5: return <WizardStep step={5} title="📊 How will we measure your success?"><SuccessMetricsStep data={formData} update={updateFormData} /></WizardStep>;
            case 6: return <WizardStep step={6} title="👥 Who's involved in making this decision?"><StakeholdersStep data={formData} update={updateFormData} /></WizardStep>;
            case 7: return <SolutionGenerationStep onShowBlueprint={() => setStep(8)} />;
            case 8: return (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center">
                    <h2 className="text-3xl font-bold">🚀 Your Custom AI Solution Blueprint</h2>
                    <div className="mt-6 bg-dark-bg p-4 rounded-lg">
                        <h3 className="font-bold mb-2">Impact Summary</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <p>💰 ROI: 314%</p>
                            <p>⚡ Time Saved: 30h/week</p>
                            <p>🎯 Success: 87%</p>
                        </div>
                    </div>
                    <a href="https://cal.com/zulari-agency" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg">
                        Book Premium Strategy Call
                    </a>
                </motion.div>
            );
            default: return null;
        }
    }
    
    return (
        <div className="space-y-4">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">
                        {step <= 6 && <ProgressBar step={step} totalSteps={totalWizardSteps} />}
                        <AnimatePresence mode="wait">
                            {renderStepContent()}
                        </AnimatePresence>
                    </div>
                    {step > 0 && step <= 6 && <AIHelper step={step} />}
                </div>

                {step <= 6 && (
                     <div className="flex justify-between items-center mt-8 pt-4 border-t border-dark-border">
                        <button onClick={handleBack} disabled={step === 0 || isSubmitting} className="bg-dark-bg hover:bg-dark-border text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">
                            Back
                        </button>
                         <button onClick={handleNext} disabled={isSubmitting} className="bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">
                            {isSubmitting ? '...' : (step === 6 ? 'Generate Solution' : 'Continue →')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomSolutionPage;
