
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SupportListItem from './SupportListItem';
import SkeletonListItem from './SkeletonListItem';
// FIX: Correct import path for SupportRow type.
import { SupportRow } from '../../types';

interface SupportListProps {
    loading: boolean;
    error: string | null;
    groupedRows: { title: string, items: SupportRow[] }[];
    onSelectRow: (row: SupportRow) => void;
    onRetry: () => void;
}

const SupportList: React.FC<SupportListProps> = ({ loading, error, groupedRows, onSelectRow, onRetry }) => {
    if (loading) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 space-y-2">
                {[...Array(5)].map((_, i) => <SkeletonListItem key={i} />)}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={onRetry} className="bg-brand-primary hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg">Retry</button>
            </div>
        );
    }

    if (groupedRows.length === 0) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center">
                <p className="text-4xl mb-4">📭</p>
                <h3 className="font-bold text-white">All Clear!</h3>
                <p className="text-sm text-dark-text-secondary">No conversations match the current filter.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {groupedRows.map((group, groupIndex) => (
                    <motion.div 
                        key={group.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
                    >
                        <h3 className="font-bold text-dark-text-secondary text-sm mb-2 uppercase tracking-wider">{group.title}</h3>
                        <div className="bg-dark-card border border-dark-border rounded-xl p-2 space-y-2">
                             {group.items.map((row, rowIndex) => (
                                 <motion.div
                                     key={row.rowNumber}
                                     layout
                                     initial={{ opacity: 0, y: 10 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     exit={{ opacity: 0, x: -20 }}
                                     transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
                                >
                                    <SupportListItem row={row} onSelectRow={onSelectRow} />
                                 </motion.div>
                             ))}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default SupportList;