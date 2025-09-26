
import React from 'react';
import { useIntegrations } from '../hooks/useIntegrations';
import { ICONS } from '../constants';
import { VITE_GMAIL_CLIENT_ID } from '../env';

type ServiceName = 'Sales AI' | 'Support AI' | 'Lead Gen AI' | 'Calendar AI';
type IntegrationType = 'Gmail' | 'Calendar';

interface IntegrationBannerProps {
    serviceName: ServiceName;
    required: IntegrationType[];
    children: React.ReactNode;
}

const IntegrationBanner: React.FC<IntegrationBannerProps> = ({ serviceName, required, children }) => {
    const { isServiceEnabled, getIntegration, loading } = useIntegrations();
    const userEmail = 'demo@zulari.app'; // Hardcoded for demo

    const serviceIsEnabled = isServiceEnabled(serviceName);

    const startOAuth = (integrationType: IntegrationType) => {
        const state = {
            userEmail: userEmail,
            service: serviceName,
            integrationType: integrationType,
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

        console.log(`Initiating OAuth from ${serviceName} banner with URL:`, authUrl.toString());
        console.log('State being sent:', state);

        window.location.href = authUrl.toString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (serviceIsEnabled) {
        return (
            <>
                <div className="bg-dark-bg border border-dark-border rounded-xl p-4 mb-6">
                    <h3 className="font-bold text-white text-lg mb-2">✅ Integrations Ready</h3>
                    <div className="flex flex-wrap gap-4">
                        {required.map(type => {
                            const integration = getIntegration(type, serviceName);
                            return (
                                <div key={type} className="flex items-center gap-2 text-sm text-green-400">
                                    {type === 'Gmail' ? '✉️' : '📅'}
                                    <span>{type} connected as <span className="font-semibold text-white">{integration?.account_email}</span></span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {children}
            </>
        );
    }
    
    // Service is NOT enabled, show connect prompt
    const requiredIntegrations = required.map(type => {
        const isConnected = !!getIntegration(type, serviceName);
        return { type, isConnected };
    });

    const isGmailRequired = required.includes('Gmail');
    const isCalendarRequired = required.includes('Calendar');
    
    const benefitText = isGmailRequired && isCalendarRequired 
        ? "This lets the AI reply to prospects and book demos automatically — securely."
        : isGmailRequired 
        ? "This lets the AI read and send emails on your behalf to handle customer queries."
        : "This lets the AI manage your schedule and automatically book meetings.";

    return (
        <div className="bg-dark-card border-2 border-amber-500/50 rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                <span className="text-amber-400">⚠️</span> Unlock {serviceName}
            </h2>
            <p className="text-dark-text-secondary mt-2 max-w-xl mx-auto">
                To unlock this feature, connect your {required.join(' & ')}. {benefitText}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                {requiredIntegrations.map(({ type, isConnected }) => (
                    isConnected ? (
                        <div key={type} className="flex items-center gap-2 p-3 bg-green-900/50 rounded-lg text-green-400 font-semibold">
                            <span>✅</span>
                            {type} Connected
                        </div>
                    ) : (
                        <button key={type} onClick={() => startOAuth(type)} className="flex items-center gap-2 bg-brand-primary hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg">
                            {type === 'Gmail' ? '🔗 Connect Gmail' : '📅 Connect Calendar'}
                        </button>
                    )
                ))}
            </div>
             <p className="text-sm font-bold text-red-400 mt-6 animate-pulse">
                ❌ Without {required.join(' & ')} connected, you’re missing out on automated replies & bookings.
            </p>
        </div>
    );
};

export default IntegrationBanner;
