import React, { useState } from 'react';
import * as n8n from '../../services/n8nService';
import { ICONS } from '../../constants';
import SubPageHeader from '../../components/SubPageHeader';
import ActionNotification from '../../components/ActionNotification';
import InfoTooltip from '../../components/InfoTooltip';interface SpinnerProps {
  button?: boolean;
}


const Spinner: React.FC<SpinnerProps> = ({ button = false }) => (
    <svg className={`animate-spin ${button ? 'h-5 w-5' : 'h-8 w-8'} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

type ServiceType = 'support' | 'sales' | 'web-ai';interface TrainingFormProps {
  serviceType: ServiceType;
  userEmail: string;
}


const TrainingForm: React.FC<TrainingFormProps> = ({ serviceType, userEmail }) => {
    const [trainingContent, setTrainingContent] = useState('');
    const [isTraining, setIsTraining] = useState(false);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const serviceInfo = {
        'support': { name: 'Support AI', trainFunc: n8n.trainSupportAI },
        'sales': { name: 'Sales AI', trainFunc: n8n.trainSalesAI },
        'web-ai': { name: 'Web Assistant', trainFunc: n8n.trainSalesAI } // Reuse sales trainer for generic text training
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trainingContent.trim()) return;
        setIsTraining(true);
        setNotification(null);
        try {
            const { name, trainFunc } = serviceInfo[serviceType];
            const payload = {
                email: userEmail,
                agentName: name,
                trainingText: trainingContent, // For support/sales
                content: trainingContent,     // For web-ai
                type: trainingContent.startsWith('http') ? 'url' : 'text', // For web-ai
                serviceType: serviceType
            };
            await trainFunc(payload as any);
            setNotification({ type: 'success', message: `Training data submitted for ${name}!` });
            setTrainingContent('');
        } catch (err: any) {
            setNotification({ type: 'error', message: err.message || 'Failed to submit training data.' });
        } finally {
            setIsTraining(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <div>
                <label htmlFor={`training-content-${serviceType}`} className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Paste new product info, FAQs, sales scripts, or a public Google Docs URL to train the {serviceInfo[serviceType].name}.
                </label>
                <textarea 
                    id={`training-content-${serviceType}`} 
                    rows={6} 
                    value={trainingContent} 
                    onChange={(e) => setTrainingContent(e.target.value)} 
                    placeholder="Paste content here..." 
                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 text-sm" 
                    disabled={isTraining} 
                />
            </div>
            <button 
                type="submit" 
                disabled={isTraining || !trainingContent.trim()} 
                className="w-full flex justify-center items-center bg-brand-secondary hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-lg disabled:bg-slate-600"
            >
                {isTraining ? <Spinner button /> : `Train ${serviceInfo[serviceType].name}`}
            </button>
        </form>
    );
};

const DocumentsPage: React.FC = () => {
    const user = { email: 'demo@zulari.app' };
    const [activeTab, setActiveTab] = useState<ServiceType>('support');

    const tabs: { id: ServiceType, name: string, icon: React.ReactNode }[] = [
        { id: 'support', name: 'Customer Support', icon: ICONS.support },
        { id: 'sales', name: 'Sales AI', icon: ICONS.sales },
        { id: 'web-ai', name: 'Web Assistant', icon: ICONS.web },
    ];

    return (
        <div className="space-y-6">
            <SubPageHeader title="Documents & Files" icon={ICONS.documents} />
             <div className="bg-dark-card border border-dark-border rounded-xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">AI Knowledge Base Management</h2>
                        <p className="text-dark-text-secondary mt-1">Train your AI services with new documents to keep them up-to-date.</p>
                    </div>
                    <InfoTooltip 
                        what="A central hub to manage the knowledge for all your AI agents."
                        how="Select an AI service and provide new information as text or a public URL. The selected AI will learn from this data."
                        benefit="Keeps all your AIs accurate and consistent without having to navigate to each service individually."
                    />
                </div>

                <div className="border-b border-dark-border mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                             <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-dark-text-secondary hover:text-white hover:border-gray-500'
                                }`}
                            >
                                {tab.icon}
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div>
                    {tabs.map(tab => (
                        <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
                            <TrainingForm serviceType={tab.id} userEmail={user.email} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DocumentsPage;
