import React from 'react';

const SkeletonListItem: React.FC = () => {
    return (
        <div className="w-full text-left p-3 flex items-center gap-4 bg-dark-bg rounded-lg animate-pulse">
            <div className="w-2 h-10 rounded-full flex-shrink-0 bg-dark-border"></div>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                    <div className="h-4 bg-dark-border rounded w-1/2"></div>
                    <div className="h-3 bg-dark-border rounded w-12"></div>
                </div>
                <div className="h-3 bg-dark-border rounded w-full mt-2"></div>
                 <div className="flex items-center gap-4 mt-2">
                    <div className="h-3 bg-dark-border rounded w-16"></div>
                    <div className="h-3 bg-dark-border rounded w-20"></div>
                </div>
            </div>
            <div className="w-5 h-5 bg-dark-border rounded-full flex-shrink-0"></div>
        </div>
    );
};

export default SkeletonListItem;