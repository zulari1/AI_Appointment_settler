

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead } from '../../types';
import * as n8n from '../../services/n8nService';
import { ICONS } from '../../constants';
import ActionNotification from '../../components/ActionNotification';
import InfoTooltip from '../../components/InfoTooltip';

const HowItWorksGuide: React.FC = () => {
    const steps = [
        { num: 1, title: "Universal Settings", desc: "Adjust the email style, tone, and frameworks for all leads at once." },
        { num: 2, title: "Pick a Schedule", desc: "Choose a date and time for the AI to automatically prepare the emails." },
        { num: 3, title: "AI Prepares Emails", desc: "At the scheduled time, the AI will generate a personalized sequence for every eligible lead." },
        { num: 4, title: "Ready for Outreach", desc: "Generated emails will appear in the Outreach tab, ready for you to send." },
    ];
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">How Agent 3 Works</h2>
            <p className="text-dark-text-secondary max-w-3xl mx-auto mb-6">
                This agent prepares email sequences automatically at your scheduled time. No need to write each email manually — set your rules below, and AI will personalize for every analyzed lead.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {steps.map(step => (
                    <div key={step.num} className="bg-dark-bg p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-brand-primary text-white text-xs font-bold flex-shrink-0">{step.num}</div>
                            <h3 className="font-semibold text-white">{step.title}</h3>
                        </div>
                        <p className="text-xs text-dark-text-secondary mt-2">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const UniversalPersonalizationForm: React.FC<{
    isScheduling: boolean,
    eligibleLeadsCount: number,
    onSchedule: (settings: any) => void,
}> = ({ isScheduling, eligibleLeadsCount, onSchedule }) => {
    
    const [formState, setFormState] = useState({
        tone: 'Professional',
        framework: 'AIDA',
        prepareAt: '',
        frequency: 'one-time',
        emailCount: 3,
        subjectStyle: 'Direct',
        dynamicTokens: true,
        additionalNotes: ''
    });

    const handleChange = (field: string, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSchedule(formState);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Email Style */}
                <div className="space-y-2 bg-dark-bg p-3 rounded-lg">
                    <h4 className="text-sm font-bold text-white">Email Style</h4>
                    <select value={formState.tone} onChange={e => handleChange('tone', e.target.value)} className="w-full bg-dark-border rounded p-2 text-xs">
                        <option>Professional</option><option>Casual</option><option>Persuasive</option><option>Friendly</option>
                    </select>
                    <select value={formState.framework} onChange={e => handleChange('framework', e.target.value)} className="w-full bg-dark-border rounded p-2 text-xs">
                        <option>AIDA</option><option>PAS</option><option>Direct</option><option>Storytelling</option>
                    </select>
                </div>
                {/* Scheduling */}
                <div className="space-y-2 bg-dark-bg p-3 rounded-lg">
                    <h4 className="text-sm font-bold text-white">Scheduling (Required)</h4>
                    <input type="datetime-local" value={formState.prepareAt} onChange={e => handleChange('prepareAt', e.target.value)} required className="w-full bg-dark-border rounded p-2 text-xs" />
                    <select value={formState.frequency} onChange={e => handleChange('frequency', e.target.value)} className="w-full bg-dark-border rounded p-2 text-xs">
                        <option value="one-time">One-time</option><option value="weekly">Weekly</option><option value="bi-weekly">Bi-weekly</option>
                    </select>
                </div>
                {/* Sequence Settings */}
                <div className="space-y-2 bg-dark-bg p-3 rounded-lg">
                    <h4 className="text-sm font-bold text-white">Sequence Settings</h4>
                    <select value={formState.emailCount} onChange={e => handleChange('emailCount', +e.target.value)} className="w-full bg-dark-border rounded p-2 text-xs">
                        <option value={1}>1 Email</option><option value={2}>2 Emails</option><option value={3}>3 Emails</option>
                    </select>
                    <select value={formState.subjectStyle} onChange={e => handleChange('subjectStyle', e.target.value)} className="w-full bg-dark-border rounded p-2 text-xs">
                        <option>Direct</option><option>Curiosity</option><option>Urgency</option><option>Benefit-driven</option>
                    </select>
                </div>
                {/* Additional Notes */}
                <div className="space-y-2 bg-dark-bg p-3 rounded-lg flex flex-col">
                    <h4 className="text-sm font-bold text-white">Additional Notes (Optional)</h4>
                    <textarea value={formState.additionalNotes} onChange={e => handleChange('additionalNotes', e.target.value)} rows={2} placeholder="e.g., 'Focus on sustainability...'" className="w-full flex-grow bg-dark-border rounded p-2 text-xs" />
                </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-dark-border">
                <button type="submit" disabled={isScheduling || eligibleLeadsCount === 0} className="bg-brand-secondary hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg disabled:bg-slate-600">
                    {isScheduling ? 'Scheduling...' : `Schedule Generation for ${eligibleLeadsCount} Leads`}
                </button>
            </div>
        </form>
    );
};interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  scheduled: boolean;
}


const LeadsTable: React.FC<LeadsTableProps> = ({ leads, isLoading, scheduled }) => {
    if (isLoading) return <div className="text-center p-8 text-dark-text-secondary">Loading leads...</div>;
    if (leads.length === 0) return <div className="text-center p-8 text-dark-text-secondary">No eligible leads found. Go to the Researcher to analyze more leads.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-xs text-dark-text-secondary uppercase bg-dark-bg">
                    <tr>
                        <th className="p-3 text-left">Lead Name</th>
                        <th className="p-3 text-center">Score</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Emails Prepared?</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                    {leads.map(lead => (
                        <tr key={lead.rowNumber}>
                            <td className="p-3 font-medium text-white">{lead.FullName}</td>
                            <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full bg-dark-bg text-xs">{lead.priorityScore}</span></td>
                            <td className="p-3 text-dark-text-secondary">Analyzed</td>
                            <td className="p-3 text-dark-text-secondary">
                                {scheduled ? '⏳ Waiting (scheduled)' : 'Ready for scheduling'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const PersonalizerPage: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduledJob, setScheduledJob] = useState<{ prepareAt: string; leadsCount: number } | null>(null);

    const eligibleLeads = useMemo(() => leads.filter(l => l.Analysed === 'YES' && !l['Email#1 Body']?.trim()), [leads]);

    const fetchLeadsData = useCallback(async () => {
        setLoading(true);
        try {
            const { leads } = await n8n.fetchLeads(1, 1000, 'All');
            setLeads(leads);
        } catch (e: any) {
            setNotification({ message: `Failed to load leads: ${e.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeadsData();
    }, [fetchLeadsData]);

    const handleSchedule = async (settings: any) => {
        if (!settings.prepareAt) {
            setNotification({ message: 'Please select a date and time to schedule the generation.', type: 'error' });
            return;
        }

        setIsScheduling(true);
        setNotification(null);
        try {
            const payload = {
                action: "schedule_universal_personalization",
                userEmail: "demo@zulari.app",
                options: {
                    tone: settings.tone,
                    framework: settings.framework,
                    emailCount: settings.emailCount,
                    subjectStyle: settings.subjectStyle,
                    dynamicTokens: settings.dynamicTokens,
                    additionalNotes: settings.additionalNotes,
                },
                schedule: {
                    prepareAt: new Date(settings.prepareAt).toISOString(),
                    frequency: settings.frequency,
                },
                sessionId: `s_${Date.now()}`
            };
            
            // This is a fire-and-forget action per the PRD.
            // The backend will process this at the scheduled time.
            await n8n.scheduleUniversalPersonalization(payload);

            setScheduledJob({ prepareAt: settings.prepareAt, leadsCount: eligibleLeads.length });
            setNotification({ message: `Successfully scheduled AI email generation for ${eligibleLeads.length} leads.`, type: 'success' });

        } catch (e: any) {
            setNotification({ message: e.message, type: 'error' });
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <HowItWorksGuide />
            
            <UniversalPersonalizationForm 
                isScheduling={isScheduling}
                eligibleLeadsCount={eligibleLeads.length}
                onSchedule={handleSchedule}
            />

            {scheduledJob && (
                <div className="bg-brand-secondary/20 border border-brand-secondary/50 rounded-xl p-4 text-center">
                    <p className="font-bold text-brand-secondary flex items-center justify-center gap-2">
                        {ICONS.calendar}
                        <span>
                            Next batch of {scheduledJob.leadsCount} personalized emails will be generated on: {new Date(scheduledJob.prepareAt).toLocaleString()}
                        </span>
                    </p>
                </div>
            )}
            
            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <h2 className="text-xl font-bold text-white mb-4">Eligible Leads ({eligibleLeads.length})</h2>
                <LeadsTable leads={eligibleLeads} isLoading={loading} scheduled={!!scheduledJob} />
            </div>
        </div>
    );
};

export default PersonalizerPage;