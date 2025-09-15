import React, { useState } from 'react';
import { ICONS } from '../../constants';
import ActionNotification from '../../components/ActionNotification';
import InfoTooltip from '../../components/InfoTooltip';
import ProcessingAnimation from '../../components/ProcessingAnimation';
import ResultCard from '../../components/ResultCard';

const SEOPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsLoading(true);
        setResult(null);
        setNotification(null);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 4000));
        setResult({
            score: 85,
            title: "On-Page Audit for example.com",
            recommendations: [
                "Improve mobile load speed.",
                "Add 'AI marketing tools' to H1 tag.",
                "Increase internal linking to the services page."
            ]
        });
        setNotification({ message: 'SEO Analysis complete!', type: 'success' });
        setIsLoading(false);
    }

    return (
        <div className="space-y-8">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="text-brand-accent">{ICONS.seo}</span>
                    <span>SEO Optimization AI</span>
                </h1>
                <p className="text-dark-text-secondary mt-1">Analyze and improve your website's search engine ranking.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                 {/* --- INPUT PANE --- */}
                <div className="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        New SEO Task
                        <InfoTooltip 
                            what="Runs an SEO analysis on a specific URL."
                            how="Enter a URL and a focus keyword. The AI audits the page for on-page SEO factors, content relevance, and technical issues."
                            benefit="Provides actionable recommendations to improve your search ranking and drive more organic traffic."
                        />
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="url" className="block text-sm font-medium text-dark-text-secondary mb-1">Website URL</label>
                            <input type="text" id="url" defaultValue="https://example.com" placeholder="https://example.com" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isLoading} />
                        </div>
                        <div>
                            <label htmlFor="keyword" className="block text-sm font-medium text-dark-text-secondary mb-1">Focus Keyword</label>
                            <input type="text" id="keyword" defaultValue="AI marketing tools" placeholder="e.g., 'AI marketing tools'" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isLoading} />
                        </div>
                         <div>
                            <label htmlFor="task" className="block text-sm font-medium text-dark-text-secondary mb-1">Task Type</label>
                            <select id="task" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" disabled={isLoading}>
                                <option>On-Page Audit</option>
                                <option>Content Brief Generation</option>
                                <option>Backlink Analysis</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-600">
                            {isLoading ? 'Analyzing...' : 'Start Analysis'}
                        </button>
                    </form>
                </div>
                {/* --- OUTPUT PANE --- */}
                <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6 min-h-[400px]">
                    <h2 className="text-xl font-bold text-white mb-4">Results</h2>
                    {isLoading && <ProcessingAnimation message="Auditing on-page factors and checking keywords..." />}
                    {result && (
                        <ResultCard title={result.title}>
                            <div className="flex items-baseline gap-4 mb-4">
                               <p className="text-4xl font-bold text-green-400">{result.score}/100</p>
                               <p>Overall SEO Score</p>
                            </div>
                            <h4 className="font-bold text-white">Top Recommendations:</h4>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                {result.recommendations.map((rec: string, i: number) => <li key={i}>{rec}</li>)}
                            </ul>
                        </ResultCard>
                    )}
                    {!isLoading && !result && (
                         <div className="text-center py-16">
                            <p className="text-dark-text-secondary">Results from your SEO analysis will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SEOPage;