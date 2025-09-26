import React, { useState } from 'react';
import { ICONS } from '../constants';
import * as n8n from '../services/n8nService';
import { InfluencerResearchResponse } from '../types';
import ActionNotification from '../components/ActionNotification';
import InfoTooltip from '../components/InfoTooltip';
import ProcessingAnimation from '../components/ProcessingAnimation';
import ResultCard from '../components/ResultCard';

const formatFollowers = (count: number): string => {
    if (!count) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return String(count);
};

const InfluencerResultContent: React.FC<{ result: InfluencerResearchResponse }> = ({ result }) => (
    <>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dark-border pb-4 mb-4">
            <div>
                <a href={result.profile_url} target="_blank" rel="noopener noreferrer" className="text-2xl font-bold text-white hover:text-brand-accent">@{result.username}</a>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${result.should_collaborate ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                <span>{result.should_collaborate ? '✅' : '❌'}</span>
                <span>{result.should_collaborate ? 'Recommended' : 'Not Recommended'}</span>
            </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">AI Reasoning</h3>
        <p className="text-dark-text-secondary">{result.reason}</p>
        <div className="grid grid-cols-3 gap-4 text-center mt-6 border-t border-dark-border pt-6">
            <div><p className="text-2xl font-bold text-brand-accent">{formatFollowers(result.follower_count)}</p><p className="text-xs text-dark-text-secondary">Followers</p></div>
            <div><p className="text-2xl font-bold text-brand-accent">{result.engagement_rate || 'N/A'}</p><p className="text-xs text-dark-text-secondary">Engagement</p></div>
            <div><p className="text-2xl font-bold text-brand-accent">{result.location || 'N/A'}</p><p className="text-xs text-dark-text-secondary">Location</p></div>
        </div>
    </>
);

const InfluencerResearchPage: React.FC = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [result, setResult] = useState<InfluencerResearchResponse | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setIsLoading(true);
        setNotification(null);
        setResult(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Fake progress
            const response = await n8n.submitInfluencerResearch({ username_or_url: input });
            setResult(response);
            setNotification({ message: 'Analysis complete!', type: 'success'});
        } catch (err: any) {
            setNotification({ message: err.message || "Failed to fetch influencer data.", type: 'error'});
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
             <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="text-brand-accent">{ICONS.influencer}</span>
                    <span>Influencer Research AI</span>
                </h1>
                <p className="text-dark-text-secondary mt-1">
                    Get an AI-powered analysis and collaboration recommendation for any Instagram profile.
                </p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* --- INPUT PANE --- */}
                <div className="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        Analyze Profile
                        <InfoTooltip
                            what="Analyzes an Instagram profile."
                            how="Enter a username or profile URL. The AI scrapes public data, analyzes metrics like engagement and follower authenticity, and provides a collaboration recommendation."
                            benefit="Saves time on manual vetting and helps you find high-quality influencers for your campaigns."
                        />
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="influencerInput" className="block text-sm font-medium text-dark-text-secondary mb-1">Instagram @username or URL</label>
                            <input
                                id="influencerInput" type="text" value={input} onChange={(e) => setInput(e.target.value)}
                                placeholder="@username"
                                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3"
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center disabled:bg-slate-600" disabled={isLoading || !input.trim()}>
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </form>
                </div>

                {/* --- OUTPUT PANE --- */}
                <div className="lg:col-span-2">
                     <div className="min-h-[400px]">
                        {isLoading && <ProcessingAnimation message="Analyzing profile metrics and audience..." />}
                        {result && (
                            <ResultCard 
                                title="AI Analysis Report"
                                actions={
                                    <div className="flex flex-wrap gap-2">
                                        {result.similar_influencers.map(inf => (
                                            <a href={inf.profile_url} key={inf.username} target="_blank" rel="noopener noreferrer" className="bg-dark-border hover:bg-brand-primary text-dark-text-secondary hover:text-white text-xs font-mono px-2 py-1 rounded-full">
                                                @{inf.username}
                                            </a>
                                        ))}
                                    </div>
                                }
                            >
                                <InfluencerResultContent result={result} />
                            </ResultCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfluencerResearchPage;