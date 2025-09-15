
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead } from '../types';
import { ICONS } from '../constants';

const MotionDiv = motion.div as any;

interface ResearchReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportHtml: string;
    lead: Lead | null;
}

const extractSection = (html: string, title: string): string | null => {
    if (!html) return null;
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const h2s = Array.from(doc.querySelectorAll('h2, h3'));
        const targetH2 = h2s.find(h => h.textContent?.trim().toLowerCase().includes(title.toLowerCase()));
        if (!targetH2) return null;

        let content = '';
        let nextSibling = targetH2.nextElementSibling;
        while (nextSibling && !['H2', 'H3'].includes(nextSibling.tagName.toUpperCase())) {
            content += nextSibling.outerHTML;
            nextSibling = nextSibling.nextElementSibling;
        }
        return content.trim() || `<p>No content found for this section.</p>`;
    } catch (e) {
        console.error("Error parsing HTML for section extraction:", e);
        return `<p>Error parsing report section.</p>`;
    }
};interface SectionProps {
  title: string;
  content: string | null | undefined;
  icon?: React.ReactNode;
}


const Section: React.FC<SectionProps> = ({ title, content, icon }) => {
    if (!content) return <p className="text-dark-text-secondary text-center py-8">No data available for this section.</p>;
    return (
         <div className="py-3">
            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">{icon} {title}</h4>
            <div className="prose prose-sm prose-invert max-w-none text-dark-text" dangerouslySetInnerHTML={{ __html: content }}/>
        </div>
    )
}

const ResearchReportModal: React.FC<ResearchReportModalProps> = ({ isOpen, onClose, reportHtml, lead }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState('full');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            setActiveTab('full'); // Reset to default tab on open
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const strengths = extractSection(reportHtml, 'Strengths');
    const weaknesses = extractSection(reportHtml, 'Weaknesses');
    const painPoints = extractSection(reportHtml, 'Pain Points');
    const solutions = extractSection(reportHtml, 'Solutions');

    const tabs = [
        { id: 'full', label: 'Full Report' },
        { id: 'strengths', label: 'Strengths & Weaknesses' },
        { id: 'pain', label: 'Pain Points & Solutions' },
    ];
    
    return (
        <AnimatePresence>
            {isOpen && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60" onClick={onClose} />
                    <MotionDiv ref={modalRef} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-3xl bg-dark-card flex flex-col z-50 rounded-xl border border-dark-border max-h-[90vh]">
                        <header className="p-4 flex items-start justify-between border-b border-dark-border flex-shrink-0">
                            <div>
                                <h2 id="modal-title" className="text-lg font-bold text-white">Research Report: {lead?.FullName}</h2>
                                <p className="text-sm text-dark-text-secondary">{lead?.['Job Title']} • {lead?.['Company Name']}</p>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-md hover:bg-dark-border" aria-label="Close">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </header>
                        
                        <div className="p-4 bg-dark-bg/50 border-b border-dark-border flex-shrink-0">
                             <label className="text-xs font-semibold text-dark-text-secondary mr-2">How will you use this research?</label>
                             <select className="bg-dark-border text-xs p-1 rounded-md focus:ring-brand-primary">
                                <option>Cold Email</option>
                                <option>LinkedIn Outreach</option>
                                <option>Internal Team Training</option>
                            </select>
                        </div>
                        
                        <div className="p-4 border-b border-dark-border flex-shrink-0">
                            <nav className="flex space-x-2">
                                {tabs.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${activeTab === tab.id ? 'bg-brand-primary text-white' : 'bg-dark-bg hover:bg-dark-border'}`}>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {activeTab === 'full' && <Section title="" content={reportHtml} />}
                            {activeTab === 'strengths' && (
                                <>
                                    <Section title="Strengths" content={strengths} />
                                    <Section title="Weaknesses" content={weaknesses} />
                                </>
                            )}
                            {activeTab === 'pain' && (
                                <>
                                    <Section title="Pain Points" content={painPoints} />
                                    <Section title="Solutions" content={solutions} />
                                </>
                            )}
                        </div>

                        <footer className="p-4 bg-dark-bg border-t border-dark-border flex items-center justify-end gap-2 flex-shrink-0">
                             <button className="bg-dark-border text-sm hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">Download PDF</button>
                             <button className="bg-dark-border text-sm hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">Copy to Clipboard</button>
                             <button className="bg-brand-secondary/80 text-sm hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md">Share with Team</button>
                        </footer>
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ResearchReportModal;
