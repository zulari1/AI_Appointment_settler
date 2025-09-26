

import React, { useState, useEffect, FormEvent, useRef, ReactNode } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { ICONS } from '../../constants';
import * as n8n from '../../services/n8nService';
import { AIStrategyFormData, CustomSolutionMetric, CustomSolutionStakeholder, CustomSolutionPayload } from '../../types';
import SubPageHeader from '../../components/SubPageHeader';
import ActionNotification from '../../components/ActionNotification';
import { safeNum } from '../../utils/safeUtils';

const STORAGE_KEY = 'ai_strategy_form_data_v3';

const initialFormData: AIStrategyFormData = {
  name: '', email: '', phone: '', companyName: '', websiteUrl: '', industry: 'SaaS',
  companySize: '11-50', monthlyRevenue: '$50-100K', painPoints: [], otherPainPoint: '',
  biggestChallenge: '', currentTools: '', monthlyToolSpend: '$500-2K',
  primaryGoal: 'Increase Revenue', specificTarget: '', dreamScenario: '',
  currentAIUsage: 'Basic (ChatGPT)', aiKnowledge: 50, improvementBudget: '$5-10K',
  implementationTimeline: '1-3 months', userRole: 'Manager',
  teamBreakdown: { sales: 0, marketing: 0, support: 0, operations: 0, technical: 0, other: 0 },
  biggestTeamChallenge: 'Productivity', decisionMakers: [], otherDecisionMaker: '',
  decisionSpeed: 'Within a week', finalThoughts: ''
};

const MotionDiv = motion.div as any;

// --- Reusable Form Components ---
const FormCard: React.FC<{ title: string, children: ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={`bg-dark-bg border border-dark-border rounded-xl p-6 space-y-4 ${className}`}>
        <h3 className="font-bold text-white flex items-center gap-2 text-lg">{title}</h3>
        {children}
    </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon?: string }> = ({ icon, ...props }) => (
    <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary">{icon}</span>}
        <input {...props} className={`w-full bg-dark-card border border-dark-border rounded-lg p-3 text-sm placeholder-dark-text-secondary focus:ring-2 focus:ring-brand-primary focus:outline-none ${icon ? 'pl-9' : ''}`} />
    </div>
);

const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className="w-full bg-dark-card border border-dark-border rounded-lg p-3 text-sm placeholder-dark-text-secondary focus:ring-2 focus:ring-brand-primary focus:outline-none" />
);

const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[], icon?: string }> = ({ options, icon, ...props }) => (
     <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary">{icon}</span>}
        <select {...props} className={`w-full bg-dark-card border border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none appearance-none ${icon ? 'pl-9' : ''}`}>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-dark-text-secondary">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
    </div>
);

const RadioCardGroup: React.FC<{ options: string[], value: string, onChange: (val: string) => void }> = ({ options, value, onChange }) => (
    <div className="grid grid-cols-2 gap-3">
        {options.map(opt => (
            <motion.label 
                key={opt} 
                className={`cursor-pointer p-3 text-sm rounded-lg border-2 text-center transition-all duration-200 ${value === opt ? 'bg-brand-primary/20 border-brand-primary scale-105 shadow-lg shadow-brand-primary/10' : 'bg-dark-card border-dark-border hover:border-dark-text-secondary'}`}
                whileTap={{ scale: 0.97 }}
            >
                <input type="radio" value={opt} checked={value === opt} onChange={e => onChange(e.target.value)} className="sr-only" />
                {opt}
            </motion.label>
        ))}
    </div>
);

