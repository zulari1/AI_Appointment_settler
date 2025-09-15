import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as supportService from '../../services/supportService';

const MotionDiv = motion.div as any;

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState({ reviewMode: true, toneStyle: "Friendly", autoEscalate: false, notifyTelegram: true });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await supportService.saveSettings({ ...settings, userEmail: 'demo@zulari.app' });
            onClose();
        } catch (e: any) {
            console.error("Save failed:", e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                     <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                     <MotionDiv initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-dark-card rounded-xl border border-dark-border z-50 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Support AI Settings</h2>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between text-sm">
                                <span>Require Human Review for AI Drafts</span>
                                <input type="checkbox" checked={settings.reviewMode} onChange={e => setSettings(s => ({...s, reviewMode: e.target.checked}))} className="h-4 w-4 rounded text-brand-primary" />
                            </label>
                             <label className="flex items-center justify-between text-sm">
                                <span>Auto-escalate on urgent keywords</span>
                                <input type="checkbox" checked={settings.autoEscalate} onChange={e => setSettings(s => ({...s, autoEscalate: e.target.checked}))} className="h-4 w-4 rounded text-brand-primary" />
                            </label>
                            <label className="flex items-center justify-between text-sm">
                                <span>Tone & Style</span>
                                <select value={settings.toneStyle} onChange={e => setSettings(s => ({...s, toneStyle: e.target.value}))} className="bg-dark-bg p-1 rounded border border-dark-border">
                                    <option>Friendly</option>
                                    <option>Professional</option>
                                    <option>Empathetic</option>
                                    <option>Concise</option>
                                </select>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={onClose} className="bg-dark-bg hover:bg-dark-border px-4 py-2 text-sm rounded-lg">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="bg-brand-primary hover:bg-indigo-500 px-4 py-2 text-sm rounded-lg text-white">
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                     </MotionDiv>
                 </div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;