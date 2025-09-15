

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as n8n from '../../services/n8nService';
import { Lead, RawLead } from '../../types';
import ActionNotification from '../../components/ActionNotification';
import LeadCard from '../../components/LeadCard';
import ResearchSlideOver from '../../components/ResearchSlideOver';
import DOMPurify from 'dompurify';
import AgentChat from '../../components/AgentChat';
import { ICONS } from '../../constants';
import InfoTooltip from '../../components/InfoTooltip';

const PageHeader: React.FC = () => {interface PipelineStepProps {
  name: string;
  active?: boolean;
}


const PipelineStep: React.FC<PipelineStepProps> = ({ name, active }) => (
        <div className={`flex-1 text-center py-2 px-1 border-b-2 ${active ? 'border-brand-primary text-white' : 'border-dark-border text-dark-text-secondary'}`}>
            <span className="font-semibold text-sm">{name}</span>
        </div>
    );
    const Connector: React.FC = () => <div className="text-dark-text-secondary self-center -mb-1.5 z-10 bg-dark-bg px-1">&rarr;</div>;

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                <span>🕵️</span> Agent 1: Lead Hunter
            </h1>
            <p className="text-dark-text-secondary mt-2 max-w-3xl mx-auto">
                The system’s starting point. Tell me who you want to find, and I’ll scrape LinkedIn & the web for fresh leads. These leads flow into the rest of the AI pipeline.
            </p>
            <p className="text-xs text-brand-accent font-semibold mt-2">
                ⚡ Pro Tip: The better you describe your leads, the stronger your downstream campaigns will be.
            </p>
            <div className="mt-4 bg-dark-bg p-2 rounded-lg flex items-stretch max-w-2xl mx-auto">
                <PipelineStep name="Hunter (Scrape)" active />
                <Connector />
                <PipelineStep name="Research (Enrich)" />
                <Connector />
                <PipelineStep name="Personalize (Emails)" />
                <Connector />
                <PipelineStep name="Outreach (Send)" />
            </div>
        </div>
    );
};

const LeadJoeChat: React.FC<{ onStartHunt: (prompt: string) => void, isHunting: boolean }> = ({ onStartHunt, isHunting }) => {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user' | 'system', text: string }[]>([
        { role: 'ai', text: "Hi, I’m Lead Joe 👋. Who are you looking for today? You can tell me job titles, industries, or locations." }
    ]);
    const [input, setInput] = useState('');

    const examples = [
        "Find 20 Marketing Directors in San Francisco tech startups.",
        "Find 100 HR Managers in London finance companies.",
        "Find 30 cafe owners in Berlin with LinkedIn profiles."
    ];

    const handleSend = () => {
        if (!input.trim() || isHunting) return;
        setMessages(prev => [...prev, { role: 'user', text: input }]);
        onStartHunt(input);
        setInput('');
    };

    useEffect(() => {
        if (isHunting) {
            setMessages(prev => [...prev, { role: 'system', text: "Analyzing your request & searching..." }]);
        }
    }, [isHunting]);

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-3xl mx-auto">
            <div className="space-y-3">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'ai' && <span className="text-xl">🤖</span>}
                        <div className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-dark-bg'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-dark-border">
                <div className="flex items-center gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Describe the leads you want to find..."
                        className="flex-1 bg-dark-bg border border-dark-border rounded-lg p-3 text-sm"
                        disabled={isHunting}
                    />
                    <button onClick={handleSend} disabled={isHunting || !input.trim()} className="h-12 w-12 flex items-center justify-center bg-brand-primary text-white rounded-lg disabled:bg-slate-600">
                        {isHunting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : ICONS.paperPlane}
                    </button>
                </div>
                <div className="text-xs text-dark-text-secondary mt-2 flex flex-wrap gap-x-2 gap-y-1">
                    <span>Examples:</span>
                    {examples.map(ex => (
                        <button key={ex} onClick={() => setInput(ex)} className="hover:text-white underline">{ex}</button>
                    ))}
                </div>
            </div>
        </div>
    );
};interface AnalyticsSectionProps {
  stats: any;
}


const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ stats }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Your Lead Hunt Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">{stats.total}</p><p className="text-xs text-dark-text-secondary">Total Leads Scraped</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">{stats.newToday}</p><p className="text-xs text-dark-text-secondary">New Leads Today</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">{stats.avgScore}</p><p className="text-xs text-dark-text-secondary">Avg. Score</p></div>
            <div className="bg-dark-bg p-3 rounded-lg"><p className="text-2xl font-bold text-white">{stats.freshnessPercent}%</p><p className="text-xs text-dark-text-secondary">Freshness (&lt;7 days)</p></div>
        </div>
    </div>
);

