import { useNavigate } from 'react-router-dom';
import { checkAccess, CheckAccessRequest, ServiceName } from '../services/access';
import { handleBackendRaw, EvaluateAccessResult } from '../services/accessControl';

export type NotificationSetter = (notification: { message: string, type: 'success' | 'error' } | null) => void;

export const useAccessControl = (setNotification: NotificationSetter) => {
    const navigate = useNavigate();

    const handleDenial = (result: EvaluateAccessResult) => {
        const { reason, message, resetAtIso, subscription } = result;

        let finalMessage = message;

        if (reason === 'service_disabled') {
            finalMessage = 'This service is not included in your current plan.';
        } else if (reason === 'subscription_expired') {
            const expiryDate = subscription?.trialEnds || subscription?.subscriptionResetAt;
            finalMessage = `Your subscription has expired${expiryDate ? ` on ${new Date(expiryDate).toLocaleDateString()}` : ''}.`;
        } else if (reason === 'rate_limited' && resetAtIso) {
            finalMessage = `You’ve hit the usage limit. Try again after ${new Date(resetAtIso).toLocaleString()}.`;
        }

        setNotification({ message: finalMessage, type: 'error' });

        if (reason === 'service_disabled' || reason === 'subscription_expired') {
            setTimeout(() => navigate('/management/billing'), 3000);
        }
    };

    const checkServiceAccess = async (payload: Omit<CheckAccessRequest, 'intent'>): Promise<boolean> => {
        const rawResponse = await checkAccess({ ...payload, intent: 'consume' });

        let accessGranted = false;

        handleBackendRaw(rawResponse, {
            onAllow: () => {
                accessGranted = true;
            },
            onDeny: (result) => {
                accessGranted = false;
                handleDenial(result);
            },
        });

        return accessGranted;
    };

    const gateAndNavigate = async (serviceKey: ServiceName, targetPath: string, onCheckComplete?: () => void) => {
        const rawResponse = await checkAccess({ email: 'demo@zulari.app', service: serviceKey, intent: 'check' });

        handleBackendRaw(rawResponse, {
            onAllow: () => {
                navigate(targetPath);
                onCheckComplete?.();
            },
            onDeny: (result) => {
                handleDenial(result);
                onCheckComplete?.();
            },
        });
    };
    
    return { checkServiceAccess, gateAndNavigate };
};
