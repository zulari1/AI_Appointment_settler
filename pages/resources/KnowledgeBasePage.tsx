import React, { useState, FormEvent } from 'react';
import { ICONS } from '../../constants';
import * as n8n from '../../services/n8nService';
import SubPageHeader from '../../components/SubPageHeader';
import ActionNotification from '../../components/ActionNotification';
import InfoTooltip from '../../components/InfoTooltip';
import ProcessingAnimation from '../../components/ProcessingAnimation';
import ResultCard from '../../components/ResultCard';

const KnowledgeBasePage: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [result, setResult] = useState<{ query: string; answer: string } | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setResult(null);
        setNotification(null);

        try {
            const response = await n8n.getKnowledgeBaseAnswer(query);
            setResult({ query, answer: response.output });
        } catch (err: any) {
            setNotification({ message: err.message || 'Failed to get an answer.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SubPageHeader title="AI Knowledge Base" icon={ICONS.knowledgeBase} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Input Form */}
                <div className="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        Ask a Question
                        <InfoTooltip 
                            what="This is an AI-powered help center."
                            how="Ask any question about our services, features, or best practices. The AI will search our entire knowledge base to find the most relevant answer, guide, or tutorial."
                            benefit="Get instant, accurate support 24/7 without having to search through documentation manually."
                        />
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="kb-query" className="block text-sm font-medium text-dark-text-secondary mb-1">Your Question</label>
                            <textarea
                                id="kb-query"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="e.g., How do I train the Sales AI?"
                                className="w-full bg-dark-bg border border-dark-border rounded-lg p-3"
                                rows={4}
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:bg-slate-600" disabled={isLoading || !query.trim()}>
                            {isLoading ? 'Searching...' : 'Get Answer'}
                        </button>
                    </form>
                </div>

                {/* Output Pane */}
                <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6 min-h-[400px]">
                    <h2 className="text-xl font-bold text-white mb-4">AI Response</h2>
                    {isLoading && <ProcessingAnimation message="Searching our guides and tutorials..." />}
                    {result && (
                        <ResultCard title={`Regarding: "${result.query}"`}>
                            <p className="whitespace-pre-wrap">{result.answer}</p>
                        </ResultCard>
                    )}
                    {!isLoading && !result && (
                         <div className="text-center py-16 flex flex-col items-center">
                            <span className="text-4xl mb-4">🤖</span>
                            <p className="text-dark-text-secondary">Answers from our AI will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBasePage;