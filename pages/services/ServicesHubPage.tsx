import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceCard from '../../components/ServiceCard';
import { ICONS } from '../../constants';
import { useAccessControl } from '../../hooks/useAccessControl';
import { ServiceName } from '../../services/access';
import ActionNotification from '../../components/ActionNotification';

const ServicesHubPage: React.FC = () => {
    const navigate = useNavigate();
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [loadingService, setLoadingService] = useState<ServiceName | null>(null);
    const { gateAndNavigate } = useAccessControl(setNotification);

    const handleServiceClick = (serviceKey: ServiceName, link: string) => {
        setLoadingService(serviceKey);
        gateAndNavigate(serviceKey, link, () => {
            setLoadingService(null);
        });
    };

    const coreServices: { title: string; description: string; icon: React.ReactNode; link: string; status: 'available' | 'coming-soon'; serviceKey?: ServiceName }[] = [
      { title: 'Research AI Agent', description: 'Automated market, competitor, and product research reports.', icon: ICONS.research, link: '/services/research-ai', status: 'available', serviceKey: 'research-ai' },
      { title: 'Web AI Assistant', description: 'Control and command a web browsing AI to perform tasks.', icon: ICONS.web, link: '/services/web-ai', status: 'available', serviceKey: 'web-ai' },
      { title: 'Customer Support AI', description: 'Automate responses and manage customer queries.', icon: ICONS.support, link: '/services/support-ai', status: 'available', serviceKey: 'support-ai' },
      { title: 'Sales AI Agent', description: 'Analyze sales data and identify growth opportunities.', icon: ICONS.sales, link: '/services/sales-ai', status: 'available', serviceKey: 'sales-ai' },
      { title: 'Lead Generation System', description: 'Identify and qualify potential leads from various sources.', icon: ICONS.leads, link: '/leadgen', status: 'available', serviceKey: 'lead-gen' },
      { title: 'Custom AI Solutions', description: 'Submit a request for a custom-built AI solution for your business.', icon: ICONS.custom, link: '/services/custom-solution', status: 'available' },
      { title: 'Calendar AI', description: 'Automate meeting schedules and manage your events.', icon: ICONS.calendar, link: '/services/calendar-ai', status: 'available' },
      { title: 'CRM Automation', description: 'Connect your store to see customer events and trigger automations.', icon: ICONS.crm, link: '/services/crm-automation', status: 'available' },
      { title: 'Influencer Research AI', description: 'Analyze Instagram profiles for collaboration potential.', icon: ICONS.influencer, link: '/services/influencer-research', status: 'available' },
      { title: 'SEO Optimization AI', description: 'Analyze and improve your website\'s search engine ranking.', icon: ICONS.seo, link: '/services/seo-optimization', status: 'available' },
    ] as const;

    return (
        <div className="space-y-8">
            {notification && <ActionNotification message={notification.message} type={notification.type} />}
            <div>
                <h1 className="text-3xl font-bold text-white">Core AI Services</h1>
                <p className="text-dark-text-secondary">Select a core AI service to manage its operations and view results.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {coreServices.map(service => (
                    <ServiceCard 
                        key={service.title} 
                        {...service} 
                        isLoading={loadingService === service.serviceKey}
                        onClick={() => {
                            if (service.serviceKey) {
                                handleServiceClick(service.serviceKey, service.link);
                            } else {
                                navigate(service.link);
                            }
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default ServicesHubPage;