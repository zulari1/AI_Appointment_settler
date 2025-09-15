import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { SupportRow } from '../../types';

const MotionDiv = motion.div as any;

interface SupportDetailDrawerProps {
    row: SupportRow | null;
    onClose: () => void;
    onAction: (action: "approve" | "escalate", row: SupportRow, notes?: string) => void;
}interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}


const DetailSection: React.FC<DetailSectionProps> = ({ title, children, defaultOpen = true }) => (
    <details className="py-2 border-b border-dark-border last:border-b-0" open={defaultOpen}>
        <summary className="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            {title}
            <svg className="w-4 h-4 text-dark-text-secondary transition-transform transform details-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </summary>
        <div className="pt-2 text-sm text-dark-text-secondary prose prose-sm prose-invert max-w-none">{children}</div>
    </details>
);

const SupportDetailDrawer: React.FC<SupportDetailDrawerProps> = ({ row, onClose, onAction }) => {
    const [escalateReason, setEscalateReason] = useState('');
    const [isEscalating, setIsEscalating] = useState(false);

    useEffect(() => {
        if (!row) {
            setIsEscalating(false);
            setEscalateReason('');
        }
    }, [row]);

    const handleEscalate = () => {
        if (row) {
            onAction('escalate', row, escalateReason);
            setIsEscalating(false);
            setEscalateReason('');
        }
    };
    
    return (
        <AnimatePresence>
            {row && (
                <>
                    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <MotionDiv 
                        initial={{ x: '100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '100%' }} 
                        transition={{ type: "spring", stiffness: 300, damping: 30 }} 
                        className="fixed top-0 right-0 h-full w-full max-w-lg bg-dark-card border-l border-dark-border z-50 flex flex-col"
                        aria-modal="true"
                        role="dialog"
                    >
                        <header className="p-4 border-b border-dark-border flex-shrink-0 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-white truncate">{row['Inquiry Topic']}</h3>
                                <p className="text-sm text-dark-text-secondary">{row['Customer Name']} • <span className="font-mono text-xs">{row['Contact ID']}</span></p>
                            </div>
                            <button onClick={onClose} aria-label="Close panel" className="p-1 rounded-full hover:bg-dark-border">&times;</button>
                        </header>
                        <main className="flex-1 p-4 overflow-y-auto space-y-2">
                             <DetailSection title="AI Draft">
                                <div className="bg-dark-bg p-3 rounded-lg mt-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(row['Draft Email Body']) }} />
                            </DetailSection>
                             <DetailSection title="Original Message">
                                <p className="bg-dark-bg p-3 rounded-lg mt-1 whitespace-pre-wrap">{row['Inquiry Body']}</p>
                            </DetailSection>
                             <DetailSection title="History & Logs">
                                <p><strong>CRM Notes:</strong> {row['CRM Notes'] || 'N/A'}</p>
                                <p><strong>AI Reasoning:</strong> {row.Reasoning || 'N/A'}</p>
                                <p><strong>Processed At:</strong> {row['Processed At'] ? new Date(row['Processed At']).toLocaleString() : 'N/A'}</p>
                            </DetailSection>
                        </main>
                        <footer className="p-3 border-t border-dark-border flex-shrink-0 space-y-2 bg-dark-card sticky bottom-0">
                            {isEscalating ? (
                                <div>
                                    <textarea value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} placeholder="Reason for escalation (required)..." rows={2} className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border"/>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => setIsEscalating(false)} className="flex-1 bg-dark-bg hover:bg-dark-border py-2 rounded text-sm">Cancel</button>
                                        <button onClick={handleEscalate} disabled={!escalateReason.trim()} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded text-sm disabled:bg-gray-500">Confirm Escalation</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => onAction('approve', row)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-sm">✅ Send My Response</button>
                                    <button onClick={() => setIsEscalating(true)} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded text-sm">⚠️ I'll Handle This</button>
                                </div>
                            )}
                            <p className="text-xs text-dark-text-secondary text-center">Approving here will mark the item in the sheet and send a prepared email to the customer via email — you will also receive the full outbound draft by email to confirm.</p>
                        </footer>
                    </MotionDiv>
                </>
            )}
        </AnimatePresence>
    );
};

export default SupportDetailDrawer;