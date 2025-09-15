import React, { useState, useEffect, useMemo } from 'react';
import * as n8n from '../../services/n8nService';
import { EmailTemplate } from '../../types';
import { ICONS } from '../../constants';
import SubPageHeader from '../../components/SubPageHeader';
import ActionNotification from '../../components/ActionNotification';
import InfoTooltip from '../../components/InfoTooltip';

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const PlaceholderGuide: React.FC = () => {
    const placeholders = ['{{firstName}}', '{{lastName}}', '{{fullName}}', '{{company}}', '{{title}}', '{{email}}'];
    const [copied, setCopied] = useState('');

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(''), 2000);
    };

    return (
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2 text-sm">Placeholders</h4>
            <div className="grid grid-cols-2 gap-2">
                {placeholders.map(p => (
                    <button key={p} onClick={() => handleCopy(p)} className="flex items-center justify-between text-left text-xs bg-dark-border/50 hover:bg-dark-border px-2 py-1 rounded-md">
                        <span className="font-mono">{p}</span>
                        {copied === p ? ICONS.check : ICONS.copy}
                    </button>
                ))}
            </div>
        </div>
    );
};

const EmailTemplatesPage: React.FC = () => {
    const user = { email: 'demo@zulari.app' };
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [formState, setFormState] = useState({ name: '', subject: '', body: '' });

    const selectedTemplate = useMemo(() => templates.find(t => t.id === selectedId), [templates, selectedId]);

    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true);
            try {
                const data = await n8n.getEmailTemplates(user.email);
                setTemplates(data);
            } catch (err: any) {
                setNotification({ message: 'Failed to load templates.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, [user.email]);

    useEffect(() => {
        if (selectedTemplate) {
            setFormState({
                name: selectedTemplate.name,
                subject: selectedTemplate.subject,
                body: selectedTemplate.body,
            });
        } else {
            setFormState({ name: '', subject: '', body: '' });
        }
    }, [selectedTemplate]);

    const handleSelectTemplate = (id: string) => {
        setSelectedId(id);
    };

    const handleNewTemplate = () => {
        setSelectedId(null);
        setFormState({ name: '', subject: '', body: '' });
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!formState.name.trim() || !formState.subject.trim()) {
            setNotification({ message: 'Name and Subject are required.', type: 'error' });
            return;
        }
        setIsSaving(true);
        try {
            const payload = { ...formState, userEmail: user.email, id: selectedId || undefined };
            await n8n.saveEmailTemplate(payload);
            setNotification({ message: `Template '${formState.name}' saved.`, type: 'success' });
            const data = await n8n.getEmailTemplates(user.email);
            setTemplates(data);
        } catch (err: any) {
            setNotification({ message: `Failed to save template: ${err.message}`, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (window.confirm(`Are you sure you want to delete "${selectedTemplate?.name}"?`)) {
            setIsSaving(true);
            try {
                await n8n.deleteEmailTemplate(selectedId, user.email);
                setNotification({ message: 'Template deleted.', type: 'success' });
                const data = await n8n.getEmailTemplates(user.email);
                setTemplates(data);
                handleNewTemplate();
            } catch (err: any) {
                 setNotification({ message: `Failed to delete template: ${err.message}`, type: 'error' });
            } finally {
                setIsSaving(false);
            }
        }
    };
    
    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SubPageHeader title="Email Templates" icon={ICONS.templates} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Template List */}
                <div className="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-4">
                     <button onClick={handleNewTemplate} className="w-full bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg mb-4">
                        + New Template
                    </button>
                    {isLoading ? <div className="text-center p-4">Loading...</div> : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectTemplate(t.id)}
                                    className={`w-full text-left p-3 rounded-lg border ${selectedId === t.id ? 'bg-dark-bg border-brand-primary' : 'bg-dark-bg/50 border-dark-border hover:border-dark-text-secondary'}`}
                                >
                                    <p className="font-semibold text-white truncate">{t.name}</p>
                                    <p className="text-xs text-dark-text-secondary truncate">{t.subject}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Editor */}
                <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-white">{selectedId ? 'Edit Template' : 'Create New Template'}</h2>
                        <InfoTooltip
                            what="A reusable email for outreach campaigns."
                            how="Create a name, subject, and body. Use placeholders like {{firstName}} to personalize for each lead."
                            benefit="Save time and maintain a consistent voice across your outreach."
                        />
                    </div>
                     <input type="text" name="name" value={formState.name} onChange={handleFormChange} placeholder="Template Name" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" />
                     <input type="text" name="subject" value={formState.subject} onChange={handleFormChange} placeholder="Email Subject" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" />
                     <textarea name="body" value={formState.body} onChange={handleFormChange} placeholder="Email body..." rows={10} className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 font-mono text-sm" />
                     <PlaceholderGuide />
                     <div className="flex justify-end items-center gap-2 pt-4 border-t border-dark-border">
                        {selectedId && (
                             <button onClick={handleDelete} disabled={isSaving} className="bg-red-500/20 text-red-300 hover:bg-red-500/40 font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                Delete
                            </button>
                        )}
                        <button onClick={handleSave} disabled={isSaving} className="bg-brand-secondary hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center gap-2">
                           {isSaving && <Spinner />} {isSaving ? 'Saving...' : 'Save Template'}
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplatesPage;