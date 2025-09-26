


import React, { useState, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ICONS } from '../../constants';
import * as n8n from '../../services/n8nService';
import { AiReadinessAuditRequest, PreviousAuditReport } from '../../types';
import SubPageHeader from '../../components/SubPageHeader';
import ActionNotification from '../../components/ActionNotification';
import AuditResultReport from '../microservices/audit/AuditResultReport';

interface AuditFormData {
    company: string;
    website: string;
    industry: string;
    companySize: string;
    businessModel: string;
    primaryChallenge: string;
    problemDescription: string;
    secondaryChallenges: string[];
    currentTools: string[];
    teamSizeInvolved: number;
    timeSpentWeekly: number;
    hoursSavedTarget?: number;
    revenueImpactTarget?: number;
    customerImpactTarget?: number;
    customKpiName: string;
    customKpiCurrent: string;
    customKpiTarget: string;
    consentToCrawl: boolean;
    aiUsage: string;
    aiComfortLevel: number;
}

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
            <iframe srcDoc={htmlContent} className="flex-1 w-full border-0 bg-white" sandbox="allow-scripts" title="Previous Report" />
        </motion.div>
    </motion.div>
);

const ReportCard: React.FC<{ report: PreviousAuditReport, onView: () => void }> = ({ report, onView }) => (
    <div className="bg-dark-bg border border-dark-border rounded-lg p-4 flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-center text-xs text-dark-text-secondary mb-2">
                <span className="font-semibold bg-dark-border px-2 py-0.5 rounded-full">📅 {new Date(report.date).toLocaleDateString()}</span>
                <span className="font-mono">{report.agentId}</span>
            </div>
            <p className="text-sm text-dark-text-secondary line-clamp-3">{report.summary}</p>
        </div>
        <button onClick={onView} className="mt-4 text-sm font-semibold text-brand-primary hover:text-brand-accent self-start">
            View Full Report →
        </button>
    </div>
);

