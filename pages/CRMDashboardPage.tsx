import React, { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { ICONS } from '../constants';
import * as n8n from '../services/n8nService';
import { CRMPlatform, CRMEvent, CRMEventType } from '../types';
import ActionNotification from '../components/ActionNotification';
import InfoTooltip from '../components/InfoTooltip';

const CRM_CREDS_STORAGE_KEY = 'zulari-crm-credentials';

const Spinner: React.FC<{ button?: boolean }> = ({ button = false }) => (
    <svg className={`animate-spin ${button ? 'h-5 w-5' : 'h-8 w-8'} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CRMDashboardPage: React.FC = () => {
    const user = { email: 'demo@zulari.app' };
    const [platform, setPlatform] = useState<CRMPlatform>('shopify');
    const [apiKey, setApiKey] = useState('');
    const [savedCreds, setSavedCreds] = useState<{ platform: CRMPlatform; apiKey: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [events, setEvents] = useState<CRMEvent[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const fetchEvents = useCallback(async (creds: { platform: CRMPlatform; apiKey: string }) => {
        setIsLoadingEvents(true);
        setNotification(null);
        try {
            const fetchedEvents = await n8n.fetchCRMEvents({ platform: creds.platform, api_key: creds.apiKey, user_email: user.email });
            setEvents(fetchedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch (err: any) { setNotification({ message: err.message || 'Failed to fetch CRM events.', type: 'error' }); }
        finally { setIsLoadingEvents(false); }
    }, [user.email]);

    useEffect(() => {
        try {
            const storedCreds = localStorage.getItem(CRM_CREDS_STORAGE_KEY);
            if (storedCreds) {
                const parsedCreds = JSON.parse(storedCreds);
                setSavedCreds(parsedCreds);
                fetchEvents(parsedCreds);
            }
        } catch (e) { console.error("Failed to parse stored credentials", e); }
    }, [fetchEvents]);
    
    const handleSaveAndConnect = async (e: FormEvent) => {
        e.preventDefault();
        if (!apiKey) return;
        setIsSaving(true);
        setNotification(null);
        try {
            await n8n.saveCRMCredentials({ platform, api_key: apiKey, user_email: user.email });
            const newCreds = { platform, apiKey };
            localStorage.setItem(CRM_CREDS_STORAGE_KEY, JSON.stringify(newCreds));
            setSavedCreds(newCreds);
            setNotification({ message: 'Credentials saved! Fetching events...', type: 'success' });
            fetchEvents(newCreds);
        } catch (err: any) { setNotification({ message: err.message || "Failed to save credentials.", type: 'error' }); }
        finally { setIsSaving(false); }
    };
    
    const handleDisconnect = () => {
        localStorage.removeItem(CRM_CREDS_STORAGE_KEY);
        setSavedCreds(null);
        setApiKey('');
        setEvents([]);
        setNotification({ message: "Disconnected from CRM.", type: 'success'});
    };

    const EventIcon = ({ event }: { event: CRMEventType }) => {
        const iconMap = { signup: ICONS.email, login: ICONS.logout, abandoned_cart: ICONS.cart };
        return <span className="text-dark-text-secondary">{iconMap[event] || null}</span>;
    };

    return (
        <div className="space-y-8">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <header>
                 <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="text-brand-accent">{ICONS.crm}</span>
                    <span>CRM Automation</span>
                </h1>
                <p className="text-dark-text-secondary mt-1">Connect your store to see real-time customer events and trigger automations.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* --- INPUT PANE --- */}
                <div className="lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                        {savedCreds ? `Connected to ${savedCreds.platform}` : "Connect your CRM"}
                        <InfoTooltip
                            what="Connects Zulari to your e-commerce platform."
                            how="Select your platform and provide an API key. We establish a secure connection to listen for customer events."
                            benefit="Enables real-time data sync and allows AI to trigger automations based on customer actions (e.g., abandoned cart emails)."
                        />
                    </h2>
                    <p className="text-dark-text-secondary mb-6">
                        {savedCreds ? 'You can now view live event data. To change platforms, disconnect first.' : 'Select your platform and enter your API key to get started.'}
                    </p>
                    {savedCreds ? (
                        <button onClick={handleDisconnect} className="w-full bg-red-500/20 text-red-300 hover:bg-red-500/40 font-bold py-2.5 px-4 rounded-lg">
                            Disconnect
                        </button>
                    ) : (
                        <form onSubmit={handleSaveAndConnect} className="space-y-4">
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

                {/* --- OUTPUT PANE --- */}
                <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-6 min-h-[400px]">
                    <h2 className="text-xl font-bold text-white mb-4">Customer Activity Log</h2>
                    {isLoadingEvents && events.length === 0 ? <div className="flex justify-center items-center h-48"><Spinner/></div> :
                     events.length === 0 ? <p className="text-center text-dark-text-secondary py-16">{savedCreds ? 'No events found.' : 'Connect your CRM to see live events.'}</p> :
                     <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-dark-text-secondary uppercase bg-dark-bg sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Timestamp</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Event</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-border">
                                {events.map((event, idx) => (
                                    <tr key={idx} className="hover:bg-dark-bg/50">
                                        <td className="px-4 py-3 font-mono text-dark-text-secondary">{new Date(event.timestamp).toLocaleString()}</td>
                                        <td className="px-4 py-3 font-medium text-white">{event.customer_name}</td>
                                        <td className="px-4 py-3 capitalize flex items-center gap-2"><EventIcon event={event.event} /><span>{event.event.replace('_', ' ')}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default CRMDashboardPage;