
import React from 'react';
import { timeAgo } from '../../utils/supportUtils';
// FIX: Correct import path for SupportRow type.
import { SupportRow } from '../../types';
import { ICONS } from '../../constants';

interface SupportListItemProps {
    row: SupportRow;
    onSelectRow: (row: SupportRow) => void;
}

const statusMap: { [key: string]: { color: string, text: string } } = {
    'new': { color: 'bg-yellow-500', text: 'New' },
    'human review': { color: 'bg-blue-500', text: 'Review' },
    'complete': { color: 'bg-green-500', text: 'Complete' },
    'escalated': { color: 'bg-red-500', text: 'Escalated' },
    'in progress': { color: 'bg-sky-500', text: 'In Progress' }
};

const SupportListItem: React.FC<SupportListItemProps> = ({ row, onSelectRow }) => {
    const statusKey = String(row.Status || '').toLowerCase();
    const status = statusMap[statusKey] || { color: 'bg-gray-500', text: row.Status };
    const isEscalated = String(row['Escalation Flag']).toUpperCase() === 'TRUE' || String(row['Escalation Flag']).toUpperCase() === 'YES';

    return (
        <button 
            onClick={() => onSelectRow(row)}
            className="w-full text-left p-3 flex items-center gap-4 bg-dark-bg hover:bg-dark-border rounded-lg transition-colors animate-fade-in"
            style={{ animationFillMode: 'backwards' }}
        >
            <div className={`w-2 h-10 rounded-full flex-shrink-0 ${status.color}`}></div>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                    <p className="font-bold text-white truncate text-sm">
                        {row['Customer Name'] || "Unknown customer"}
                        <span className="font-normal text-dark-text-secondary ml-2">• {row['Inquiry Topic']}</span>
                        {row['Contact ID'] && <span className="font-mono text-xs text-dark-text-secondary/50 ml-2">({row['Contact ID']})</span>}
                    </p>
                    <span className="text-xs text-dark-text-secondary flex-shrink-0 ml-2">{timeAgo(row.Timestamp)}</span>
                </div>
                 <p className="text-xs text-dark-text-secondary truncate mt-1">
                    <i className="truncate">"{row['Inquiry Body']}"</i>
                </p>
                <div className="flex items-center gap-3 text-xs text-dark-text-secondary mt-2">
                    {isEscalated && <span className="flex items-center gap-1 font-bold text-red-400">⚠️ Escalated</span>}
                    <span className="flex items-center gap-1">Status: {row.Status}</span>
                    {row['Thread ID'] && <span className="flex items-center gap-1 font-mono">TID: {row['Thread ID']}</span>}
                </div>
            </div>
            <div className="flex-shrink-0 text-dark-text-secondary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
        </button>
    );
};

export default SupportListItem;