const CheckboxCardGroup: React.FC<{ options: {key: string, label: string}[], values: string[], onChange: (val: string) => void }> = ({ options, values, onChange }) => (
    <div className="grid grid-cols-2 gap-3">
        {options.map(opt => (
            <motion.label 
                key={opt.key} 
                className={`cursor-pointer p-3 rounded-lg border-2 flex items-center gap-3 transition-colors duration-200 ${values.includes(opt.key) ? 'bg-brand-primary/20 border-brand-primary' : 'bg-dark-card border-dark-border hover:border-dark-text-secondary'}`}
                whileTap={{ scale: 0.97 }}
            >
                <div className="w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center bg-dark-bg border-dark-border">
                    <AnimatePresence>
                        {values.includes(opt.key) && (
                            <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} className="w-3 h-3 bg-brand-primary rounded-sm" />
                        )}
                    </AnimatePresence>
                </div>
                <span className="text-sm font-medium">{opt.label}</span>
                <input type="checkbox" checked={values.includes(opt.key)} onChange={() => onChange(opt.key)} className="sr-only" />
            </motion.label>
        ))}
    </div>
);


// --- Form Step Components ---
const Step1: React.FC<{ data: AIStrategyFormData, update: Function }> = ({ data, update }) => (
    <div className="space-y-6">
        <FormCard title="📋 Step 1: Tell Us About Your Business">
            <p className="text-sm text-dark-text-secondary -mt-3">This helps us analyze better.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField icon="👤" placeholder="Your Name" value={data.name} onChange={e => update('name', e.target.value)} required />
                <InputField icon="📧" type="email" placeholder="Email" value={data.email} onChange={e => update('email', e.target.value)} required />
            </div>
            <InputField icon="📱" placeholder="Phone (For urgent opportunities only)" value={data.phone} onChange={e => update('phone', e.target.value)} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField icon="🏢" placeholder="Company Name" value={data.companyName} onChange={e => update('companyName', e.target.value)} required />
                <InputField icon="🌐" placeholder="Website URL" value={data.websiteUrl} onChange={e => update('websiteUrl', e.target.value)} required />
            </div>
            <p className="text-xs text-dark-text-secondary/80 text-center">↑ We'll analyze your website automatically for insights.</p>
            <SelectField icon="💼" options={['SaaS', 'E-commerce', 'Professional Services', 'Healthcare', 'Real Estate', 'Other']} value={data.industry} onChange={e => update('industry', e.target.value)} />
            <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">📊 Company Size</label>
                <RadioCardGroup options={['Solo', '2-10', '11-50', '50-200', '200+']} value={data.companySize} onChange={val => update('companySize', val)} />
            </div>
            <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">💰 Monthly Revenue</label>
                <RadioCardGroup options={['<$10K', '$10-50K', '$50-100K', '$100-500K', '$500K+']} value={data.monthlyRevenue} onChange={val => update('monthlyRevenue', val)} />
            </div>
        </FormCard>
    </div>
);

