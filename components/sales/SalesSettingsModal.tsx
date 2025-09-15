import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as salesService from '../../services/salesService';

const MotionDiv = motion.div as any;

interface SalesSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SalesSettingsModal: React.FC<SalesSettingsModalProps> = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState({
        autoBookIfAvailable: true,
        defaultMeetingLengthMins: 30,
        timeZone: "Europe/Berlin",
        confidenceThreshold: 85
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await salesService.saveSettings({ ...settings, action: 'save_settings', userEmail: 'demo@zulari.app' });
            onClose();
        } catch (e: any) {
            console.error("Save settings failed:", e);
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
                        <h2 className="text-xl font-bold text-white mb-4">Sales AI Settings</h2>
                        <div className="space-y-4 text-sm">
                            <label className="flex items-center justify-between">
                                <span>Auto-book if calendar available</span>
                                <input type="checkbox" checked={settings.autoBookIfAvailable} onChange={e => setSettings(s => ({...s, autoBookIfAvailable: e.target.checked}))} className="h-4 w-4 rounded text-brand-primary" />
                            </label>
                            <label className="flex items-center justify-between">
                                <span>Default Meeting Length (mins)</span>
                                <input type="number" value={settings.defaultMeetingLengthMins} onChange={e => setSettings(s => ({...s, defaultMeetingLengthMins: +e.target.value}))} className="w-20 bg-dark-bg p-1 rounded border border-dark-border" />
                            </label>
                             <label className="flex items-center justify-between">
                                <span>Confidence Threshold (%)</span>
                                <input type="number" min="50" max="100" value={settings.confidenceThreshold} onChange={e => setSettings(s => ({...s, confidenceThreshold: +e.target.value}))} className="w-20 bg-dark-bg p-1 rounded border border-dark-border" />
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

export default SalesSettingsModal;