import React, { useState, useEffect, FormEvent } from 'react';
import * as n8n from '../../services/n8nService';
import { ICONS } from '../../constants';
import SubPageHeader from '../../components/SubPageHeader';
import GmailConnectPrompt from '../../components/GmailConnectPrompt';
import ActionNotification from '../../components/ActionNotification';
import { CRMPlatform } from '../../types';

const CRM_CREDS_STORAGE_KEY = 'zulari-crm-credentials';interface SpinnerProps {
  button?: boolean;
}


const Spinner: React.FC<SpinnerProps> = ({ button = false }) => (
    <svg className={`animate-spin ${button ? 'h-5 w-5' : 'h-8 w-8'} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const IntegrationsPage: React.FC = () => {
    const user = { email: 'demo@zulari.app' };
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [crmCreds, setCrmCreds] = useState<{ platform: CRMPlatform; apiKey: string } | null>(null);
    const [showCrmForm, setShowCrmForm] = useState(false);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    // CRM Form State
    const [platform, setPlatform] = useState<CRMPlatform>('shopify');
    const [apiKey, setApiKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        const checkConnections = () => {
            setIsGoogleConnected(localStorage.getItem('googleServicesConnected') === 'true');
            const storedCreds = localStorage.getItem(CRM_CREDS_STORAGE_KEY);
            if (storedCreds) {
                setCrmCreds(JSON.parse(storedCreds));
                setShowCrmForm(false);
            }
        };
        checkConnections();
        window.addEventListener('storage', checkConnections);
        return () => window.removeEventListener('storage', checkConnections);
    }, []);

    const handleGoogleDisconnect = () => {
        localStorage.removeItem('googleServicesConnected');
        setIsGoogleConnected(false);
        setNotification({ type: 'success', message: 'Disconnected from Google.' });
    };

    const handleCrmDisconnect = () => {
        localStorage.removeItem(CRM_CREDS_STORAGE_KEY);
        setCrmCreds(null);
        setApiKey('');
        setNotification({ type: 'success', message: 'Disconnected from CRM.' });
    };

    const handleSaveAndConnectCrm = async (e: FormEvent) => {
        e.preventDefault();
        if (!apiKey) return;
        setIsSaving(true);
        setNotification(null);
        try {
            await n8n.saveCRMCredentials({ platform, api_key: apiKey, user_email: user.email });
            const newCreds = { platform, apiKey };
            localStorage.setItem(CRM_CREDS_STORAGE_KEY, JSON.stringify(newCreds));
            setCrmCreds(newCreds);
            setShowCrmForm(false);
            setNotification({ message: 'CRM connected successfully!', type: 'success' });
        } catch (err: any) {
            setNotification({ message: err.message || "Failed to save CRM credentials.", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isGoogleConnected) {
        return (
             <div className="space-y-6">
                 <SubPageHeader title="Integrations" icon={ICONS.integrations} />
                 <GmailConnectPrompt service="gmail" />
             </div>
        )
    }

    return (
        <div className="space-y-6">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <SubPageHeader title="Integrations" icon={ICONS.integrations} />
            <div className="space-y-6">
                {/* Google Workspace */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {React.cloneElement(ICONS.gmail, { className: "h-10 w-10 text-brand-accent"})}
                        <div>
                            <h3 className="text-lg font-bold text-white">Google Workspace</h3>
                            <p className="text-sm text-dark-text-secondary">Gmail, Calendar, and Drive are connected.</p>
                        </div>
                    </div>
                    <button onClick={handleGoogleDisconnect} className="bg-red-500/20 text-red-300 hover:bg-red-500/40 font-bold py-2 px-4 rounded-lg text-sm">
                        Disconnect
                    </button>
                </div>
                
                {/* CRM */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {React.cloneElement(ICONS.crm, { className: "h-10 w-10 text-brand-accent"})}
                             <div>
                                <h3 className="text-lg font-bold text-white">CRM</h3>
                                {crmCreds ? (
                                    <p className="text-sm text-dark-text-secondary">Connected to {crmCreds.platform}.</p>
                                ) : (
                                    <p className="text-sm text-dark-text-secondary">Connect your e-commerce platform.</p>
                                )}
                            </div>
                        </div>
                        {crmCreds ? (
                             <button onClick={handleCrmDisconnect} className="bg-red-500/20 text-red-300 hover:bg-red-500/40 font-bold py-2 px-4 rounded-lg text-sm">
                                Disconnect
                            </button>
                        ) : (
                             <button onClick={() => setShowCrmForm(s => !s)} className="bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg text-sm">
                                {showCrmForm ? 'Cancel' : 'Connect'}
                            </button>
                        )}
                    </div>
                    {showCrmForm && !crmCreds && (
                        <form onSubmit={handleSaveAndConnectCrm} className="space-y-4 mt-6 border-t border-dark-border pt-6">
                            <div>
                                <label htmlFor="platform" className="block text-sm font-medium text-dark-text-secondary mb-1">CRM Platform</label>
                                <select id="platform" value={platform} onChange={e => setPlatform(e.target.value as CRMPlatform)} className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5">
                                    <option value="shopify">Shopify</option> <option value="woocommerce">WooCommerce</option> <option value="bigcommerce">BigCommerce</option> <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="apiKey" className="block text-sm font-medium text-dark-text-secondary mb-1">API Key / Access Token</label>
                                <input id="apiKey" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="••••••••••••••••••••••••" className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5" />
                            </div>
                            <button type="submit" disabled={isSaving} className="w-full flex justify-center items-center bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg disabled:bg-slate-600">
                                {isSaving ? <Spinner button /> : 'Save & Connect'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;
