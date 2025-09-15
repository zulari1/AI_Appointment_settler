import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InfoTooltip from '../InfoTooltip';
import { ICONS } from '../../constants';
import * as replierService from '../../services/replierService';

const MotionDiv = motion.div as any;

interface ReplierSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: any) => void;
    initialSettings: { on: boolean, threshold: number };
}

const TrainReplierForm: React.FC = () => {
    const [trainingName, setTrainingName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [content, setContent] = useState('');
    const [isTraining, setIsTraining] = useState(false);
    const [jobId, setJobId] = useState<string|null>(null);

    const handleTrain = async () => {
        setIsTraining(true);
        setJobId(null);
        try {
            // FIX: The call to trainReplier was incorrect. It used `source` and `content` instead of the expected
            // properties like `trainingName`, `companyName`, `dataType`, and `dataContent`.
            // Added missing form fields and corrected the payload to match the service function signature.
            const res = await replierService.trainReplier({
                userEmail: "demo@zulari.app",
                trainingName: trainingName,
                companyName: companyName,
                dataType: content.startsWith('http') ? 'URL' : 'Text',
                dataContent: content,
                qualityScore: Math.min(100, Math.round(content.length / 50)),
            });
            setJobId(res.jobId);
        } catch (e) {
            console.error(e);
        } finally {
            setIsTraining(false);
        }
    }

    return (
        <div className="space-y-2">
            <h3 className="text-md font-bold text-white">Train Replier</h3>
            <input type="text" value={trainingName} onChange={e => setTrainingName(e.target.value)} placeholder="Training Name (e.g., Q1 FAQs)" className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border" />
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border" />
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Paste training text or a URL..." className="w-full bg-dark-bg p-2 rounded text-sm border border-dark-border" />
            <button type="button" onClick={handleTrain} disabled={isTraining || !content.trim() || !trainingName.trim() || !companyName.trim()} className="w-full bg-brand-secondary/80 hover:bg-brand-secondary text-white font-bold py-2 rounded text-sm disabled:bg-slate-600">
                {isTraining ? 'Training...' : 'Start Training'}
            </button>
            {jobId && <p className="text-xs text-green-400">Training job queued: {jobId}</p>}
        </div>
    );
}

const ReplierSettingsModal: React.FC<ReplierSettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
    const [settings, setSettings] = useState({ 
        autoReplyOn: initialSettings.on, 
        confidenceThreshold: initialSettings.threshold, 
        notifyEmailOnEscalation: true 
    });

    useEffect(() => {
        setSettings({
            autoReplyOn: initialSettings.on,
            confidenceThreshold: initialSettings.threshold,
            notifyEmailOnEscalation: true
        });
    }, [initialSettings, isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <MotionDiv initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-lg w-full">
                    <h2 className="text-xl font-bold text-white mb-4">Replier Settings</h2>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between">
                            <span className="text-sm flex items-center gap-2">
                                Auto-Reply
                                <InfoTooltip 
                                    what="Auto-approve high confidence replies." 
                                    how="Marks replies as 'completed' if AI confidence is above your threshold." 
                                    benefit="Saves time on low-risk queries." 
                                />
                            </span>
                            <input type="checkbox" checked={settings.autoReplyOn} onChange={e => setSettings(s=>({...s, autoReplyOn: e.target.checked}))} />
                        </label>
                        <label className="flex items-center justify-between">
                            <span className="text-sm">Confidence Threshold (%)</span>
                            <input type="number" min="50" max="100" value={settings.confidenceThreshold} onChange={e => setSettings(s=>({...s, confidenceThreshold: +e.target.value}))} className="w-20 bg-dark-bg border border-dark-border rounded p-1 text-sm" />
                        </label>
                         <div className="border-t border-dark-border pt-4">
                            <TrainReplierForm />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={onClose} className="bg-dark-bg hover:bg-dark-border px-4 py-2 text-sm rounded-lg">Cancel</button>
                        <button onClick={() => onSave(settings)} className="bg-brand-primary hover:bg-indigo-500 px-4 py-2 text-sm rounded-lg">
                            Save
                        </button>
                    </div>
                </MotionDiv>
            </div>
        </AnimatePresence>
    );
};

export default ReplierSettingsModal;
