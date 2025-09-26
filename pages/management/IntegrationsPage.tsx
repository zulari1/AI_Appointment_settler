
import React from 'react';
import { useIntegrations } from '../../hooks/useIntegrations';
import SubPageHeader from '../../components/SubPageHeader';
import GmailConnectPrompt from '../../components/GmailConnectPrompt';
import { ICONS } from '../../constants';
// FIX: Removed `parseISO` as it's not a consistently available export. `new Date()` handles ISO strings correctly.
import { format } from 'date-fns';
import { VITE_GMAIL_CLIENT_ID } from '../../env';
import { Integration } from '../../types';

const IntegrationsPage: React.FC = () => {
    const { integrations, loading, error, refetch } = useIntegrations();
    const userEmail = 'demo@zulari.app'; // Hardcoded for demo

    const startOAuth = (serviceName: string, integrationType: Integration['integration_type']) => {
        const state = {
            userEmail,
            service: serviceName,
            integrationType,
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(7),
        };
        const stateEncoded = btoa(JSON.stringify(state));

        const scopes = [
            "https://www.googleapis.com/auth/gmail.modify",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/calendar"
        ].join(" ");
        
        const redirectUri = `${window.location.origin}/oauth.html`;

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', VITE_GMAIL_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scopes);
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', stateEncoded);

        window.location.href = authUrl.toString();
    };

    const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
        const styles: { [key: string]: string } = {
            'Connected': 'bg-green-500/20 text-green-400',
            'Disconnected': 'bg-red-500/20 text-red-400',
            'Expired': 'bg-amber-500/20 text-amber-400',
            'Error': 'bg-red-500/20 text-red-400',
        };
        return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>{status}</span>;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            // FIX: Replaced `parseISO` with the native `new Date()` constructor, which reliably handles ISO strings.
            return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
        } catch (e) {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <SubPageHeader title="Integrations" icon={ICONS.integrations} />
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
                    <p className="mt-4 text-dark-text-secondary">Loading integrations...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="space-y-6">
                <SubPageHeader title="Integrations" icon={ICONS.integrations} />
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                    <p><strong>Error:</strong> {error}</p>
                    <button onClick={refetch} className="mt-2 text-white underline">Try again</button>
                </div>
            </div>
        )
    }

    if (integrations.length === 0) {
        return (
            <div className="space-y-6">
                <SubPageHeader title="Integrations" icon={ICONS.integrations} />
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                    <GmailConnectPrompt service="gmail" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SubPageHeader title="Integrations" icon={ICONS.integrations} />
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 md:p-6">
                <h2 className="text-xl font-bold text-white mb-4">Connected Services</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-dark-text-secondary uppercase bg-dark-bg">
                            <tr>
                                <th className="px-4 py-3">Service</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Account</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Last Verified</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {integrations.map((integ, idx) => (
                                <tr key={idx} className="hover:bg-dark-bg/50">
                                    <td className="px-4 py-3 font-medium text-white">{integ.service_name}</td>
                                    <td className="px-4 py-3">{integ.integration_type}</td>
                                    <td className="px-4 py-3">{integ.account_email}</td>
                                    <td className="px-4 py-3"><StatusBadge status={integ.status} /></td>
                                    <td className="px-4 py-3">{formatDate(integ.last_verified)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => startOAuth(integ.service_name, integ.integration_type)} className="text-xs bg-dark-border hover:bg-brand-primary px-3 py-1 rounded">Reconnect</button>
                                            <button className="text-xs bg-dark-border hover:bg-red-500/50 px-3 py-1 rounded">Disconnect</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;