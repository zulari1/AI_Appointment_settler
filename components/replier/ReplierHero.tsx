import React from 'react';
import { ICONS } from '../../constants';
import ReplierKPI from './ReplierKPI';
import { ReplierKpis } from '../../types';

interface ReplierHeroProps {
    kpis: ReplierKpis | null;
    syncStatus: { status: string; lastSync: Date | null };
    onManualSync: () => void;
    onOpenSettings: () => void;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
}interface SyncStatusLineProps {
  syncStatus: ReplierHeroProps['syncStatus'];
}


const SyncStatusLine: React.FC<SyncStatusLineProps> = ({ syncStatus }) => {
    const { status, lastSync } = syncStatus;

    const statusMap = {
        synced: { text: "Active", color: "text-green-400", pulse: "bg-green-500" },
        syncing: { text: "Syncing...", color: "text-amber-400", pulse: "bg-amber-500" },
        delayed: { text: "Delayed", color: "text-amber-400", pulse: "bg-amber-500" },
        error: { text: "Sync Error", color: "text-red-400", pulse: "bg-red-500" },
        paused: { text: "Paused", color: "text-gray-400", pulse: "bg-gray-500" },
    };

    const currentStatus = statusMap[status as keyof typeof statusMap] || statusMap.paused;
    const lastSyncText = lastSync ? `${Math.round((Date.now() - lastSync.getTime()) / 1000)}s ago` : 'N/A';
    
    return (
        <div className="flex items-center gap-2 text-xs text-dark-text-secondary font-mono">
            <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentStatus.pulse} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStatus.pulse}`}></span>
            </span>
            <span className={currentStatus.color}>{currentStatus.text}</span>
            <span>•</span>
            <span>Last sync: {lastSyncText}</span>
        </div>
    );
};

const ReplierHero: React.FC<ReplierHeroProps> = ({ kpis, syncStatus, onManualSync, onOpenSettings, isPaused, setIsPaused }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 space-y-4 sticky top-4 z-20">
        {(syncStatus.status === 'delayed' || syncStatus.status === 'error') && (
            <div className="p-2 bg-amber-900/50 text-amber-300 text-xs rounded-lg border border-amber-700 text-center">
                ⚠️ {syncStatus.status === 'delayed' ? 'Live sync delayed' : 'Sync error'} — showing last updated data from {syncStatus.lastSync?.toLocaleTimeString()}.
            </div>
        )}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Replier Inbox</h2>
                <p className="text-sm text-dark-text-secondary">Smart AI handles routine replies, so you can focus on high-value conversations.</p>
                <div className="mt-2"><SyncStatusLine syncStatus={syncStatus} /></div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setIsPaused(!isPaused)} className="bg-dark-bg hover:bg-dark-border px-3 py-1.5 text-sm rounded-lg flex items-center gap-2" title={isPaused ? "Resume polling" : "Pause polling"}>
                    {isPaused ? ICONS.play : ICONS.pause}
                    {isPaused ? 'Resume' : 'Pause'}
                </button>
                 <button onClick={onManualSync} className="bg-dark-bg hover:bg-dark-border px-3 py-1.5 text-sm rounded-lg flex items-center gap-2" disabled={syncStatus.status === 'syncing'}>
                    <div className={`${syncStatus.status === 'syncing' ? 'animate-spin' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>
                    </div>
                    {syncStatus.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
                </button>
                <button onClick={onOpenSettings} className="p-2 rounded-lg bg-dark-bg hover:bg-dark-border" aria-label="Open Settings">
                    {React.cloneElement(ICONS.settings, {className: "h-5 w-5"})}
                </button>
            </div>
        </div>
        <ReplierKPI kpis={kpis} />
    </div>
);

export default ReplierHero;