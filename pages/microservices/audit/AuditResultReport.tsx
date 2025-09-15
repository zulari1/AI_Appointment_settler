

import React, { useEffect, useMemo } from 'react';

interface AuditResultReportProps {
    htmlContent: string;
    onReset: () => void;
}

const AuditResultReport: React.FC<AuditResultReportProps> = ({ htmlContent, onReset }) => {
    const { bodyContent, styleContent } = useMemo(() => {
        if (!htmlContent) return { bodyContent: '', styleContent: '' };
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, "text/html");
            const bodyContent = doc.body.innerHTML;
            const styleContent = Array.from(doc.querySelectorAll('style')).map(style => style.innerHTML).join('\n');
            return { bodyContent, styleContent };
        } catch (e) {
            console.error("Failed to parse HTML content", e);
            return { bodyContent: '<p>Error: Could not display report.</p>', styleContent: '' };
        }
    }, [htmlContent]);

    useEffect(() => {
        if (!styleContent) return;

        const styleElement = document.createElement('style');
        styleElement.innerHTML = styleContent;
        styleElement.setAttribute('data-injected-from', 'AuditResultReport');
        
        // Prevent duplicate styles
        const existingStyle = document.head.querySelector('style[data-injected-from="AuditResultReport"]');
        if (existingStyle) {
            existingStyle.innerHTML = styleContent; // Update existing style
        } else {
            document.head.appendChild(styleElement);
        }
        
        return () => {
            const styleToRemove = document.head.querySelector('style[data-injected-from="AuditResultReport"]');
            if (styleToRemove) {
                document.head.removeChild(styleToRemove);
            }
        };
    }, [styleContent]);

    return (
        <div className="w-full mx-auto animate-fade-in space-y-6">
             <div 
                className="bg-white text-gray-800 p-0 rounded-xl border border-dark-border shadow-lg max-w-none"
             >
                <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
             </div>
            <footer className="text-center">
                <button 
                    onClick={onReset} 
                    className="bg-dark-card border border-dark-border hover:bg-dark-border text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Request a New Audit
                </button>
            </footer>
        </div>
    );
};

export default AuditResultReport;