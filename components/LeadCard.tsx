
import React, { useState } from 'react';
import { Lead } from '../types';
import { ICONS } from '../constants';

interface LeadCardProps {
    lead: Lead;
    onResearch: (lead: Lead) => void;
    onPersonalize: (lead: Lead) => void;
    onChat: (lead: Lead) => void;
    onCardClick: (lead: Lead) => void;
}

const PipelineBadge: React.FC<{ progress: string }> = ({ progress }) => {
    switch(progress) {
        case 'Research': return <div className="text-xs font-semibold px-2 py-1 rounded-full bg-sky-500/10 text-sky-400">✅ Analyzed by Agent 2</div>;
        case 'Personalize': return <div className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">✉️ Personalized by Agent 3</div>;
        case 'Send':
        case 'Response': return <div className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">📢 In Outreach by Agent 4</div>;
        default: return <div className="text-xs font-semibold px-2 py-1 rounded-full bg-dark-border text-dark-text-secondary">Awaiting Research</div>;
    }
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onResearch, onChat }) => {
    const freshnessColor = lead.freshnessDays <= 7 ? 'text-green-400' : 'text-dark-text-secondary';
    const scoreColor = lead.priorityScore > 79 ? 'text-green-400' : lead.priorityScore > 59 ? 'text-amber-400' : 'text-red-400';
    
    return (
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4 flex flex-col justify-between h-full group transition-all duration-300 hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10">
            {/* Top Info Section */}
            <div>
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-dark-border rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                        <p className="font-bold text-white leading-tight">{lead.FullName}</p>
                        <p className="text-xs text-dark-text-secondary">{lead['Job Title']}</p>
                        <p className="text-xs text-dark-text-secondary">{lead['Company Name']}</p>
                    </div>
                </div>
                
                <p className="text-xs text-dark-text-secondary mt-3">{lead.Location}</p>
                
                <div className="flex justify-between items-center mt-2 text-xs">
                    <span>Lead Score: <b className={scoreColor}>{lead.priorityScore}</b></span>
                    <span>Freshness: <span className={freshnessColor}>{lead.freshnessDays}d</span></span>
                </div>
                
                <div className="mt-3">
                    <PipelineBadge progress={lead.progressStep} />
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="border-t border-dark-border mt-3 pt-3 flex justify-between items-center">
                <div className="flex gap-1">
                    <a href={lead['Website URL']} target="_blank" rel="noopener noreferrer" title="Website" className={`p-1.5 rounded border border-dark-border hover:bg-dark-border ${!lead['Website URL'] ? 'opacity-30 pointer-events-none' : ''}`}>
                       {React.cloneElement(ICONS.web, {className: 'w-4 h-4'})}
                    </a>
                    <a href={lead['LinkedIn URL']} target="_blank" rel="noopener noreferrer" title="LinkedIn" className={`p-1.5 rounded border border-dark-border hover:bg-dark-border ${!lead['LinkedIn URL'] ? 'opacity-30 pointer-events-none' : ''}`}>
                       {React.cloneElement(ICONS.linkedin, {className: 'w-4 h-4'})}
                    </a>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onResearch(lead)} className="px-3 py-1 text-xs bg-dark-border hover:bg-brand-primary rounded font-semibold transition-colors">Research</button>
                    <button onClick={() => onChat(lead)} className="px-3 py-1 text-xs bg-dark-border hover:bg-brand-primary rounded font-semibold transition-colors">Chat</button>
                </div>
            </div>
        </div>
    );
};

export default LeadCard;
