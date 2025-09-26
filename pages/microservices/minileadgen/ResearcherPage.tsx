
import React, { useState, useEffect, useCallback } from 'react';
import * as n8n from '../../../services/n8nService';
import { Lead } from '../../../types';
import ActionNotification from '../../../components/ActionNotification';
import ResearchSlideOver from '../../../components/ResearchSlideOver';
import DOMPurify from 'dompurify';
import AgentChat from '../../../components/AgentChat';
import { ICONS } from '../../../constants';
import { motion } from 'framer-motion';

const PageHeader: React.FC = () => {
    const PipelineStep: React.FC<{ num: number, name: string, active?: boolean }> = ({ num, name, active }) => (
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ring-1 flex-shrink-0 ${active ? 'bg-brand-primary text-white ring-brand-primary' : 'bg-dark-bg text-dark-text-secondary ring-dark-border'}`}>
                {num}
            </div>
            <span className={`font-semibold ${active ? 'text-white' : 'text-dark-text-secondary'}`}>{name}</span>
        </div>
    );
    const Connector: React.FC = () => <div className="flex-1 h-px bg-dark-border"></div>;

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white">AI Agent 2: Researcher</h2>
            <p className="text-dark-text-secondary mt-1">
                Transforms raw leads into rich profiles by gathering deep personal, company, and contextual insights. These insights fuel personalization (Agent 3) and outreach (Agent 4).
            </p>
            <div className="mt-4 bg-dark-bg p-3 rounded-lg flex items-center gap-2">
                <PipelineStep num={1} name="Hunter" />
                <Connector />
                <PipelineStep num={2} name="Researcher" active />
                <Connector />
                <PipelineStep num={3} name="Personalizer" />
                <Connector />
                <PipelineStep num={4} name="Outreach" />
            </div>
            <p className="text-center text-xs text-brand-accent font-semibold mt-2">“This is where raw contacts turn into actionable intelligence.”</p>
        </div>
    );
};

const ResearchingIndicator: React.FC<{ leadName: string }> = ({ leadName }) => {
    const stages = ["Gathering info", "Building Person Profile", "Finding Company Profile", "Scanning for Similarities", "Identifying Pain Points & Solutions"];
    const [currentStageIndex, setCurrentStageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStageIndex(prev => {
                if (prev >= stages.length - 1) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const progress = ((currentStageIndex + 1) / stages.length) * 100;

    return (
        <div className="w-48 text-left">
            <div className="w-full bg-dark-bg rounded-full h-1.5 mb-1">
                <div className="bg-brand-primary h-1.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
            <p className="text-xs text-dark-text-secondary truncate">
                {stages[currentStageIndex]}...
            </p>
        </div>
    );
};


const LeadTable: React.FC<{
    leads: Lead[],
    researchingId: number | null,
    onResearch: (lead: Lead) => void,
    onViewReport: (lead: Lead) => void,
    onChat: (lead: Lead) => void
}> = ({ leads, researchingId, onResearch, onViewReport, onChat }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="text-xs text-dark-text-secondary uppercase bg-dark-bg">
                <tr>
                    <th className="p-3 text-left">Lead</th>
                    <th className="p-3 text-left">Role / Company</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
                {leads.map(lead => {
                    const isAnalyzed = lead.analyzedBool;
                    const isResearching = researchingId === lead.rowNumber;
                    return (
                        <tr key={lead.rowNumber} className="hover:bg-dark-bg/50">
                            <td className="p-3"><p className="font-medium text-white">{lead.FullName}</p></td>
                            <td className="p-3 text-dark-text-secondary">{lead['Job Title']} • {lead['Company Name']}</td>
                            <td className="p-3 text-center"><span className="px-2 py-0.5 rounded-full bg-dark-bg text-xs font-bold">{lead.priorityScore}</span></td>
                            <td className="p-3 text-center text-xs font-semibold">
                                {isAnalyzed
                                    ? <span className="text-green-400">✅ Analyzed</span>
                                    : <span className="text-yellow-400">❌ Not Analyzed</span>
                                }
                            </td>
                            <td className="p-3 text-right">
                                <div className="flex justify-end items-center gap-2">
                                    {isResearching ? (
                                        <ResearchingIndicator leadName={lead.FullName} />
                                    ) : isAnalyzed ? (
                                        <>
                                            <button onClick={() => onViewReport(lead)} className="px-2 py-1 text-xs bg-dark-border hover:bg-brand-primary rounded">📄 View Report</button>
                                            <button onClick={() => onChat(lead)} className="px-2 py-1 text-xs bg-dark-border hover:bg-brand-primary rounded">💬 Chat</button>
                                        </>
                                    ) : (
                                        <button onClick={() => onResearch(lead)} className="px-2 py-1 text-xs bg-brand-primary hover:bg-indigo-500 rounded font-semibold">🔍 Research</button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const AnalyticsSection: React.FC<{ researched: number, total: number }> = ({ researched, total }) => {
    const avgScore = 72; // Mocked for now
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-dark-bg p-3 rounded-lg">
                    <p className="text-2xl font-bold text-white">{researched} / {total}</p>
                    <p className="text-xs text-dark-text-secondary">Leads Researched</p>
                </div>
                <div className="bg-dark-bg p-3 rounded-lg">
                    <p className="text-2xl font-bold text-white">{avgScore}</p>
                    <p className="text-xs text-dark-text-secondary">Avg. Score</p>
                </div>
                <div className="bg-dark-bg p-3 rounded-lg">
                    <p className="text-2xl font-bold text-white flex items-center justify-center gap-1">High <span className="text-yellow-400">⚡</span></p>
                    <p className="text-xs text-dark-text-secondary">Resource Usage</p>
                </div>
                <div className="bg-dark-bg p-3 rounded-lg">
                    <p className="text-2xl font-bold text-white">~{Math.round(researched * 0.5)}h</p>
                    <p className="text-xs text-dark-text-secondary">Time Saved</p>
                </div>
            </div>
        </div>
    );
};


const ResearcherPage: React.FC = () => {
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [slideOver, setSlideOver] = useState<{ open: boolean; reportHtml: string; lead: Lead | null }>({ open: false, reportHtml: '', lead: null });
    const [chatState, setChatState] = useState<{open: boolean, lead: Lead | null}>({open: false, lead: null});
    const [researchingId, setResearchingId] = useState<number | null>(null);
    
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const { leads } = await n8n.fetchLeads(1, 100, 'All');
            setAllLeads(leads.sort((a, b) => (a.analyzedBool ? 1 : -1) - (b.analyzedBool ? 1 : -1) || b.priorityScore - a.priorityScore));
        } catch (e: any) {
            setNotification({ message: `Failed to load leads: ${e.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleResearch = async (lead: Lead) => {
        if (!lead.rowNumber) return;
        setResearchingId(lead.rowNumber);
        try {
            const researchPayload = {
                action: 'research', userEmail: 'demo@zulari.app',
                lead: { name: lead.FullName, email: lead['Email Address'], linkedin: lead['LinkedIn URL'] }
            };
            await n8n.researchLead(researchPayload);
            setNotification({ message: `Research complete for ${lead.FullName}.`, type: 'success' });
            fetchLeads(); // Refresh list to show updated status
        } catch (e: any) {
            setNotification({ message: `Research failed: ${e.message}`, type: 'error' });
        } finally {
            setResearchingId(null);
        }
    };

    const handleViewReport = (lead: Lead) => {
        setSlideOver({ open: true, reportHtml: DOMPurify.sanitize(lead['Research Report'] || ''), lead });
    };

    const handleChat = (lead: Lead) => {
        setChatState({ open: true, lead: lead });
    };

    const researchedCount = allLeads.filter(l => l.analyzedBool).length;

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <PageHeader />

            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <h2 className="text-xl font-bold text-white mb-4">Lead Enrichment Queue</h2>
                {loading && <div className="text-center p-8">Loading leads...</div>}
                {!loading && allLeads.length === 0 && <p className="text-center text-dark-text-secondary p-8">No leads in the queue. Go to the Hunter to find new leads.</p>}
                {!loading && allLeads.length > 0 && (
                    <LeadTable
                        leads={allLeads}
                        researchingId={researchingId}
                        onResearch={handleResearch}
                        onViewReport={handleViewReport}
                        onChat={handleChat}
                    />
                )}
            </div>

            <AnalyticsSection researched={researchedCount} total={allLeads.length} />

            <ResearchSlideOver 
                isOpen={slideOver.open} 
                onClose={() => setSlideOver({ open: false, reportHtml: '', lead: null })}
                reportHtml={slideOver.reportHtml}
                lead={slideOver.lead}
            />
            <AgentChat
                open={chatState.open}
                onClose={() => setChatState({ open: false, lead: null })}
                lead={chatState.lead}
                userEmail="demo@zulari.app"
                onRunResearch={handleResearch}
            />
        </div>
    );
};

export default ResearcherPage;