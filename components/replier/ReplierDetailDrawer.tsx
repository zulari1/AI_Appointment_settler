import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { ReplierRow } from '../../types';

const MotionDiv = motion.div as any;

interface ReplierDetailDrawerProps {
    row: ReplierRow | null;
    onClose: () => void;
    onUpdateAction: (action: "approve" | "decline", row: ReplierRow) => void;
}interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}


const DetailSection: React.FC<DetailSectionProps> = ({ title, children, defaultOpen = true }) => (
    <details className="py-2 border-b border-dark-border" open={defaultOpen}>
        <summary className="font-semibold text-white cursor-pointer list-none flex justify-between items-center">
            {title}
            <svg className="w-4 h-4 text-dark-text-secondary transition-transform transform details-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </summary>
        <div className="pt-2 text-sm text-dark-text-secondary">{children}</div>
    </details>
);

const ReplierDetailDrawer: React.FC<ReplierDetailDrawerProps> = ({ row, onClose, onUpdateAction }) => {
    
    const handleAction = (action: "approve" | "decline") => {
        if (!row) return;
        onUpdateAction(action, row);
        onClose();
    };
    
    if (!row) return null;
    
    return (
        <AnimatePresence>
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
            <MotionDiv initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", stiffness: 260, damping: 30 }} className="fixed top-0 right-0 h-full w-full max-w-lg bg-dark-card border-l border-dark-border z-50 flex flex-col">
                <header className="p-4 border-b border-dark-border flex-shrink-0">
                    <h3 className="font-bold text-white truncate">{String(row['Subject/Title'] || '')}</h3>
                    <p className="text-sm text-dark-text-secondary">{String(row['User Name'] || '')}</p>
                </header>
                <main className="flex-1 p-4 overflow-y-auto space-y-2">
                    <DetailSection title="AI Output">
                        <div className="bg-dark-bg p-3 rounded-lg mt-1 text-sm whitespace-pre-wrap prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(row['AI Action/Response'] || '')) }} />
                    </DetailSection>
                    <DetailSection title="Original Message">
                        <div className="bg-dark-bg p-3 rounded-lg mt-1 text-sm whitespace-pre-wrap">{String(row['Original Message/Content'] || '')}</div>
                    </DetailSection>
                    <DetailSection title="History & Notes">
                        <p><strong>Human Response:</strong> {String(row['Human Response'] || 'N/A')}</p>
                        <p><strong>Notes:</strong> {String(row['Notes/Comments'] || 'N/A')}</p>
                    </DetailSection>
                </main>
                <footer className="p-3 border-t border-dark-border flex-shrink-0 space-y-2">
                    <div className="flex gap-2">
                        <button onClick={() => handleAction('approve')} className="flex-1 bg-green-500/80 hover:bg-green-500 text-white font-bold py-2 rounded text-sm">✅ Approve</button>
                        <button onClick={() => handleAction('decline')} className="flex-1 bg-red-500/80 hover:bg-red-500 text-white font-bold py-2 rounded text-sm">❌ Decline</button>
                    </div>
                </footer>
            </MotionDiv>
        </AnimatePresence>
    );
};

export default ReplierDetailDrawer;