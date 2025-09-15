import React, { useState } from 'react';
import * as supportService from '../../services/supportService';
import ActionNotification from '../ActionNotification';

const TrainingCenter: React.FC = () => {
    const [trainingName, setTrainingName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [dataType, setDataType] = useState('FAQs');
    const [dataContent, setDataContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const qualityScore = Math.min(100, Math.round(dataContent.length / 50));
    const qualityColor = qualityScore > 75 ? 'text-green-400' : qualityScore > 45 ? 'text-amber-400' : 'text-red-400';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trainingName.trim() || !companyName.trim() || !dataContent.trim()) {
            setNotification({ message: "All fields are required.", type: 'error' });
            return;
        }
        if (qualityScore < 45) {
            if (!window.confirm("Data quality seems low. This may lead to poor AI performance. Proceed anyway?")) {
                return;
            }
        }

        setIsSubmitting(true);
        setNotification(null);
        try {
            const res = await supportService.trainSupport({
                userEmail: "demo@zulari.app",
                trainingName,
                companyName,
                dataType,
                dataContent,
                tags: ['support', dataType.toLowerCase()]
            });
            setNotification({ message: `Training job queued! (ID: ${res.jobId}) You'll be notified when it's complete.`, type: 'success' });
            // Reset form
            setTrainingName('');
            setCompanyName('');
            setDataContent('');
        } catch (err: any) {
            setNotification({ message: `Training failed: ${err.message}`, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <div className="lg:col-span-2">
                <h2 className="text-xl font-bold text-white mb-2">Teach Sally to sound like your brand.</h2>
                <p className="text-dark-text-secondary text-sm mb-4">Provide new documents, FAQs, or past replies to improve AI accuracy.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={trainingName} onChange={e => setTrainingName(e.target.value)} required placeholder="Training Name (e.g., Q4 Pricing)" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm"/>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Your Company Name" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm"/>
                    </div>
                    <select value={dataType} onChange={e => setDataType(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm">
                        <option>FAQs</option>
                        <option>Past Replies</option>
                        <option>Product Details</option>
                        <option>Tone Guide</option>
                    </select>
                    <textarea value={dataContent} onChange={e => setDataContent(e.target.value)} required rows={8} placeholder="Paste your training content here..." className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm font-mono"/>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-brand-secondary hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-slate-600">
                        {isSubmitting ? 'Submitting...' : 'Queue Training'}
                    </button>
                </form>
            </div>
            <div className="bg-dark-bg p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-white text-center">Quality Meter</h3>
                <div className="text-center">
                    <p className={`text-4xl font-bold ${qualityColor}`}>{qualityScore}</p>
                    <p className="text-xs text-dark-text-secondary">A higher score means better AI replies.</p>
                </div>
                <ul className="text-xs text-dark-text-secondary space-y-2">
                    <li>✅ Add at least 10 lines of text.</li>
                    <li>✅ Ensure examples are clear.</li>
                    <li>✅ Check for typos.</li>
                </ul>
            </div>
        </div>
    );
};

export default TrainingCenter;