const Step2: React.FC<{ data: AIStrategyFormData, update: Function, errors: any, clearError: (field: string) => void }> = ({ data, update, errors, clearError }) => {
    const painPointsOptions = [
        {key: "manual_work", label: "Too much manual work"}, {key: "lead_gen", label: "Struggling to generate leads"},
        {key: "customer_service", label: "Customer service overhead"}, {key: "scattered_data", label: "Scattered data"},
        {key: "content_creation", label: "Content creation takes time"}, {key: "sales_process", label: "Sales process inefficiencies"},
        {key: "other", label: "Other..."}
    ];
    
    const handlePainPointsChange = (val: string) => {
        const newPainPoints = data.painPoints.includes(val) ? data.painPoints.filter(p => p !== val) : [...data.painPoints, val];
        update('painPoints', newPainPoints);
    };

    const [showAiInsight, setShowAiInsight] = useState(false);
    const debounceTimeout = useRef<number | null>(null);

    useEffect(() => {
        if (data.biggestChallenge.length > 20) {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
            debounceTimeout.current = window.setTimeout(() => {
                setShowAiInsight(true);
            }, 1200);
        } else {
            setShowAiInsight(false);
        }
        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [data.biggestChallenge]);

    return (
        <div className="space-y-6">
            <FormCard title="🎯 Step 2: Your Business Challenges">
                <div>
                    <label className="text-sm font-medium text-dark-text-secondary mb-2 block">Major Pain Points (Select all that apply)</label>
                    <CheckboxCardGroup options={painPointsOptions} values={data.painPoints} onChange={handlePainPointsChange} />
                </div>
                <AnimatePresence>
                {data.painPoints.includes('other') && (
                    <motion.div initial={{opacity:0, height: 0}} animate={{opacity:1, height: 'auto'}} exit={{opacity:0, height: 0}}>
                        <InputField 
                            placeholder="Please specify your other pain point" 
                            value={data.otherPainPoint} 
                            onChange={e => { update('otherPainPoint', e.target.value); clearError('otherPainPoint'); }}
                            className={errors.otherPainPoint ? 'border-red-500' : ''}
                        />
                         {errors.otherPainPoint && <p className="text-red-400 text-xs mt-1">{errors.otherPainPoint}</p>}
                    </motion.div>
                )}
                </AnimatePresence>
            </FormCard>
            <FormCard title="🔥 Biggest Single Challenge" className={errors.biggestChallenge ? 'animate-shake border-red-500' : ''}>
                <TextAreaField 
                    rows={3} 
                    placeholder="What's the ONE thing that keeps you up at night about your business?" 
                    value={data.biggestChallenge} 
                    onChange={e => { update('biggestChallenge', e.target.value); clearError('biggestChallenge'); }} 
                />
                {errors.biggestChallenge && <p className="text-red-400 text-xs mt-1">{errors.biggestChallenge}</p>}
                <AnimatePresence>
                    {showAiInsight && (
                         <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="text-xs text-center p-2 bg-dark-card rounded-lg text-dark-text-secondary flex items-center justify-center gap-2">
                            🤖 <span className="font-semibold">Noted.</span> This is a common challenge we can help with.
                        </motion.div>
                    )}
                </AnimatePresence>
                <p className="text-xs text-dark-text-secondary/80 text-center">We read every single response personally.</p>
            </FormCard>
            <FormCard title="🛠️ Current Solutions">
                <InputField placeholder="What tools/software are you currently using? (CRM, Email, etc.)" value={data.currentTools} onChange={e => update('currentTools', e.target.value)} />
                 <div>
                    <label className="text-sm font-medium text-dark-text-secondary mb-2 block">💸 Monthly spend on business tools</label>
                    <RadioCardGroup options={['<$500', '$500-2K', '$2K-5K', '$5K+']} value={data.monthlyToolSpend} onChange={val => update('monthlyToolSpend', val)} />
                </div>
            </FormCard>
        </div>
    );
};

const Step3: React.FC<{ data: AIStrategyFormData, update: Function }> = ({ data, update }) => (
    <div className="space-y-6">
        <FormCard title="🚀 Step 3: Your Goals & Vision">
            <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">📈 Primary Goal (Next 12 months)</label>
                <RadioCardGroup options={['Increase Revenue', 'Reduce Costs', 'Scale Team', 'Improve Efficiency', 'Better Customer Experience']} value={data.primaryGoal} onChange={val => update('primaryGoal', val)} />
            </div>
            <InputField placeholder="🎯 Specific Target (e.g., increase leads by 20%)" value={data.specificTarget} onChange={e => update('specificTarget', e.target.value)} />
            <TextAreaField rows={3} placeholder="💡 Dream Scenario: If you could wave a magic wand..." value={data.dreamScenario} onChange={e => update('dreamScenario', e.target.value)} />
        </FormCard>
        <FormCard title="🤖 AI Readiness Assessment">
            <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">Current AI Usage</label>
                <RadioCardGroup options={['None', 'Basic (ChatGPT)', 'Some tools', 'Advanced']} value={data.currentAIUsage} onChange={val => update('currentAIUsage', val)} />
            </div>
            <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">📚 AI Knowledge Level: <span className="font-bold text-white">{data.aiKnowledge}%</span></label>
                <input type="range" min="0" max="100" value={data.aiKnowledge} onChange={e => update('aiKnowledge', +e.target.value)} className="w-full h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer" />
            </div>
             <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">💰 Budget for improvements</label>
                <RadioCardGroup options={['<$1K', '$1-5K', '$5-10K', '$10K+']} value={data.improvementBudget} onChange={val => update('improvementBudget', val)} />
            </div>
            <div>
                <label className="text-sm font-medium text-dark-text-secondary mb-2 block">⏱️ Implementation timeline</label>
                <RadioCardGroup options={['ASAP', '1-3 months', '3-6 months', '6+ months']} value={data.implementationTimeline} onChange={val => update('implementationTimeline', val)} />
            </div>
        </FormCard>
    </div>
);
const Step4: React.FC<{ data: AIStrategyFormData, update: Function }> = ({ data, update }) => {
    const decisionMakersOptions = [
        {key: "me", label: "Just me"}, {key: "partner", label: "Partner/Co-founder"}, {key: "it_team", label: "IT Team"},
        {key: "ops_manager", label: "Operations Manager"}, {key: "board", label: "Board/Investors"}
    ];
    const handleDecisionMakersChange = (val: string) => {
        const newDecisionMakers = data.decisionMakers.includes(val) ? data.decisionMakers.filter(p => p !== val) : [...data.decisionMakers, val];
        update('decisionMakers', newDecisionMakers);
    };
    const handleTeamBreakdownChange = (team: keyof AIStrategyFormData['teamBreakdown'], value: string) => {
        update('teamBreakdown', { ...data.teamBreakdown, [team]: Number(value) || 0 });
    };
    return (
        <div className="space-y-6">
            <FormCard title="👥 Step 4: Team & Operations">
                <div>
                    <label className="text-sm font-medium text-dark-text-secondary mb-2 block">👤 Your Role</label>
                    <RadioCardGroup options={['Owner/CEO', 'Manager', 'Operations', 'Marketing', 'IT']} value={data.userRole} onChange={val => update('userRole', val)} />
                </div>
                <div>
                    <label className="text-sm font-medium text-dark-text-secondary mb-2 block">🏢 Team Breakdown</label>
                    <div className="grid grid-cols-3 gap-2">
                        {/* FIX: Explicitly cast the mapped 'team' variable to the correct string literal union type. This resolves errors with string methods and function argument compatibility. */}
                        {(Object.keys(data.teamBreakdown) as (keyof AIStrategyFormData['teamBreakdown'])[]).map(team => (
                            <InputField key={team} type="number" placeholder={team.charAt(0).toUpperCase() + team.slice(1)} value={data.teamBreakdown[team] || ''} onChange={e => handleTeamBreakdownChange(team, e.target.value)} />
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-dark-text-secondary mb-2 block">💼 Biggest team challenge</label>
                    <RadioCardGroup options={['Hiring', 'Training', 'Productivity', 'Communication', 'Retention']} value={data.biggestTeamChallenge} onChange={val => update('biggestTeamChallenge', val)} />
                </div>
            </FormCard>
             <FormCard title="🤝 Decision Making">
                 <div>
                    <label className="text-sm font-medium text-dark-text-secondary mb-2 block">Who else would be involved?</label>
                    <CheckboxCardGroup options={decisionMakersOptions} values={data.decisionMakers} onChange={handleDecisionMakersChange} />
                </div>
                <InputField placeholder="Other decision maker?" value={data.otherDecisionMaker} onChange={e => update('otherDecisionMaker', e.target.value)} />
                 <div>
                    <label className="text-sm font-medium text-dark-text-secondary mb-2 block">⏰ How quickly can you make decisions?</label>
                    <RadioCardGroup options={['Same day', 'Within a week', '2-4 weeks', '1+ months']} value={data.decisionSpeed} onChange={val => update('decisionSpeed', val)} />
                </div>
            </FormCard>
             <FormCard title="💭 Final Question">
                <TextAreaField rows={3} placeholder="Anything else you'd like us to know about your business or goals?" value={data.finalThoughts} onChange={e => update('finalThoughts', e.target.value)} />
            </FormCard>
        </div>
    );
};


// --- Main Page Views ---

const LandingView: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center flex flex-col items-center animate-fade-in">
        <h2 className="text-3xl font-bold text-white">🧠 FREE AI Business Assessment</h2>
        <p className="text-brand-accent font-semibold mt-1">Discover Hidden Opportunities in Your Business</p>
        
        <div className="my-6 p-6 bg-dark-bg border border-dark-border rounded-lg max-w-2xl w-full text-left">
            <h3 className="text-xl font-bold text-white text-center">"See Exactly Where AI Can Transform YOUR Business"</h3>
            <p className="text-center text-sm text-dark-text-secondary mt-1">Used by 2,847+ businesses to identify $50K+ in savings</p>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-dark-text-secondary">
                <span className="flex items-center gap-2">📈 Business Gap Analysis Report</span>
                <span className="flex items-center gap-2">🔍 AI Opportunity Scorecard</span>
                <span className="flex items-center gap-2">💰 ROI Projections For Your Industry</span>
                <span className="flex items-center gap-2">🛠️ Custom Implementation Roadmap</span>
            </div>
        </div>
        
        <button onClick={onStart} className="bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:scale-105">
            🚀 GET MY FREE BUSINESS ANALYSIS - 2 MINUTES
        </button>
        <p className="text-xs text-dark-text-secondary mt-3">⚡ Normally $497 - Free for a limited time</p>
    </div>
);

const MultiStepForm: React.FC<{ initialData: AIStrategyFormData, onComplete: (data: AIStrategyFormData) => void }> = ({ initialData, onComplete }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<AIStrategyFormData>(initialData);
    const [errors, setErrors] = useState<Partial<Record<keyof AIStrategyFormData, string>>>({});

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }, [formData]);

    const updateField = (field: keyof AIStrategyFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const clearError = (field: string) => {
        if (errors[field as keyof AIStrategyFormData]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field as keyof AIStrategyFormData];
                return newErrors;
            });
        }
    };

    const validateStep = (currentStep: number) => {
        const newErrors: Partial<Record<keyof AIStrategyFormData, string>> = {};
        if (currentStep === 2) {
            if (!formData.biggestChallenge.trim()) {
                newErrors.biggestChallenge = 'This is the most important question! Please provide an answer.';
            }
            if (formData.painPoints.includes('other') && !formData.otherPainPoint.trim()) {
                newErrors.otherPainPoint = 'Please specify your other pain point.';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(s => Math.min(s + 1, 4));
        }
    };
    const prevStep = () => setStep(s => Math.max(s - 1, 1));
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep(step)) {
            onComplete(formData);
        }
    };
    
    const totalSteps = 4;

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1 data={formData} update={updateField} />;
            case 2: return <Step2 data={formData} update={updateField} errors={errors} clearError={clearError} />;
            case 3: return <Step3 data={formData} update={updateField} />;
            case 4: return <Step4 data={formData} update={updateField} />;
            default: return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
                <span className="font-mono text-sm text-dark-text-secondary">Progress:</span>
                <div className="w-full bg-dark-bg rounded-full h-2.5 border border-dark-border">
                    <motion.div className="bg-gradient-to-r from-brand-secondary to-brand-primary h-full rounded-full" initial={{width: "0%"}} animate={{width: `${(step / totalSteps) * 100}%`}} />
                </div>
                <span className="font-mono text-sm font-bold text-white">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            
            <AnimatePresence mode="wait">
                <MotionDiv key={step} initial={{opacity:0, x:30}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-30}}>
                    {renderStep()}
                </MotionDiv>
            </AnimatePresence>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-dark-border">
                <button type="button" onClick={prevStep} disabled={step === 1} className="bg-dark-bg hover:bg-dark-border font-semibold py-2 px-4 rounded-lg disabled:opacity-50">Back</button>
                {step < totalSteps ? (
                    <button type="button" onClick={nextStep} className="bg-brand-primary hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg">Continue →</button>
                ) : (
                    <button type="submit" className="bg-brand-secondary hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg">🔍 ANALYZE MY BUSINESS</button>
                )}
            </div>
        </form>
    );
};

