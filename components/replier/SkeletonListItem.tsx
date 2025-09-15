import React from 'react';

const SkeletonListItem: React.FC = () => {
    return (
        <div className="bg-dark-bg border border-dark-border rounded-lg p-3 h-[72px] flex items-center gap-3 animate-pulse">
            <div className="w-2 h-10 rounded-full bg-dark-border flex-shrink-0"></div>
            <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-dark-border rounded w-3/4"></div>
                <div className="h-3 bg-dark-border rounded w-full"></div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end space-y-2">
                <div className="h-3 bg-dark-border rounded w-10"></div>
                <div className="h-3 bg-dark-border rounded w-16"></div>
            </div>
        </div>
    );
};

export default SkeletonListItem;