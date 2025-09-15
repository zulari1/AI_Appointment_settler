import React from 'react';
import { ICONS } from '../../constants';
import SupportKpiStrip from './SupportKpiStrip';
import { SupportKpis } from '../../utils/supportUtils';

interface SupportHeroProps {
    kpis: SupportKpis | null;
    loading: boolean;
    onSync: () => void;
    onOpenSettings: () => void;
}

const SupportHero: React.FC<SupportHeroProps> = ({ kpis, loading, onSync, onOpenSettings }) => {
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="text-brand-accent">{ICONS.support}</span>
                        <span>Customer Support AI — Quick Reply Sally</span>
                    </h1>
                    <p className="text-dark-text-secondary mt-1">AI drafts replies. You approve exceptions. Book meetings, resolve tickets, and train the AI — faster, safer, and under your control.</p>
                </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={onSync} className="bg-dark-bg hover:bg-dark-border px-3 py-1.5 text-sm rounded-lg flex items-center gap-2" disabled={loading}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>
                        {loading ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button onClick={onOpenSettings} className="bg-dark-bg hover:bg-dark-border p-2 text-sm rounded-lg" aria-label="Settings">
                        {React.cloneElement(ICONS.settings, {className: "h-5 w-5"})}
                    </button>
                </div>
            </div>
            <SupportKpiStrip kpis={kpis} />
        </div>
    );
};

export default SupportHero;