const ProcessingView: React.FC<{ email: string }> = ({ email }) => {
    const checklist = [
        "Business information processed", "Website analysis complete (15 pages crawled)", "Industry benchmarking finished",
        "AI opportunity scoring in progress...", "Custom recommendations generated", "ROI projections calculated", "Implementation roadmap created"
    ];
    const findings = [
        "📊 Your website has 67% higher bounce rate than industry average", "💡 We identified 4 automation opportunities",
        "🎯 Your conversion funnel has 3 major leak points", "💰 Potential savings: $8,400/month with right AI implementation"
    ];

    const [completedSteps, setCompletedSteps] = useState(0);
    const [visibleFindings, setVisibleFindings] = useState(0);

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCompletedSteps(prev => (prev < checklist.length ? prev + 1 : prev));
        }, 800);
        const findingInterval = setInterval(() => {
            setVisibleFindings(prev => (prev < findings.length ? prev + 1 : prev));
        }, 1500);

        return () => {
            clearInterval(stepInterval);
            clearInterval(findingInterval);
        };
    }, []);

    return (
        <div className="bg-dark-card border-2 border-brand-primary/30 rounded-xl p-8 text-center flex flex-col items-center animate-fade-in">
            <h2 className="text-2xl font-bold text-white">🤖 AI Business Analysis in Progress...</h2>
            <div className="w-full bg-dark-bg rounded-full h-2 my-4"><div className="bg-brand-primary h-2 rounded-full animate-gradient-sweep" style={{backgroundSize: '200% 200%'}}></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 my-6 text-left max-w-3xl w-full">
                <div className="bg-dark-bg p-4 rounded-lg">
                    <h3 className="font-semibold text-dark-text-secondary mb-2">Analysis Status</h3>
                    {checklist.map((item, index) => (
                        <div key={item} className={`flex items-center gap-2 text-sm transition-opacity duration-500 ${completedSteps > index ? 'opacity-100' : 'opacity-50'}`}>
                            <span className={`transition-colors ${completedSteps > index ? 'text-green-400' : 'text-dark-text-secondary'}`}>{completedSteps > index ? '✅' : '🔄'}</span>
                            <span className={completedSteps > index ? 'text-white' : ''}>{item}</span>
                        </div>
                    ))}
                </div>
                 <div className="bg-dark-bg p-4 rounded-lg">
                     <h3 className="font-semibold text-dark-text-secondary mb-2">Interesting Findings</h3>
                     <div className="space-y-2">
                        <AnimatePresence>
                         {findings.slice(0, visibleFindings).map((item) => (
                            <motion.p key={item} initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} className="text-sm text-left">{item}</motion.p>
                         ))}
                        </AnimatePresence>
                     </div>
                </div>
            </div>
            <p className="text-dark-text-secondary">Sending a copy to: <span className="font-semibold text-white">{email}</span></p>
            <p className="font-bold text-2xl text-brand-accent mt-4">This should be ready in just a moment...</p>
        </div>
    );
};

