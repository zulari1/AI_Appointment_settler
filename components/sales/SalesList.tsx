import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SalesRow } from '../../types';
import SalesCard from './SalesCard';

const SkeletonCard: React.FC = () => (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4 space-y-3 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-4 bg-dark-bg rounded w-1/2"></div>
            <div className="h-5 bg-dark-bg rounded-full w-16"></div>
        </div>
        <div className="h-3 bg-dark-bg rounded w-3/4"></div>
        <div className="h-3 bg-dark-bg rounded w-full"></div>
    </div>
);

interface SalesListProps {
    loading: boolean;
    rows: SalesRow[];
    onSelectRow: (row: SalesRow) => void;
}

const SalesList: React.FC<SalesListProps> = ({ loading, rows, onSelectRow }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center">
                <p className="text-4xl mb-4">📭</p>
                <h3 className="font-bold text-white">Inbox Clear</h3>
                <p className="text-sm text-dark-text-secondary">No items match the current filter.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
                {rows.map((row, index) => (
                    <motion.div
                        key={row.rowNumber}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <SalesCard row={row} onSelectRow={onSelectRow} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default SalesList;