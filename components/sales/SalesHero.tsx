import React from 'react';
import { SalesKpis } from '../../types';
import SalesKPI from './SalesKPI';
import { ICONS } from '../../constants';

interface SalesHeroProps {
    kpis: SalesKpis | null;
    isLoading: boolean;
    isPaused: boolean;
    onPauseToggle: () => void;
    onSync: () => void;
    onOpenSettings: () => void;
    onOpenTraining: () => void;
}

const SalesHero: React.FC<SalesHeroProps> = ({ kpis, isLoading, isPaused, onPauseToggle, onSync, onOpenSettings, onOpenTraining }) => {
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                         <span className="text-brand-accent">{ICONS.sales}</span>
                        <span>Sales AI Agent</span>
                    </h1>
                    <p className="text-dark-text-secondary mt-1">Book demos while you sleep. AI analyzes incoming requests and prepares responses.</p>
                </div>
                 <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={onPauseToggle} className="bg-dark-bg hover:bg-dark-border px-3 py-1.5 text-sm rounded-lg flex items-center gap-2" title={isPaused ? "Resume polling" : "Pause polling"}>
                        {isPaused ? ICONS.play : ICONS.pause}
                    </button>
                     <button onClick={onSync} className="bg-dark-bg hover:bg-dark-border px-3 py-1.5 text-sm rounded-lg flex items-center gap-2" disabled={isLoading}>
                        <div className={`${isLoading ? 'animate-spin' : ''}`}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>
                        </div>
                        {isLoading ? 'Syncing...' : 'Manual Sync'}
                    </button>
                    <button onClick={onOpenTraining} className="bg-dark-bg hover:bg-dark-border px-3 py-1.5 text-sm rounded-lg flex items-center gap-2">
                        {React.cloneElement(ICONS.training, { className: 'h-4 w-4' })} Train
                    </button>
                    <button onClick={onOpenSettings} className="p-2 rounded-lg bg-dark-bg hover:bg-dark-border" aria-label="Open Settings">
                        {React.cloneElement(ICONS.settings, { className: "h-5 w-5" })}
                    </button>
                </div>
            </div>
            <SalesKPI kpis={kpis} />
        </div>
    );
};

export default SalesHero;