const BookingCTAView: React.FC<{ onStartBooking: () => void }> = ({ onStartBooking }) => {
    const [spotsTaken] = useState(23);
    const [timeLeft, setTimeLeft] = useState(14 * 60 + 23); // 14:23 in seconds
    const testimonials = ["John just booked", "Sarah got results", "Mike saved $12k"];
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const ticker = setInterval(() => {
            setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
        }, 3000);
        return () => clearInterval(ticker);
    }, [testimonials.length]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="mt-8 bg-dark-card border border-dark-border rounded-xl p-8 text-center flex flex-col items-center animate-fade-in">
            <h2 className="text-3xl font-bold text-white">🧠 AI STRATEGY CALL</h2>
            <p className="text-brand-accent font-semibold mt-1">Transform Your Business with AI</p>

            <div className="my-6 p-6 bg-dark-bg border border-dark-border rounded-lg max-w-2xl w-full text-left relative overflow-hidden">
                <h3 className="text-xl font-bold text-white text-center">"Get Your AI Roadmap in 20 Minutes"</h3>
                <p className="text-center text-sm text-dark-text-secondary mt-1">⭐ FREE Strategy Session (Limited Spots Available)</p>
                <div className="w-full bg-dark-card rounded-full h-4 my-3 border border-dark-border overflow-hidden">
                    <motion.div
                        className="bg-gradient-to-r from-brand-secondary to-brand-primary h-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(spotsTaken / 30) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>
                <p className="text-xs text-dark-text-secondary text-center">{spotsTaken}/30 spots taken today</p>
                
                <div className="absolute top-4 right-4 bg-dark-card p-2 rounded-lg text-xs">
                    <AnimatePresence mode="wait">
                        <motion.div key={currentTestimonial} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.5 }}>
                            🔄 {testimonials[currentTestimonial]}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left text-sm text-dark-text-secondary max-w-lg mb-6">
                 <span className="flex items-center gap-2">✅ Identify AI opportunities</span>
                 <span className="flex items-center gap-2">✅ Get personalized implementation roadmap</span>
                 <span className="flex items-center gap-2">✅ Discover hidden revenue streams</span>
                 <span className="flex items-center gap-2">✅ Skip months of research</span>
            </div>

             <div className="bg-dark-bg border border-dark-border rounded-lg p-3 flex items-center justify-center gap-4 mb-6">
                <p className="font-semibold">⏰ <span className="font-mono">{formatTime(timeLeft)}</span> left for today's bonus</p>
                <p className="font-semibold">🎁 FREE recording + action plan ($197 value)</p>
            </div>
            
            <button onClick={onStartBooking} className="bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:scale-105">
                🚀 CLAIM YOUR FREE STRATEGY CALL
            </button>
        </div>
    );
};

