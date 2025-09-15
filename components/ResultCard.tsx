import React from 'react';

interface ResultCardProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, children, actions }) => {
    return (
        <div className="bg-dark-card border border-dark-border rounded-xl animate-fade-in">
            <div className="p-6">
                <div className={`flex items-center justify-between ${actions ? 'border-b border-dark-border pb-4 mb-4' : ''}`}>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-dark-text-secondary">
                    {children}
                </div>
            </div>
            {actions && (
                <div className="bg-dark-bg rounded-b-xl px-6 py-4 flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default ResultCard;