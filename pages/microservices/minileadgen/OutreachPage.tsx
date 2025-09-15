
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import * as n8n from '../../../services/n8nService';
import { Lead } from '../../../types';
import ActionNotification from '../../../components/ActionNotification';
import { ICONS } from '../../../constants';

const HowItWorksHeader: React.FC = () => {
    const steps = [
        { icon: ICONS.email, title: "Load Emails", desc: "Personalized emails are automatically loaded." },
        { icon: ICONS.calendar, title: "Choose Schedule", desc: "Set your campaign rules and start date." },
        { icon: ICONS.rocket, title: "Start Campaign", desc: "AI sends emails on autopilot based on your settings." },
        { icon: ICONS.stats, title: "Track Progress", desc: "Monitor sends, replies, and more in real-time." }
    ];
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">How Outreach Works</h2>
            <p className="text-dark-text-secondary max-w-3xl mx-auto mb-6">
                Outreach automates your campaign. Once your emails are prepared in Personalizer, this agent schedules and sends them based on your settings. You don’t need to send each one manually — simply set the rules below, and AI takes care of the rest.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {steps.map(step => (
                    <div key={step.title} className="bg-dark-bg p-4 rounded-lg flex items-start gap-3">
                        <span className="text-brand-accent mt-1">{React.cloneElement(step.icon, { className: 'w-5 h-5' })}</span>
                        <div>
                            <h3 className="font-semibold text-white">{step.title}</h3>
                            <p className="text-xs text-dark-text-secondary mt-1">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};interface CampaignSettingsFormProps {
  settings: any;
  setSettings: Function;
  validationErrors: string[];
}


const CampaignSettingsForm: React.FC<CampaignSettingsFormProps> = 
({ settings, setSettings, validationErrors }) => {
    const handleWeekdaysChange = (dayIndex: number) => {
        const newWeekdays = settings.weekdays.includes(dayIndex)
            ? settings.weekdays.filter((d: number) => d !== dayIndex)
            : [...settings.weekdays, dayIndex];
        setSettings({ ...settings, weekdays: newWeekdays.sort() });
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Universal Campaign Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {/* Campaign Basics */}
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-dark-text-secondary border-b border-dark-border pb-1">Basics</h4>
                    <div><label className="text-xs">Sender Email(s)</label><input type="text" value={settings.senderEmails.join(', ')} onChange={e => setSettings({...settings, senderEmails: e.target.value.split(',').map(s=>s.trim())})} className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm" /></div>
                    <div><label className="text-xs">Time Zone</label><select value={settings.timeZone} onChange={e => setSettings({...settings, timeZone: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm"><option>Europe/Berlin</option><option>America/New_York</option><option>America/Los_Angeles</option></select></div>
                    <div><label className="text-xs">Campaign Start Date & Time</label><input type="datetime-local" value={settings.startAt} onChange={e => setSettings({...settings, startAt: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm" /></div>
                </div>
                {/* Send Rules */}
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-dark-text-secondary border-b border-dark-border pb-1">Send Rules</h4>
                    <div><label className="text-xs">Send Gap Between Emails (Days)</label><input type="number" min="1" value={settings.sendGap} onChange={e => setSettings({...settings, sendGap: +e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm" /></div>
                    <div><label className="text-xs">Max Emails Per Day</label><input type="number" min="1" value={settings.dailyCap} onChange={e => setSettings({...settings, dailyCap: +e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm" /></div>
                    <div><label className="text-xs">Days of Week to Send</label><div className="flex gap-1 mt-1">{['S','M','T','W','T','F','S'].map((d,i) => <button key={i} onClick={() => handleWeekdaysChange(i)} className={`w-8 h-8 rounded text-xs ${settings.weekdays.includes(i) ? 'bg-brand-primary' : 'bg-dark-bg border border-dark-border'}`}>{d}</button>)}</div></div>
                </div>
                {/* Safety Controls */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-dark-text-secondary border-b border-dark-border pb-1">Safety Controls</h4>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.warmUp} onChange={e => setSettings({...settings, warmUp: e.target.checked})} /> Warm-Up Mode</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.replyDetection} onChange={e => setSettings({...settings, replyDetection: e.target.checked})} /> Reply Detection</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.stopOnOptOut} onChange={e => setSettings({...settings, stopOnOptOut: e.target.checked})} /> Stop on Opt-Out</label>
                    <div className="text-xs p-2 bg-dark-bg rounded">Fallback: Skip lead if missing email body</div>
                </div>
            </div>
            {validationErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm space-y-1">
                    {validationErrors.map((err, i) => <p key={i}>⚠️ {err}</p>)}
                </div>
            )}
        </div>
    );
};interface CampaignCalendarPreviewProps {
  leadsCount: number;
  settings: any;
}


const CampaignCalendarPreview: React.FC<CampaignCalendarPreviewProps> = ({ leadsCount, settings }) => {
    if (leadsCount === 0 || !settings.startAt) return null;

    const startDate = new Date(settings.startAt);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(settings.startAt);
        date.setDate(date.getDate() + i);
        return date;
    });
    
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-2">Campaign Calendar</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {days.map((day, i) => {
                    const isSendDay = settings.weekdays.includes(day.getDay());
                    const sendsToday = isSendDay ? Math.min(settings.dailyCap, leadsCount) : 0; // Simple approximation
                    return (
                        <div key={i} className={`p-2 rounded ${isSendDay ? 'bg-brand-primary/20' : 'bg-dark-bg'}`}>
                            <p className="font-bold">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <p className="text-dark-text-secondary">{day.getDate()}</p>
                            {isSendDay && <p className="text-xs mt-1 text-brand-primary font-bold">{sendsToday}s</p>}
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-dark-text-secondary text-center mt-2">Campaign will end on {endDate.toLocaleDateString()}</p>
        </div>
    );
};

const LeadsForCampaignTable: React.FC<{ leads: Lead[], selectedLeads: Set<number>, onSelectLead: Function }> = ({ leads, selectedLeads, onSelectLead }) => {
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
             <h3 className="text-lg font-bold text-white mb-2">Select Leads for Campaign ({selectedLeads.size} / {leads.length})</h3>
             <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                    <thead><tr><th className="p-2 text-left">Lead</th><th className="p-2 text-left">Company</th><th className="p-2 text-center">Emails Ready</th></tr></thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr key={lead.rowNumber} className="hover:bg-dark-bg/50">
                                <td className="p-2 flex items-center gap-2"><input type="checkbox" checked={selectedLeads.has(lead.rowNumber!)} onChange={e => onSelectLead(lead.rowNumber!, e.target.checked)} /> {lead.FullName}</td>
                                <td className="p-2 text-dark-text-secondary">{lead['Company Name']}</td>
                                <td className="p-2 text-center">{lead.emailsCraftedCount > 0 ? `✅ ${lead.emailsCraftedCount}` : '❌'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};interface AnalyticsDashboardProps {
  analytics: any;
  campaignId: string;
}


const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics, campaignId }) => {
    if (!analytics) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 animate-fade-in text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-white mb-2">Campaign In Progress</h2>
                <p className="text-dark-text-secondary">Waiting for first analytics update... (Campaign ID: {campaignId})</p>
            </div>
        );
    }

    const { summary, leads } = analytics;

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 animate-fade-in space-y-6">
             <h2 className="text-2xl font-bold text-white">Campaign Progress</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">{summary.sent || 0} / {summary.total || 0}</p><p className="text-xs text-dark-text-secondary">📤 Emails Sent</p></div>
                <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">{summary.replies || 0}</p><p className="text-xs text-dark-text-secondary">📬 Replies</p></div>
                <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">{summary.optOuts || 0}</p><p className="text-xs text-dark-text-secondary">❌ Opt-Outs</p></div>
                <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">{summary.deliverability || 100}%</p><p className="text-xs text-dark-text-secondary">✅ Deliverability</p></div>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-dark-text-secondary uppercase bg-dark-bg"><tr>
                        <th className="p-2 text-left">Lead</th><th>Email #1</th><th>Email #2</th><th>Email #3</th><th>Replied</th><th>Opted Out</th>
                    </tr></thead>
                    <tbody className="divide-y divide-dark-border">
                        {leads.map((lead: any) => (
                            <tr key={lead.rowNumber}>
                                <td className="p-2 font-medium">{lead.name}</td>
                                <td className="p-2 text-center">{lead.e1_sent ? '✅' : '❌'}</td>
                                <td className="p-2 text-center">{lead.e2_sent ? '✅' : '❌'}</td>
                                <td className="p-2 text-center">{lead.e3_sent ? '✅' : '❌'}</td>
                                <td className="p-2 text-center">{lead.replied ? '✅' : '❌'}</td>
                                <td className="p-2 text-center">{lead.opted_out ? '✅' : '❌'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const OutreachPage: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
    
    const [campaignStatus, setCampaignStatus] = useState<'idle' | 'running' | 'completed'>('idle');
    const [campaignId, setCampaignId] = useState<string|null>(null);
    const [campaignAnalytics, setCampaignAnalytics] = useState<any>(null);
    const pollingRef = useRef<number | null>(null);
    
    const [campaignSettings, setCampaignSettings] = useState({
        senderEmails: ["demo@zulari.app"], timeZone: "Europe/Berlin", dailyCap: 50, sendGap: 2,
        weekdays: [1,2,3,4,5], startAt: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
        warmUp: true, replyDetection: true, stopOnOptOut: true,
    });

     const fetchLeadsData = useCallback(async () => {
        setLoading(true);
        try {
            const { leads } = await n8n.fetchLeads(1, 200, 'All');
            const personalizedLeads = leads.filter(l => l.emailsCraftedCount > 0);
            setLeads(personalizedLeads);
            setSelectedLeads(new Set(personalizedLeads.map(l => l.rowNumber).filter((r): r is number => r !== undefined)));
        } catch (e: any) {
            setNotification({ message: `Failed to load leads: ${e.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (campaignStatus === 'idle') fetchLeadsData();
    }, [campaignStatus, fetchLeadsData]);

    const pollStatus = useCallback(async (id: string) => {
        try {
            const data = await n8n.getOutreachStatus(id);
            setCampaignAnalytics(data); // Assuming the response shape matches
            if(data.summary.status === 'completed') {
                setCampaignStatus('completed');
                if (pollingRef.current) clearInterval(pollingRef.current);
            }
        } catch(e) { console.error("Polling failed", e); }
    }, []);

    useEffect(() => {
        if (campaignStatus === 'running' && campaignId) {
            pollingRef.current = window.setInterval(() => pollStatus(campaignId), 5000);
        }
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); }
    }, [campaignStatus, campaignId, pollStatus]);

    const validationErrors = useMemo(() => {
        const errors = [];
        if (!campaignSettings.startAt) errors.push("Campaign start date and time is required.");
        if (campaignSettings.senderEmails.length === 0 || !campaignSettings.senderEmails[0]) errors.push("At least one sender email is required.");
        if (selectedLeads.size === 0) errors.push("No leads selected for this campaign.");
        const totalSendsPossible = 7 * campaignSettings.dailyCap;
        if (selectedLeads.size > totalSendsPossible) {
            errors.push(`Daily cap is too low. With ${campaignSettings.dailyCap}/day, you can only send to ${totalSendsPossible} leads in 7 days.`);
        }
        return errors;
    }, [campaignSettings, selectedLeads]);
    
    const handleStartCampaign = async () => {
        const leadsForCampaign = leads.filter(l => l.rowNumber && selectedLeads.has(l.rowNumber));
        const missingEmail = leadsForCampaign.some(l => !l['Email#1 Body']?.trim());
        if(missingEmail) {
            setNotification({ message: 'All selected leads must have at least one prepared email.', type: 'error' });
            return;
        }
        if (validationErrors.length > 0) {
             setNotification({ message: validationErrors.join(' '), type: 'error' });
             return;
        }
        setIsScheduling(true);
        try {
            const newCampaignId = `camp_${Date.now()}`;
            const payload = {
                action: "schedule", userEmail: "demo@zulari.app", campaignId: newCampaignId,
                sendRules: { ...campaignSettings, startAt: new Date(campaignSettings.startAt).toISOString(), cadence: `every_${campaignSettings.sendGap}_day` },
                leads: leadsForCampaign.map(l => ({ rowNumber: l.rowNumber, email: l.email, timeZone: l['Time Zone'] }))
            };
            const res = await n8n.scheduleOutreach(payload);
            setNotification({ message: `Campaign scheduled for ${res.scheduled} leads!`, type: 'success' });
            setCampaignId(res.campaignId || newCampaignId);
            setCampaignStatus('running');
        } catch(e: any) {
            setNotification({ message: e.message, type: 'error' });
        } finally {
            setIsScheduling(false);
        }
    }
    
    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <HowItWorksHeader />
            
            {campaignStatus === 'idle' ? (
                <div className="space-y-6">
                    <CampaignSettingsForm settings={campaignSettings} setSettings={setCampaignSettings} validationErrors={validationErrors}/>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LeadsForCampaignTable leads={leads} selectedLeads={selectedLeads} onSelectLead={(rowNum: number, checked: boolean) => {
                            setSelectedLeads(prev => {
                                const newSet = new Set(prev);
                                if (checked) newSet.add(rowNum); else newSet.delete(rowNum);
                                return newSet;
                            });
                        }} />
                        <div className="space-y-4">
                            <CampaignCalendarPreview leadsCount={selectedLeads.size} settings={campaignSettings} />
                             <button onClick={handleStartCampaign} disabled={isScheduling || validationErrors.length > 0} className="w-full bg-brand-secondary hover:bg-emerald-500 text-white font-bold py-4 px-4 rounded-lg disabled:bg-slate-600 flex items-center justify-center gap-2 text-lg">
                                {ICONS.rocket} {isScheduling ? 'Scheduling...' : `Start Campaign (${selectedLeads.size} Leads)`}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <AnalyticsDashboard analytics={campaignAnalytics} campaignId={campaignId!} />
            )}
        </div>
    );
};

export default OutreachPage;