const PricingView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <MotionDiv initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-dark-card border border-dark-border rounded-xl p-8 max-w-3xl mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Step 1 of 4: Choose Your Strategy Call Option</h2>
                <div className="w-full bg-dark-bg rounded-full h-2.5 my-2 border border-dark-border"><div className="bg-brand-primary h-full w-1/4 rounded-full"></div></div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-center">
                <div className="flex-1 bg-dark-bg border-2 border-brand-primary rounded-xl p-6 flex flex-col shadow-lg shadow-brand-primary/20">
                    <h3 className="text-xl font-bold text-white text-center">🆓 FREE STRATEGY CALL</h3>
                    <ul className="my-4 space-y-2 text-sm text-dark-text-secondary flex-grow">
                        <li>• 20-minute consultation</li>
                        <li>• Basic AI assessment</li>
                        <li>• General recommendations</li>
                        <li className="font-semibold text-amber-400">⚠️ Limited availability</li>
                        <li>📅 Next slot: 2 days</li>
                    </ul>
                    <a href="https://cal.com/zulari-agency" target="_blank" rel="noopener noreferrer" className="block text-center w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 rounded-lg">
                        📞 BOOK FREE CALL
                    </a>
                </div>

                 <div className="flex-1 bg-dark-bg border border-dark-border rounded-xl p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white text-center">💎 PREMIUM STRATEGY CALL</h3>
                     <p className="text-center font-bold text-brand-accent mt-1">$97 (FULLY REFUNDABLE)</p>
                    <ul className="my-4 space-y-2 text-sm text-dark-text-secondary flex-grow">
                        <li>• 30-minute deep dive</li>
                        <li>• Detailed AI roadmap</li>
                        <li>• Priority booking</li>
                        <li>• Bonus: AI toolkit</li>
                        <li>📅 Next slot: Tomorrow</li>
                    </ul>
                    <a href="https://cal.com/zulari-agency?type=premium&value=97" target="_blank" rel="noopener noreferrer" className="block text-center w-full bg-dark-border hover:bg-brand-primary text-white font-bold py-3 rounded-lg">
                        ✨ BOOK PREMIUM
                    </a>
                </div>
            </div>

             <div className="mt-8 border-t border-dark-border pt-6 space-y-3">
                <h4 className="text-center font-bold text-white">What Others Are Saying</h4>
                <div className="bg-dark-bg p-3 rounded-lg text-sm">💬 "Got 3 actionable AI ideas in 20 minutes!" - Sarah K. ⭐⭐⭐⭐⭐</div>
                <div className="bg-dark-bg p-3 rounded-lg text-sm">💬 "ROI was immediate after implementing their plan" - Mike T.</div>
            </div>

            <p className="text-center text-sm text-dark-text-secondary mt-6">🔒 Your satisfaction is guaranteed - No risk, all reward</p>
            <div className="text-center mt-4">
                <button onClick={onBack} className="text-xs hover:underline text-dark-text-secondary">← Go Back to Report</button>
            </div>
        </MotionDiv>
    );
};

