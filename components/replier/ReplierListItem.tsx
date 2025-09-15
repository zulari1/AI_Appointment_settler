import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { ReplierRow } from '../../types';
import { ICONS } from '../../constants';

interface ReplierListItemProps {
    row: ReplierRow;
    onSelectRow: (row: ReplierRow) => void;
    onUpdateAction: (action: "approve" | "decline", row: ReplierRow) => void;
    isNew: boolean;
    isSelected: boolean;
    onSelectChange: () => void;
}

const statusColorMap: { [key: string]: string } = {
    pending: 'bg-yellow-500',
    'awaiting human': 'bg-blue-500',
    completed: 'bg-green-500',
    escalated: 'bg-red-500',
    'in progress': 'bg-sky-500'
};interface ConfidenceBadgeProps {
  score: number;
  category: string;
}


const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, category }) => {
    const color = category === 'high' ? 'text-green-400' : category === 'medium' ? 'text-amber-400' : 'text-red-400';
    return <span className={`font-bold text-xs ${color}`}>{score}%</span>;
};interface QuickIconsProps {
  row: ReplierRow;
}


const QuickIcons: React.FC<QuickIconsProps> = ({ row }) => (
    <div className="flex items-center gap-2 text-dark-text-secondary/60">
        {row['Google Calendar Link'] && React.cloneElement(ICONS.calendar, {className: 'h-3 w-3'})}
        {row['Email Thread Link'] && React.cloneElement(ICONS.email, {className: 'h-3 w-3'})}
    </div>
);

const ReplierListItem: React.FC<ReplierListItemProps> = ({ row, onSelectRow, onUpdateAction, isNew, isSelected, onSelectChange }) => {
    const [isHovered, setIsHovered] = useState(false);
    const statusText = String(row.Status || '').toLowerCase() || 'unknown';
    const statusColor = statusColorMap[statusText] || 'bg-gray-500';
    const isEscalated = String(row['Human Escalation Needed']).toUpperCase() === 'YES';

    const handleSendNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdateAction('approve', row);
    };
    
    const handleEscalate = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdateAction('decline', row);
    }

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
             onUpdateAction('approve', row);
        } else if (info.offset.x < -threshold) {
             onUpdateAction('decline', row);
        }
    };

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            animate={{ 
                height: isHovered ? '140px' : '72px',
                boxShadow: isNew ? '0 0 0 2px rgba(79, 70, 229, 0.7)' : '0 0 0 0px rgba(79, 70, 229, 0)',
            }}
            transition={{ 
                height: { type: "spring", stiffness: 400, damping: 30 },
                boxShadow: { duration: 1, ease: 'easeOut' }
            }}
            className={`bg-dark-bg border rounded-lg overflow-hidden relative ${isEscalated ? 'border-red-500/50 animate-pulse' : 'border-dark-border'}`}
        >
            {/* Compact View */}
            <div className="p-3 h-[72px] flex items-center gap-3">
                <div className="flex items-center gap-3 flex-shrink-0">
                    <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); onSelectChange(); }} className="h-4 w-4 rounded bg-dark-border text-brand-primary focus:ring-brand-primary" />
                    <span className={`w-2 h-10 rounded-full ${statusColor}`}></span>
                </div>
                <div className="flex-1 min-w-0 space-y-1 cursor-pointer" onClick={() => onSelectRow(row)}>
                    <div className="flex items-baseline gap-2 text-sm">
                        <p className="font-bold text-white truncate">{String(row['User Name'] || '')}</p>
                        <p className="text-dark-text-secondary truncate hidden sm:block">| {String(row['Subject/Title'] || '')}</p>
                        <ConfidenceBadge score={row.aiConfidence} category={row.confidenceCategory} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dark-text-secondary/80">
                        <p className="truncate">{String(row['Original Message/Content'] || '')}</p>
                    </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end text-xs cursor-pointer" onClick={() => onSelectRow(row)}>
                     <QuickIcons row={row} />
                     <p className="font-mono text-dark-text-secondary/50 mt-1">{row['Request ID']}</p>
                </div>
            </div>
            
            {/* Expanded View */}
            <motion.div 
                className="absolute top-[72px] left-0 right-0 h-[68px] bg-dark-bg/50 backdrop-blur-sm px-3 py-2 flex items-center gap-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: isHovered ? 0 : -20, opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.2 }}
            >
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-dark-text-secondary mb-1">🤖 AI Suggested Action:</p>
                    <p className="text-xs text-white truncate">{String(row['AI Action/Response'] || 'No suggestion available.')}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    <button onClick={handleSendNow} className="px-3 py-1 text-xs bg-brand-secondary/80 hover:bg-brand-secondary rounded font-semibold">✅ Approve</button>
                    <button onClick={handleEscalate} className="px-3 py-1 text-xs bg-red-500/80 hover:bg-red-500 rounded font-semibold">❌ Decline</button>
                    <button onClick={() => onSelectRow(row)} className="px-3 py-1 text-xs bg-dark-border hover:bg-brand-primary rounded font-semibold">Review</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ReplierListItem;