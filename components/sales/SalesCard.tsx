import React from 'react';
import { SalesRow } from '../../types';
import { ICONS } from '../../constants';

interface SalesCardProps {
    row: SalesRow;
    onSelectRow: (row: SalesRow) => void;
}

const timeAgo = (date: Date | null | undefined): string => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
};

const SalesCard: React.FC<SalesCardProps> = ({ row, onSelectRow }) => {
    const statusMap = {
        'Pending': 'bg-yellow-500/20 text-yellow-300',
        'Resolved': 'bg-green-500/20 text-green-300',
        'Escalated': 'bg-red-500/20 text-red-300'
    };
    const statusClass = statusMap[row.Status as keyof typeof statusMap] || 'bg-dark-border text-dark-text-secondary';
    
    return (
        <button
            onClick={() => onSelectRow(row)}
            className="w-full text-left bg-dark-card border border-dark-border rounded-lg p-4 h-full flex flex-col justify-between group hover:border-brand-primary transition-colors"
        >
            <div>
                <div className="flex justify-between items-start">
                    <p className="font-bold text-white pr-2">{row["Customer Name"]}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {row.meetingBooked && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">Booked</span>}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusClass}`}>{row.Status}</span>
                    </div>
                </div>
                 <p className="text-sm text-dark-text-secondary mt-1">{row["Inquiry Topic"]}</p>
                 <p className="text-xs text-dark-text-secondary mt-2 italic line-clamp-2">"{row["Inquiry Body"]}"</p>
            </div>
            <div className="border-t border-dark-border mt-3 pt-2 flex justify-between items-center text-xs text-dark-text-secondary/60 font-mono">
                <span>#{row.rowNumber} • {row["Message ID"]}</span>
                <span>{timeAgo(row.processedAt)}</span>
            </div>
        </button>
    );
};

export default SalesCard;