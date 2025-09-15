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
        // Store the initiating service to provide context on the callback page
        sessionStorage.setItem('oauth_service_initiator', service);
        
        // As per the PRD, we request all scopes at once for a unified permission grant
        const scopes = [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/calendar"
        ].join(" ");
        
        // The redirect URI must point to the physical .html file that handles the hash routing
        const redirectUri = `${window.location.origin}/oauth.html`;

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${VITE_GMAIL_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&access_type=offline` +
            `&prompt=consent`;
            
        window.location.href = authUrl;
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