const HunterPage: React.FC = () => {
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isHunting, setIsHunting] = useState(false);
    const [researchingId, setResearchingId] = useState<number | null>(null);
    const [slideOver, setSlideOver] = useState<{ open: boolean; reportHtml: string; lead: Lead | null }>({ open: false, reportHtml: '', lead: null });
    const [chatState, setChatState] = useState<{ open: boolean, lead: Lead | null }>({ open: false, lead: null });

    // Filtering & Sorting State
    const [activeFilter, setActiveFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Date Added');

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const { leads } = await n8n.fetchLeads(1, 1000, 'All');
            setAllLeads(leads);
        } catch (e: any) {
            setNotification({ message: `Failed to load leads: ${e.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleStartHunt = async (prompt: string) => {
        setIsHunting(true);
        setNotification(null);
        try {
            const payload = { "action": "scrape", "prompt": prompt, "userEmail": "demo@zulari.app" };
            const response: any = await n8n.startHunt(payload);

            if (Array.isArray(response) && response[0]?.output?.includes("I'm Lead Generation Joe")) {
                // This is just a conversational response, not a lead list
                 setNotification({ message: response[0].output, type: 'success' });
            } else if (response.status === 'ok' && response.leads) {
                const newLeads: RawLead[] = response.leads;
                await n8n.appendMany({ userEmail: 'demo@zulari.app', runId: response.runId, leads: newLeads });
                setNotification({ message: `Hunt complete! Found ${newLeads.length} new leads.`, type: 'success' });
                fetchLeads();
            } else {
                 throw new Error(response.message || 'Hunt failed to return valid leads.');
            }
        } catch (err: any) {
            setNotification({ message: err.message, type: 'error' });
        } finally {
            setIsHunting(false);
        }
    };

    const handleResearch = async (lead: Lead) => {
        if (!lead.rowNumber) return;
        setResearchingId(lead.rowNumber);
        setNotification({ message: `Researching ${lead.FullName}...`, type: 'success' });
        try {
            const res = await n8n.researchLead({ lead: { fullName: lead.FullName, email: lead['Email Address'], linkedin: lead['LinkedIn URL'] } });
            await n8n.updateLeadRowStatus(lead.rowNumber, { 'Analysed': 'YES', 'Research Report': res.researchReportHtml });
            setNotification({ message: `Research complete for ${lead.FullName}.`, type: 'success' });
            fetchLeads();
        } catch (e: any) {
            setNotification({ message: `Research failed: ${e.message}`, type: 'error' });
        } finally {
            setResearchingId(null);
        }
    };

    const handleChat = (lead: Lead) => setChatState({ open: true, lead: lead });

    const analyticsStats = useMemo(() => {
        const total = allLeads.length;
        if (total === 0) return { total: 0, newToday: 0, avgScore: 0, freshnessPercent: 0 };
        const today = new Date().toISOString().slice(0, 10);
        const newToday = allLeads.filter(l => l.Date?.startsWith(today)).length;
        const avgScore = Math.round(allLeads.reduce((acc, l) => acc + l.priorityScore, 0) / total);
        const freshCount = allLeads.filter(l => l.freshnessDays <= 7).length;
        const freshnessPercent = Math.round((freshCount / total) * 100);
        return { total, newToday, avgScore, freshnessPercent };
    }, [allLeads]);

    const filteredAndSortedLeads = useMemo(() => {
        const filtered = allLeads.filter(l => {
            if (activeFilter === 'New Today') return l.freshnessDays <= 1;
            if (activeFilter === 'High Score (80+)') return l.priorityScore >= 80;
            // Previously Scraped might need a different flag, for now, just show all
            return true;
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'Score') return b.priorityScore - a.priorityScore;
            if (sortBy === 'Company') return (a['Company Name'] || '').localeCompare(b['Company Name'] || '');
            if (sortBy === 'Freshness') return a.freshnessDays - b.freshnessDays;
            return (new Date(b.Date || 0).getTime()) - (new Date(a.Date || 0).getTime()); // Date Added
        });
    }, [allLeads, activeFilter, sortBy]);


    return (
        <div className="space-y-8">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <PageHeader />
            <LeadJoeChat onStartHunt={handleStartHunt} isHunting={isHunting} />
            
            <p className="text-center font-semibold text-white mt-8">“Strong leads here = powerful personalization later. Every lead you scrape flows through your AI pipeline automatically.”</p>
            
            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                    <div className="flex items-center gap-1 bg-dark-bg p-1 rounded-lg">
                        {['All', 'New Today', 'High Score (80+)'].map(f => (
                            <button key={f} onClick={() => setActiveFilter(f)} className={`px-2 py-1 text-xs rounded-md ${activeFilter === f ? 'bg-brand-primary text-white' : 'hover:bg-dark-border'}`}>{f}</button>
                        ))}
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                        <label>Sort by:</label>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-dark-bg border border-dark-border rounded p-1 text-xs">
                           <option>Date Added</option><option>Score</option><option>Freshness</option><option>Company</option>
                        </select>
                    </div>
                </div>

                 {loading && <div className="text-center p-8">Loading...</div>}
                 {!loading && filteredAndSortedLeads.length === 0 && <p className="text-center text-dark-text-secondary p-8">No leads match your criteria. Start a new hunt!</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {filteredAndSortedLeads.map(lead => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            onResearch={handleResearch}
                            onChat={handleChat}
                            onPersonalize={() => {}} // Placeholder
                            onCardClick={() => {}} // Placeholder
                        />
                    ))}
                </div>
            </div>

            <AnalyticsSection stats={analyticsStats} />

            <ResearchSlideOver isOpen={slideOver.open} onClose={() => setSlideOver({ open: false, reportHtml: '', lead: null })} reportHtml={slideOver.reportHtml} lead={slideOver.lead} />
            <AgentChat open={chatState.open} onClose={() => setChatState({ open: false, lead: null })} lead={chatState.lead} userEmail="demo@zulari.app" onRunResearch={handleResearch} />
        </div>
    );
};

export default HunterPage;