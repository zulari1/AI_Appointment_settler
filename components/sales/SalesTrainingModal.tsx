import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as salesService from '../../services/salesService';

const MotionDiv = motion.div as any;

interface SalesTrainingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SalesTrainingModal: React.FC<SalesTrainingModalProps> = ({ isOpen, onClose }) => {
    const [content, setContent] = useState('');
    const [dataType, setDataType] = useState('Past Replies');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setJobId(null);
        try {
            const res = await salesService.train({
                action: 'train',
                userEmail: 'demo@zulari.app',
                company: 'ACME Ltd',
                dataType,
                content,
                tags: ['sales', dataType.toLowerCase()]
            });
            setJobId(res.jobId);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setContent('');
        setJobId(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60" onClick={handleClose} />
                    <MotionDiv initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-lg bg-dark-card rounded-xl border border-dark-border z-50 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Train Sales AI</h2>
                        {jobId ? (
                             <div className="text-center py-8">
                                <p className="text-4xl mb-4">✅</p>
                                <h3 className="font-bold text-white">Training Queued!</h3>
                                <p className="text-sm text-dark-text-secondary">Job ID: {jobId}</p>
                                <button onClick={handleClose} className="mt-4 bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg">Close</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <select value={dataType} onChange={e => setDataType(e.target.value)} className="w-full bg-dark-bg p-2 rounded border border-dark-border text-sm">
                                    <option>Past Replies</option><option>Product Docs</option><option>Sales Scripts</option>
                                </select>
                                <textarea value={content} onChange={e => setContent(e.target.value)} rows={10} placeholder="Paste training content..." className="w-full bg-dark-bg p-2 rounded border border-dark-border text-sm font-mono" />
                                <div className="flex justify-end gap-2">
                                    <button onClick={handleClose} className="bg-dark-bg hover:bg-dark-border px-4 py-2 text-sm rounded-lg">Cancel</button>
                                    <button onClick={handleSubmit} disabled={isSubmitting || !content.trim()} className="bg-brand-secondary hover:bg-emerald-500 text-white px-4 py-2 text-sm rounded-lg font-semibold disabled:bg-slate-600">
                                        {isSubmitting ? 'Submitting...' : 'Queue Training'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SalesTrainingModal;