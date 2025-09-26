import React from 'react';
import { ICONS } from '../constants';
import IntegrationBanner from '../components/IntegrationBanner';

const CalendarAIPage: React.FC = () => {

    const pageContent = (
         <div className="space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="text-brand-accent">{ICONS.calendar}</span>
                        <span>Calendar AI</span>
                    </h1>
                    <p className="text-dark-text-secondary mt-1">Automate meeting schedules and manage your events with AI.</p>
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

    return (
         <IntegrationBanner serviceName="Calendar AI" required={['Calendar']}>
            {pageContent}
        </IntegrationBanner>
    )
};

export default CalendarAIPage;