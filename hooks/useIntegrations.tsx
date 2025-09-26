import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import * as n8n from '../services/n8nService';
import { Integration } from '../types';

type ServiceName = 'Sales AI' | 'Support AI' | 'Lead Gen AI' | 'Calendar AI';
type IntegrationType = 'Gmail' | 'Calendar';

interface IntegrationsContextType {
    integrations: Integration[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    isServiceEnabled: (serviceName: ServiceName) => boolean;
    getIntegration: (type: IntegrationType, serviceName?: ServiceName) => Integration | undefined;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export const IntegrationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchIntegrations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await n8n.fetchIntegrations();
            setIntegrations(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch integrations status.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIntegrations();
        const interval = setInterval(fetchIntegrations, 300000); // Poll every 5 minutes
        return () => clearInterval(interval);
    }, [fetchIntegrations]);

    const getIntegration = (type: IntegrationType, serviceName?: ServiceName): Integration | undefined => {
        return integrations.find(
            (integ) =>
                integ.integration_type === type &&
                (!serviceName || integ.service_name === serviceName) &&
                integ.status === 'Connected'
        );
    };

    const isServiceEnabled = (serviceName: ServiceName): boolean => {
        const hasIntegration = (type: IntegrationType) => !!getIntegration(type, serviceName);

        switch (serviceName) {
            case 'Sales AI':
                return hasIntegration('Gmail') && hasIntegration('Calendar');
            case 'Support AI':
                return hasIntegration('Gmail');
            case 'Lead Gen AI':
                return hasIntegration('Gmail');
            case 'Calendar AI':
                return hasIntegration('Calendar');
            default:
                return true;
        }
    };

    const value = {
        integrations,
        loading,
        error,
        refetch: fetchIntegrations,
        isServiceEnabled,
        getIntegration,
    };

    return (
        <IntegrationsContext.Provider value={value}>
            {children}
        </IntegrationsContext.Provider>
    );
};

export const useIntegrations = (): IntegrationsContextType => {
    const context = useContext(IntegrationsContext);
    if (context === undefined) {
        throw new Error('useIntegrations must be used within an IntegrationsProvider');
    }
    return context;
};
