import React from 'react';

interface ProcessingAnimationProps {
    message: string;
}

const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-dark-bg rounded-lg h-full animate-fade-in">
            <div className="relative flex items-center justify-center h-16 w-16">
                <div className="absolute h-full w-full bg-brand-primary/20 rounded-full animate-ping"></div>
                <div className="relative h-12 w-12 bg-brand-primary rounded-full flex items-center justify-center text-white">
                    🤖
                </div>
            </div>
            <p className="mt-4 font-semibold text-white">Your AI is working...</p>
            <p className="text-sm text-dark-text-secondary">{message}</p>
        </div>
    );
};

export default ProcessingAnimation;