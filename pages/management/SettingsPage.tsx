import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import SubPageHeader from '../../components/SubPageHeader';
import ActionNotification from '../../components/ActionNotification';

const SettingsToggle: React.FC<{ label: string; description: string; enabled: boolean; onToggle: () => void; }> = 
({ label, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between border-b border-dark-border py-4">
        <div>
            <p className="font-semibold text-white">{label}</p>
            <p className="text-sm text-dark-text-secondary">{description}</p>
        </div>
        <button type="button" onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-brand-primary' : 'bg-slate-600'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState({
        adminMode: localStorage.getItem('zulari-settings-adminMode') === 'true',
        requireGoogleAuth: localStorage.getItem('zulari-settings-requireGoogleAuth') === 'true',
        enableNotifications: localStorage.getItem('zulari-settings-enableNotifications') !== 'false', // default to true
    });
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        localStorage.setItem('zulari-settings-adminMode', String(settings.adminMode));
        localStorage.setItem('zulari-settings-requireGoogleAuth', String(settings.requireGoogleAuth));
        localStorage.setItem('zulari-settings-enableNotifications', String(settings.enableNotifications));
    }, [settings]);

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        setNotification({ message: 'Settings saved.', type: 'success' });
    };

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} duration={2000} />}
            <SubPageHeader title="Settings" icon={ICONS.settings} />
            <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8 max-w-3xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-4">Platform Settings</h2>
                <div className="space-y-2">
                    <SettingsToggle 
                        label="Admin Mode"
                        description="Enables advanced debugging and configuration options across the app."
                        enabled={settings.adminMode}
                        onToggle={() => handleToggle('adminMode')}
                    />
                    <SettingsToggle 
                        label="Require Google Auth"
                        description="Force users to connect their Google account before using any AI service."
                        enabled={settings.requireGoogleAuth}
                        onToggle={() => handleToggle('requireGoogleAuth')}
                    />
                     <SettingsToggle 
                        label="Enable Notifications"
                        description="Show pop-up notifications for successful actions and errors."
                        enabled={settings.enableNotifications}
                        onToggle={() => handleToggle('enableNotifications')}
                    />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
