import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SubPageHeaderProps {
    title: string;
    icon: React.ReactNode;
    actions?: React.ReactNode;
}

const SubPageHeader: React.FC<SubPageHeaderProps> = ({ title, icon, actions }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-brand-accent">{icon}</span>
                <span>{title}</span>
            </h1>
            <div className="flex items-center gap-2">
                {actions}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-dark-card hover:bg-dark-border text-dark-text-secondary font-semibold py-2 px-4 rounded-lg transition-colors border border-dark-border"
                    aria-label="Go back to the previous page"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    <span>Back</span>
                </button>
            </div>
        </div>
    );
};

export default SubPageHeader;