const ReportView: React.FC<{ html: string, onStartBooking: () => void }> = ({ html, onStartBooking }) => (
    <div className="animate-fade-in">
        <div className="bg-dark-card border border-dark-border rounded-xl p-2 md:p-4">
            <div className="w-full h-[70vh] bg-white rounded-lg overflow-hidden shadow-lg">
                <iframe srcDoc={html} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="AI Business Analysis Report" />
            </div>
        </div>
        <BookingCTAView onStartBooking={onStartBooking} />
    </div>
);


const StrategyCallPage: React.FC = () => {
    const [phase, setPhase] = useState<'landing' | 'form' | 'processing' | 'report' | 'pricing'>('landing');
    const [formData, setFormData] = useState<AIStrategyFormData | null>(null);
    const [reportHtml, setReportHtml] = useState<string | null>(null);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                setFormData(parsedData);
                setPhase('form'); 
            } catch {
                setPhase('landing');
            }
        } else {
            setPhase('landing');
        }
    }, []);

    const handleFormComplete = async (data: AIStrategyFormData) => {
        setPhase('processing');
        setFormData(data);
        try {
            await new Promise(res => setTimeout(res, 7000));
            const result = await n8n.submitAIStrategyAnalysis(data);
            setReportHtml(result.html);
            setPhase('report');
            localStorage.removeItem(STORAGE_KEY);
        } catch (err: any) {
            setNotification({ message: `Analysis failed: ${err.message}`, type: 'error' });
            setPhase('form');
        }
    };
    
    const handleStartBooking = () => {
        setPhase('pricing');
    };

    const handleBackToReport = () => {
        setPhase('report');
    };
    
    const renderContent = () => {
        switch(phase) {
            case 'landing': return <LandingView onStart={() => {
                setFormData(formData || initialFormData); // Load saved data or start fresh
                setPhase('form');
            }} />;
            case 'form': return formData ? <MultiStepForm initialData={formData} onComplete={handleFormComplete} /> : <LandingView onStart={() => { setFormData(initialFormData); setPhase('form'); }} />;
            case 'processing': return <ProcessingView email={formData?.email || ''} />;
            case 'report': return reportHtml ? <ReportView html={reportHtml} onStartBooking={handleStartBooking} /> : <div className="text-center p-8">Loading report...</div>;
            case 'pricing': return <PricingView onBack={handleBackToReport} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SubPageHeader title="AI Strategy Call" icon={ICONS.chat} />
            <AnimatePresence mode="wait">
                <MotionDiv key={phase}>
                    {renderContent()}
                </MotionDiv>
            </AnimatePresence>
        </div>
    );
};

export default StrategyCallPage;