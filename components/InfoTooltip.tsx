import React, { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
    what: string;
    how: string;
    benefit: string;
    onTryExample?: () => void;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ what, how, benefit, onTryExample }) => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef<HTMLDivElement>(null);

    const handleClickOutside = (e: MouseEvent) => {
        if (node.current && node.current.contains(e.target as Node)) {
            return;
        }
        setIsOpen(false);
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleTryExample = () => {
        if (onTryExample) {
            onTryExample();
        }
        setIsOpen(false);
    };

    return (
        <div ref={node} className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center h-5 w-5 bg-dark-border text-dark-text-secondary rounded-full text-xs font-bold hover:bg-brand-primary hover:text-white transition-colors"
                aria-label="More information"
            >
                !
            </button>
            {isOpen && (
                <div className="absolute z-10 bottom-full mb-2 w-72 bg-dark-bg border border-dark-border rounded-lg shadow-xl p-4 animate-fade-in right-0 transform translate-x-1/2 md:translate-x-0 md:right-auto md:left-0">
                    <p className="font-bold text-white">What is this?</p>
                    <p className="text-sm text-dark-text-secondary mb-2">{what}</p>
                    
                    <p className="font-bold text-white">How it works</p>
                    <p className="text-sm text-dark-text-secondary mb-2">{how}</p>
                    
                    <p className="font-bold text-white">Benefit for you</p>
                    <p className="text-sm text-dark-text-secondary">{benefit}</p>

                    {onTryExample && (
                        <div className="mt-4 border-t border-dark-border pt-2">
                            <button onClick={handleTryExample} className="w-full text-center bg-brand-primary/50 hover:bg-brand-primary text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors">
                                Run Example
                            </button>
                        </div>
                    )}
                    <div className="absolute bottom-[-5px] left-4 h-2.5 w-2.5 bg-dark-bg border-b border-r border-dark-border transform rotate-45"></div>
                </div>
            )}
        </div>
    );
};

export default InfoTooltip;