import React from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import { EvaluateAccessResult } from '../services/accessControl';

interface DashboardServiceCardProps {
    title: string;
    icon: React.ReactNode;
    link: string;
    accessStatus?: EvaluateAccessResult | null;
    metrics?: string;
    teaser?: string;
}

const DashboardServiceCard: React.FC<DashboardServiceCardProps> = ({ title, icon, link, accessStatus, metrics, teaser }) => {
    // Loading State
    if (accessStatus === undefined) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-5 animate-pulse h-full min-h-[180px]">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-dark-bg rounded-lg h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-dark-bg rounded w-3/4"></div>
                        <div className="h-3 bg-dark-bg rounded w-1/2"></div>
                    </div>
                </div>
                <div className="h-4 bg-dark-bg rounded w-full mb-4"></div>
                <div className="h-4 bg-dark-bg rounded w-1/3"></div>
            </div>
        );
    }

    // Locked State
    if (!accessStatus?.allowed) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-5 h-full flex flex-col justify-between opacity-80 min-h-[180px]">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-white flex items-center gap-2">
                           {icon}
                           {title}
                        </h3>
                         <span className="text-amber-400 text-2xl">🔒</span>
                    </div>
                    <p className="text-sm text-dark-text-secondary mb-2">{teaser || 'Unlock advanced capabilities and automate more tasks.'}</p>
                    <p className="text-sm text-dark-text-secondary font-mono bg-dark-bg/50 p-2 rounded-md italic">📊 Hidden Insights</p>
                </div>
                <Link
                    to="/management/billing"
                    className="mt-4 block w-full text-center font-semibold bg-brand-primary/80 hover:bg-brand-primary text-white py-2 px-4 rounded-lg transition-colors"
                >
                    Upgrade to Unlock &rarr;
                </Link>
            </div>
        );
    }

    // Active State
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 h-full flex flex-col justify-between group hover:border-brand-primary transition-colors min-h-[180px]">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-dark-bg rounded-lg text-brand-accent">{icon}</div>
                    <div>
                        <h3 className="font-bold text-white">{title}</h3>
                        <p className="text-xs text-green-400 font-mono">✅ Online</p>
                    </div>
                </div>
                <p className="text-sm text-dark-text-secondary mb-4">{metrics || 'Service is active and running.'}</p>
            </div>
            <Link to={link} className="font-semibold text-brand-primary group-hover:text-brand-accent transition-colors text-sm">
                Manage Agent &rarr;
            </Link>
        </div>
    );
};

export default DashboardServiceCard;