const ProgressBar: React.FC<{ steps: string[], currentStep: number }> = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-dark-text-secondary">
            {steps.map((step, index) => {
                const stepIndex = index + 1;
                const isCompleted = currentStep > stepIndex;
                const isActive = currentStep === stepIndex;
                return (
                    <React.Fragment key={step}>
                        <div className="flex items-center gap-2 text-center flex-col sm:flex-row">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted ? 'bg-brand-primary border-brand-primary text-white' : isActive ? 'border-brand-primary text-brand-primary' : 'border-dark-border'}`}>
                                {isCompleted ? '✓' : stepIndex}
                            </div>
                            <span className={isActive ? 'text-white' : ''}>{step}</span>
                        </div>
                        {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-dark-border hidden sm:block"></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const StepWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="py-6"
    >
        {children}
    </motion.div>
);

const AIInsightCard: React.FC<{ title: string, text: string }> = ({ title, text }) => (
     <div className="bg-dark-bg border border-dark-border rounded-xl p-4 mt-6">
        <p className="font-semibold text-brand-accent flex items-center gap-2">💡 {title}</p>
        <p className="text-sm text-dark-text-secondary mt-1">{text}</p>
    </div>
);

const Step1_BusinessProfile: React.FC<{ data: AuditFormData, update: Function }> = ({ data, update }) => (
    <div className="space-y-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-center text-white">Step 1: Business Profile</h2>
        <input type="text" value={data.company} onChange={e => update('company', e.target.value)} required placeholder="Company Name" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
        <input type="url" value={data.website} onChange={e => update('website', e.target.value)} required placeholder="https://yourwebsite.com" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
        <select value={data.industry} onChange={e => update('industry', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3"><option>SaaS</option><option>E-commerce</option><option>Healthcare</option><option>Finance</option><option>Manufacturing</option><option>Education</option><option>Other</option></select>
        <select value={data.companySize} onChange={e => update('companySize', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3"><option>Solo</option><option>2-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option></select>
        <select value={data.businessModel} onChange={e => update('businessModel', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3"><option>B2B</option><option>B2C</option><option>Hybrid</option></select>
        <AIInsightCard title="Building Context" text="This information gives our AI a clear picture of your business, ensuring the audit is tailored to your specific industry and scale." />
    </div>
);

const Step2_Challenges: React.FC<{ data: AuditFormData, update: Function }> = ({ data, update }) => (
    <div className="space-y-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-center text-white">Step 2: Challenges & Pain Points</h2>
        <select value={data.primaryChallenge} onChange={e => update('primaryChallenge', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3">
            <option>Lead Generation</option><option>Customer Support</option><option>Process Inefficiency</option><option>Data Analysis</option><option>Content Creation</option>
        </select>
        <textarea value={data.problemDescription} onChange={e => update('problemDescription', e.target.value)} required rows={4} placeholder="Describe the problem in your own words..." className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
        <AIInsightCard title="Capturing the 'Why'" text="Defining the core problem helps us focus the AI analysis on solutions that deliver the most impactful results for your team." />
    </div>
);

const Step3_CurrentSetup: React.FC<{ data: AuditFormData, update: Function }> = ({ data, update }) => (
    <div className="space-y-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-center text-white">Step 3: Current Setup & Resources</h2>
        <input type="text" value={data.currentTools.join(', ')} onChange={e => update('currentTools', e.target.value.split(',').map(t => t.trim()))} placeholder="Current Tools (e.g., Slack, HubSpot)" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
        <div><label className="text-sm text-dark-text-secondary mb-1 block">Team Size Involved: {data.teamSizeInvolved}</label><input type="range" min="1" max="50" value={data.teamSizeInvolved} onChange={e => update('teamSizeInvolved', +e.target.value)} className="w-full" /></div>
        <div><label className="text-sm text-dark-text-secondary mb-1 block">Time Spent per Week (hours): {data.timeSpentWeekly}</label><input type="range" min="1" max="100" value={data.timeSpentWeekly} onChange={e => update('timeSpentWeekly', +e.target.value)} className="w-full" /></div>
        <AIInsightCard title="Mapping Resources" text="Understanding your tech stack and resource investment helps our AI identify low-hanging fruit for automation and suggest realistic solutions." />
    </div>
);

const Step4_SuccessMetrics: React.FC<{ data: AuditFormData, update: Function }> = ({ data, update }) => (
    <div className="space-y-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-center text-white">Step 4: Defining Success</h2>
        <input type="number" value={data.hoursSavedTarget || ''} onChange={e => update('hoursSavedTarget', +e.target.value)} placeholder="Target Hours Saved per Week" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
        <input type="number" value={data.revenueImpactTarget || ''} onChange={e => update('revenueImpactTarget', +e.target.value)} placeholder="Expected Revenue/Savings per Month ($)" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
        <input type="text" value={data.customKpiName} onChange={e => update('customKpiName', e.target.value)} placeholder="Custom KPI Name (e.g., Error Rate)" className="w-full bg-dark-bg border border-dark-border rounded-lg p-3" />
        <AIInsightCard title="Clear KPIs = Measurable Outcomes" text="Even a best guess helps us generate a solution with tangible results. We'll refine these goals together." />
    </div>
);

const Step5_Readiness: React.FC<{ data: AuditFormData, update: Function }> = ({ data, update }) => (
    <div className="space-y-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-center text-white">Step 5: AI Readiness & Consent</h2>
        <label className="flex items-start gap-3 p-3 bg-dark-bg rounded-lg cursor-pointer"><input type="checkbox" checked={data.consentToCrawl} onChange={e => update('consentToCrawl', e.target.checked)} required className="mt-1 h-4 w-4" /><div><span className="font-semibold text-white">I consent to automated analysis</span><p className="text-xs text-dark-text-secondary">This allows our AI to crawl your public website for data. Private credentials will never be requested.</p></div></label>
        <div><label className="text-sm text-dark-text-secondary mb-1 block">Do you already use AI in your business?</label><select value={data.aiUsage} onChange={e => update('aiUsage', e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-3"><option>Yes</option><option>No</option><option>Exploring</option></select></div>
        <div><label className="text-sm text-dark-text-secondary mb-1 block">What’s your AI comfort level? (1=Nervous, 5=Expert)</label><div className="flex justify-between">{[1,2,3,4,5].map(n=><button type="button" key={n} onClick={()=>update('aiComfortLevel',n)} className={`w-10 h-10 rounded-full ${data.aiComfortLevel===n ? 'bg-brand-primary text-white' : 'bg-dark-bg'}`}>{n}</button>)}</div></div>
        <AIInsightCard title="Building Trust & Security" text="Your consent is crucial. We prioritize your privacy and security throughout the analysis process." />
    </div>
);

const ProcessingState: React.FC = () => (
    <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-2">🤖 AI is building your business analysis...</h2>
        <div className="flex justify-center items-baseline text-6xl text-white font-mono mt-4">
            <span className="animate-pulse" style={{ animationDuration: '1.4s' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}>.</span>
        </div>
        <p className="text-dark-text-secondary mt-4">This may take a moment. Please wait.</p>
    </div>
);

const AiReadinessAuditPage: React.FC = () => {
    const user = { email: 'demo@zulari.app' };
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<AuditFormData>({
        company: '', website: '', industry: 'SaaS', companySize: '11-50', businessModel: 'B2B',
        primaryChallenge: 'Lead Generation', problemDescription: '', secondaryChallenges: [],
        currentTools: [], teamSizeInvolved: 5, timeSpentWeekly: 10,
        customKpiName: '', customKpiCurrent: '', customKpiTarget: '',
        consentToCrawl: false, aiUsage: 'Exploring', aiComfortLevel: 3,
    });
    const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
    const [resultData, setResultData] = useState<string | null>(null);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const [previousReports, setPreviousReports] = useState<PreviousAuditReport[]>([]);
    const [isLoadingPrevious, setIsLoadingPrevious] = useState(true);
    const [selectedReportHtml, setSelectedReportHtml] = useState<string | null>(null);

    useEffect(() => {
        const loadPrevious = async () => {
            setIsLoadingPrevious(true);
            try {
                const reports = await n8n.fetchPreviousAudits(user.email);
                setPreviousReports(reports);
            } catch (err) {
                console.error(err);
                setNotification({ message: 'Could not load previous reports.', type: 'error'});
            } finally {
                setIsLoadingPrevious(false);
            }
        };
        loadPrevious();
    }, [user.email]);

    const updateData = (field: keyof AuditFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const steps = ["Business Profile", "Challenges", "Current Setup", "Success Metrics", "Readiness"];

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    
    const handleSubmit = async () => {
        setStatus('processing');
        try {
            const payload: AiReadinessAuditRequest = {
                email: user.email,
                company: formData.company,
                website: formData.website,
                industry: formData.industry,
                companySize: formData.companySize,
                businessModel: formData.businessModel,
                primaryChallenge: formData.primaryChallenge,
                problemDescription: formData.problemDescription,
                secondaryChallenges: formData.secondaryChallenges,
                currentTools: formData.currentTools,
                teamSizeInvolved: formData.teamSizeInvolved,
                timeSpentWeekly: formData.timeSpentWeekly,
                metrics: {
                    hoursSavedTarget: formData.hoursSavedTarget,
                    revenueImpactTarget: formData.revenueImpactTarget,
                    customerImpactTarget: formData.customerImpactTarget,
                    customKpi: { name: formData.customKpiName, current: formData.customKpiCurrent, target: formData.customKpiTarget }
                },
                consentToCrawl: formData.consentToCrawl,
                aiUsage: formData.aiUsage,
                aiComfortLevel: formData.aiComfortLevel
            };
            const resultHtml = await n8n.startAiReadinessAudit(payload);
            setResultData(resultHtml);
            setStatus('completed');
        } catch(err: any) {
            setNotification({ message: err.message || 'Audit failed', type: 'error'});
            setStatus('failed');
        }
    };

    const handleReset = () => {
        setStatus('idle');
        setCurrentStep(1);
        setFormData({
            company: '', website: '', industry: 'SaaS', companySize: '11-50', businessModel: 'B2B',
            primaryChallenge: 'Lead Generation', problemDescription: '', secondaryChallenges: [],
            currentTools: [], teamSizeInvolved: 5, timeSpentWeekly: 10,
            customKpiName: '', customKpiCurrent: '', customKpiTarget: '',
            consentToCrawl: false, aiUsage: 'Exploring', aiComfortLevel: 3,
        });
        setResultData(null);
    }

    const renderWizard = () => (
         <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8">
            <ProgressBar steps={steps} currentStep={currentStep} />
            <AnimatePresence mode="wait">
                <StepWrapper key={currentStep}>
                    {currentStep === 1 && <Step1_BusinessProfile data={formData} update={updateData} />}
                    {currentStep === 2 && <Step2_Challenges data={formData} update={updateData} />}
                    {currentStep === 3 && <Step3_CurrentSetup data={formData} update={updateData} />}
                    {currentStep === 4 && <Step4_SuccessMetrics data={formData} update={updateData} />}
                    {currentStep === 5 && <Step5_Readiness data={formData} update={updateData} />}
                </StepWrapper>
            </AnimatePresence>
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-dark-border">
                <button onClick={handleBack} disabled={currentStep === 1} className="bg-dark-bg hover:bg-dark-border text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">Back</button>
                {currentStep < steps.length ? (
                    <button onClick={handleNext} className="bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg">Next →</button>
                ) : (
                    <button onClick={handleSubmit} disabled={!formData.consentToCrawl} className="bg-brand-secondary hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">🚀 Generate Audit</button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SubPageHeader title="AI Readiness Audit" icon={ICONS.dna} />
            
            {status === 'processing' && (
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8">
                    <ProcessingState />
                </div>
            )}
            {status === 'failed' && (
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8 text-center">
                    <p className="text-red-400">Audit failed. Please try again.</p>
                    <button onClick={handleSubmit} className="mt-4 bg-brand-primary p-2 rounded text-white font-semibold">Retry</button>
                </div>
            )}
            {status === 'idle' && renderWizard()}

            {status === 'completed' && resultData && (
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">📊 Business Analyzer — Current Report</h2>
                    <AuditResultReport htmlContent={resultData} onReset={handleReset} />
                </div>
            )}

            <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white mb-4">📜 Previous Reports</h2>
                {isLoadingPrevious ? (
                    <div className="text-center py-8 text-dark-text-secondary">Loading history...</div>
                ) : previousReports.length === 0 ? (
                    <div className="text-center py-8 text-dark-text-secondary">No previous reports found.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {previousReports.map((report) => (
                            <ReportCard 
                                key={report.timestamp} 
                                report={report} 
                                onView={() => setSelectedReportHtml(report.htmlOutput)}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            <AnimatePresence>
                {selectedReportHtml && (
                    <ReportModal 
                        htmlContent={selectedReportHtml} 
                        onClose={() => setSelectedReportHtml(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AiReadinessAuditPage;