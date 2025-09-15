import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { Filter } from '../../types';

interface SupportFiltersBarProps {
    activeFilter: Filter;
    setFilter: (filter: Filter) => void;
}

const filters: { key: Filter; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'escalated', label: 'Escalated' },
    { key: 'today', label: 'Today' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
];

const SupportFiltersBar: React.FC<SupportFiltersBarProps> = ({ activeFilter, setFilter }) => {
    return (
        <LayoutGroup>
            <div className="flex items-center gap-2 p-1 bg-dark-card rounded-lg border border-dark-border">
                {filters.map(f => (
                    <button 
                        key={f.key} 
                        onClick={() => setFilter(f.key)} 
                        className={`relative px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === f.key ? 'text-white' : 'text-dark-text-secondary hover:text-white'}`}
                    >
                        {activeFilter === f.key && (
                            <motion.div 
                                layoutId="filterHighlight" 
                                className="absolute inset-0 bg-brand-primary rounded-md" 
                                style={{ zIndex: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{f.label}</span>
                    </button>
                ))}
            </div>
        </LayoutGroup>
    );
};

export default SupportFiltersBar;