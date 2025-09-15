import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { SalesRow } from '../../types';
import { ICONS } from '../../constants';

const MotionDiv = motion.div as any;

interface SalesDetailDrawerProps {
    row: SalesRow | null;
    onClose: () => void;
    onAction: (rowNumber: number, updates: Partial<SalesRow>) => void;
}

const MeetingModal: React.FC<{ row: SalesRow, onSave: (updates: Partial<SalesRow>) => void, onCancel: () => void }> = ({ row, onSave, onCancel }) => {
    const [details, setDetails] = useState({
        date: '', time: '', link: '', attendees: row.Attendees || row["Customer Name"]
    });

    const handleSave = () => {
        onSave({
            "Meeting Booked": "Yes",
            "Meeting Date": details.date,
            "Meeting Time": details.time,
            "Meeting Link": details.link,
            "Attendees": details.attendees,
            "Status": "Resolved",
            "Outcome": "Meeting Booked",
            "Processed At": new Date().toISOString()
        });
    };

    return (
        <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-dark-card border border-dark-border rounded-lg p-6 w-full max-w-sm space-y-4">
                <h4 className="font-bold text-white">Book Meeting with {row["Customer Name"]}</h4>
                <input type="date" value={details.date} onChange={e => setDetails(d => ({ ...d, date: e.target.value }))} className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm" />
                <input type="time" value={details.time} onChange={e => setDetails(d => ({ ...d, time: e.target.value }))} className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm" />
                <input type="url" value={details.link} onChange={e => setDetails(d => ({ ...d, link: e.target.value }))} placeholder="Meeting Link" className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm" />
                <input type="text" value={details.attendees} onChange={e => setDetails(d => ({ ...d, attendees: e.target.value }))} placeholder="Attendees" className="w-full bg-dark-bg border border-dark-border rounded p-2 text-sm" />
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="bg-dark-bg hover:bg-dark-border px-3 py-1.5 rounded text-sm">Cancel</button>
                    <button onClick={handleSave} className="bg-brand-primary hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-sm font-semibold">Save</button>
                </div>
            </div>
        </div>
    );
};

const SalesDetailDrawer: React.FC<SalesDetailDrawerProps> = ({ row, onClose, onAction }) => {
    const [showMeetingModal, setShowMeetingModal] = useState(false);

    useEffect(() => {
        if (!row) setShowMeetingModal(false);
    }, [row]);

    const handleAction = (updates: Partial<SalesRow>) => {
        if (row) onAction(row.rowNumber, updates);
    };

    return (
        <AnimatePresence>
            {row && (
                <>
                    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
                    <MotionDiv 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
                        transition={{ type: "spring", stiffness: 300, damping: 30 }} 
                        className="fixed top-0 right-0 h-full w-full max-w-lg bg-dark-card border-l border-dark-border z-50 flex flex-col"
                    >
                        <header className="p-4 border-b border-dark-border flex-shrink-0 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-white">{row["Customer Name"]}</h3>
                                <p className="text-sm text-dark-text-secondary">{row["Customer Email"]}</p>
                            </div>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-dark-border text-2xl leading-none">&times;</button>
                        </header>
                        <main className="flex-1 p-4 overflow-y-auto space-y-4">
                            <h4 className="font-bold text-white">Draft Email</h4>
                            <div className="bg-dark-bg p-3 rounded-lg prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(row["Draft Email"]) }} />
                            
                            {row.meetingBooked && (
                                <div>
                                    <h4 className="font-bold text-white">Meeting Details</h4>
                                    <div className="bg-dark-bg p-3 rounded-lg space-y-1 text-sm">
                                        <p><strong>Date:</strong> {row["Meeting Date"]}</p>
                                        <p><strong>Time:</strong> {row["Meeting Time"]}</p>
                                        <p><strong>Attendees:</strong> {row.Attendees}</p>
                                        <a href={row["Meeting Link"]} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Open Meeting Link</a>
                                    </div>
                                </div>
                            )}
                        </main>
                        <footer className="p-3 border-t border-dark-border flex-shrink-0 space-y-2 relative">
                             <div className="flex gap-2">
                                {!row.meetingBooked && (
                                     <button onClick={() => setShowMeetingModal(true)} className="flex-1 bg-brand-secondary hover:bg-emerald-500 text-white font-bold py-2 rounded text-sm">Mark Meeting Booked</button>
                                )}
                                <button onClick={() => handleAction({ Status: 'Resolved', Approval: 'Yes', Outcome: 'Approved' })} className="flex-1 bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2 rounded text-sm">Approve & Complete</button>
                                {!row.isEscalated && (
                                    <button onClick={() => handleAction({ Escalation: 'Yes', Status: 'Escalated' })} className="bg-amber-600 hover:bg-amber-500 text-white font-bold p-2 rounded text-sm" title="Escalate">
                                        {React.cloneElement(ICONS.warning, { className: 'h-4 w-4' })}
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-dark-text-secondary text-center">After Approve, an automated email will be sent to the customer.</p>
                            
                            {showMeetingModal && (
                                <MeetingModal 
                                    row={row} 
                                    onCancel={() => setShowMeetingModal(false)}
                                    onSave={(updates) => {
                                        handleAction(updates);
                                        setShowMeetingModal(false);
                                    }} 
                                />
                            )}
                        </footer>
                    </MotionDiv>
                </>
            )}
        </AnimatePresence>
    );
};

export default SalesDetailDrawer;