import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { ReplierRow } from '../../types';
import ReplierListItem from './ReplierListItem';
import SkeletonListItem from './SkeletonListItem';

interface ReplierListProps {
    fetchState: 'loading' | 'success' | 'empty' | 'error';
    onRetry: () => void;
    groupedRows: { title: string, items: ReplierRow[] }[];
    onSelectRow: (row: ReplierRow) => void;
    onUpdateAction: (action: "approve" | "decline", row: ReplierRow) => void;
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    newRowIds: Set<string>;
    selectedIds: Set<string>;
    onSelectionChange: (requestId: string) => void;
    onSelectAll: (checked: boolean) => void;
    onBulkAction: (action: 'approve' | 'decline') => void;
}

const FilterBar: React.FC<{ activeFilter: string, setActiveFilter: (f: string) => void }> = ({ activeFilter, setActiveFilter }) => {
    const filters = [
        { key: 'action_required', label: 'Action Required', icon: '⚠️' },
        { key: 'high_confidence', label: 'High Confidence', icon: '🎯' },
        { key: 'needs_review', label: 'Needs Review', icon: '🧐' },
        { key: 'calendar_only', label: 'Calendar Only', icon: '📅' },
        { key: 'active', label: 'Active', icon: '🔄' },
    ];
    return (
        <LayoutGroup>
            <div className="flex items-center gap-2 mb-4 p-2 bg-dark-bg rounded-lg flex-wrap">
                {filters.map(f => (
                    <button 
                        key={f.key} 
                        onClick={() => setActiveFilter(f.key)} 
                        className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeFilter === f.key ? 'text-white' : 'text-dark-text-secondary hover:text-white'}`}
                    >
                        {activeFilter === f.key && (
                            <motion.div 
                                layoutId="filterHighlight" 
                                className="absolute inset-0 bg-brand-primary rounded-md" 
                                style={{ zIndex: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{f.icon}</span>
                        <span className="relative z-10">{f.label}</span>
                    </button>
                ))}
            </div>
        </LayoutGroup>
    );
};

const EmptyState: React.FC = () => (
    <div className="text-center py-12">
        <p className="text-4xl mb-4">📭</p>
        <h3 className="font-bold text-white">No conversations yet</h3>
        <p className="text-sm text-dark-text-secondary">AI will auto-pull new emails. Check back soon.</p>
    </div>
);

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
     <div className="text-center py-12">
        <p className="text-4xl mb-4">⚠️</p>
        <h3 className="font-bold text-white">Could not load replies</h3>
        <p className="text-sm text-dark-text-secondary">Please try again or check your Google Sheets connection.</p>
        <button onClick={onRetry} className="mt-4 bg-brand-primary hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg">
            🔄 Retry Now
        </button>
    </div>
);


const ReplierList: React.FC<ReplierListProps> = ({ 
    fetchState, onRetry, groupedRows, onSelectRow, onUpdateAction, 
    activeFilter, setActiveFilter, newRowIds,
    selectedIds, onSelectionChange, onSelectAll, onBulkAction
}) => {
    
    const totalVisibleItems = groupedRows.reduce((acc, group) => acc + group.items.length, 0);
    const isAllSelected = selectedIds.size > 0 && selectedIds.size === totalVisibleItems;

    const renderContent = () => {
        switch(fetchState) {
            case 'loading':
                return (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => <SkeletonListItem key={i} />)}
                    </div>
                );
            case 'empty':
                return <EmptyState />;
            case 'error':
                return <ErrorState onRetry={onRetry} />;
            case 'success':
                 if (groupedRows.length === 0) {
                    return <p className="text-center py-8 text-dark-text-secondary">No items match the current filter.</p>
                }
                return (
                    <div className="space-y-4">
                        {groupedRows.map(group => (
                            <div key={group.title}>
                                <h3 className="font-bold text-dark-text-secondary text-sm mb-2 uppercase tracking-wider">{group.title} ({group.items.length})</h3>
                                <div className="space-y-2">
                                    {group.items.map(row => 
                                        <ReplierListItem 
                                            key={row['Request ID']} 
                                            row={row} 
                                            isSelected={selectedIds.has(row['Request ID'])}
                                            onSelectChange={() => onSelectionChange(row['Request ID'])}
                                            onSelectRow={onSelectRow} 
                                            onUpdateAction={onUpdateAction} 
                                            isNew={newRowIds.has(row['Request ID'])} 
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4">
             <FilterBar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
             
             {selectedIds.size > 0 && (
                <motion.div initial={{y: -10, opacity: 0}} animate={{y: 0, opacity: 1}} className="mb-4 p-2 bg-dark-bg rounded-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                         <input type="checkbox" checked={isAllSelected} onChange={(e) => onSelectAll(e.target.checked)} className="ml-2" />
                         <span className="text-sm font-semibold">{selectedIds.size} selected</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onBulkAction('approve')} className="px-3 py-1 text-xs bg-green-500/80 hover:bg-green-500 rounded font-semibold">✅ Approve Selected</button>
                        <button onClick={() => onBulkAction('decline')} className="px-3 py-1 text-xs bg-red-500/80 hover:bg-red-500 rounded font-semibold">❌ Decline Selected</button>
                    </div>
                </motion.div>
             )}
             
             {renderContent()}
        </div>
    );
};

export default ReplierList;