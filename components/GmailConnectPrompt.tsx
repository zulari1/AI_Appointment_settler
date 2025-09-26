import React from 'react';
import { VITE_GMAIL_CLIENT_ID } from '../env';
import { ICONS } from '../constants';

interface GoogleConnectPromptProps {
    service: 'gmail' | 'calendar';
}

const GoogleConnectPrompt: React.FC<GoogleConnectPromptProps> = ({ service }) => {
    
    const serviceDetails = {
        gmail: {
            name: 'Gmail & Calendar',
            icon: ICONS.gmail,
            description: "To use the Sales and Support AI services, you need to authorize Zulari AI to access your Gmail and Calendar. This will allow the AI to read relevant emails, send replies, and manage calendar events on your behalf."
        },
        calendar: {
            name: 'Google Calendar',
            icon: ICONS.calendar,
            description: "To use the Calendar AI, you need to authorize Zulari AI to access your Google Calendar. This will allow the AI to view your schedule and book new meetings automatically."
        }
    };

    const details = serviceDetails[service];

    const handleConnect = () => {
        const userEmail = 'demo@zulari.app'; // Hardcoded
        const serviceName = 'Integrations';
        const integrationType = 'Gmail';

        const state = {
            service: serviceName,
            integrationType,
            userEmail,
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(7)
        };
        const stateEncoded = btoa(JSON.stringify(state));

        const scopes = [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
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

        console.log('Initiating OAuth from Integrations page with URL:', authUrl.toString());
        console.log('State being sent:', state);
        
        window.location.href = authUrl.toString();
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
            <div className="p-5 bg-brand-primary/20 rounded-full mb-6">
                {React.cloneElement(details.icon, { className: "h-12 w-12 text-brand-accent"})}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Connect Your {details.name}</h2>
            <p className="text-dark-text-secondary max-w-lg mb-8">
                {details.description}
            </p>
            <button
                onClick={handleConnect}
                className="inline-flex items-center gap-3 bg-brand-primary hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-lg hover:shadow-indigo-500/50"
            >
                {React.cloneElement(ICONS.gmail, { className: "h-6 w-6"})}
                <span>Connect with Google</span>
            </button>
             <p className="text-xs text-dark-text-secondary mt-6 max-w-sm">
                By connecting, you agree to allow Zulari AI to access your Google data for the purposes of this service. Your data is handled securely. You can disconnect at any time.
            </p>
        </div>
    );
};

export default GoogleConnectPrompt;