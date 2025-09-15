import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import GoogleConnectPrompt from '../components/GmailConnectPrompt';

const CalendarAIPage: React.FC = () => {
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);

    useEffect(() => {
        const checkConnection = () => {
            setIsGoogleConnected(localStorage.getItem('googleServicesConnected') === 'true');
        };
        checkConnection();
        window.addEventListener('storage', checkConnection);
        return () => window.removeEventListener('storage', checkConnection);
    }, []);

    const handleDisconnect = () => {
        localStorage.removeItem('googleServicesConnected');
        setIsGoogleConnected(false);
    };

    // OAUTH GATING TEMPORARILY DISABLED FOR TESTING
    // if (!isGoogleConnected) {
    //     return <GoogleConnectPrompt service="calendar" />;
    // }

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="text-brand-accent">{ICONS.calendar}</span>
                        <span>Calendar AI</span>
                    </h1>
                    <p className="text-dark-text-secondary mt-1">Automate meeting schedules and manage your events with AI.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-green-400 bg-green-900/50 px-2 py-1 rounded-full flex items-center gap-1.5">
                        {React.cloneElement(ICONS.calendar, {className: "h-4 w-4"})}
                        GOOGLE CONNECTED
                    </span>
                    <button onClick={handleDisconnect} className="text-xs text-red-400 hover:text-red-300 hover:underline">Disconnect</button>
                </div>
            </header>

            <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
                 <h2 className="text-2xl font-bold text-white mb-4">Calendar AI is Active</h2>
                 <p className="text-dark-text-secondary max-w-2xl mx-auto">
                    Your calendar is now connected. The AI will assist with booking new meetings and finding open slots.
                 </p>
                 <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-dark-bg p-4 rounded-lg">
                        <p className="text-brand-accent text-3xl font-bold">12</p>
                        <p className="text-sm text-dark-text-secondary">Meetings This Week</p>
                    </div>
                     <div className="bg-dark-bg p-4 rounded-lg">
                        <p className="text-brand-accent text-3xl font-bold">4</p>
                        <p className="text-sm text-dark-text-secondary">Pending Invites</p>
                    </div>
                     <div className="bg-dark-bg p-4 rounded-lg">
                        <p className="text-brand-accent text-3xl font-bold">8h</p>
                        <p className="text-sm text-dark-text-secondary">Available This Week</p>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default CalendarAIPage;