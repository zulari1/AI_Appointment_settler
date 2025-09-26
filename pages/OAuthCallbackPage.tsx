import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import * as n8n from '../services/n8nService';
import { ICONS } from '../constants';
import { useIntegrations } from '../hooks/useIntegrations';

const Spinner: React.FC = () => (
    <div className="flex justify-center items-center">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const OAuthCallbackPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { refetch } = useIntegrations();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Finalizing connection to Google...');

    useEffect(() => {
        const processCode = async () => {
            const params = new URLSearchParams(location.search);
            const code = params.get('code');
            const stateEncoded = params.get('state');
            const error = params.get('error');

            // Debug logging
            console.log('OAuth Callback received:', {
                fullURL: window.location.href,
                code: code ? 'Present' : 'Missing',
                state: stateEncoded ? 'Present' : 'Missing',
                error: error,
                allParams: Object.fromEntries(params.entries())
            });

            // Handle OAuth error response
            if (error) {
                const errorDescription = params.get('error_description') || error;
                setStatus('error');
                setMessage(`Authorization failed: ${errorDescription}`);
                return;
            }

            // Check for authorization code
            if (!code) {
                setStatus('error');
                setMessage('No authorization code received from Google. Please try connecting again.');
                return;
            }

            // Check for state parameter
            if (!stateEncoded) {
                setStatus('error');
                setMessage('Missing state parameter. This might be a security issue or misconfiguration.');
                console.error('State parameter missing - check OAuth initiation URL');
                return;
            }

            try {
                // Decode state
                let state;
                try {
                    state = JSON.parse(atob(stateEncoded));
                    console.log('Decoded state:', state);
                } catch (decodeError) {
                    console.error('Failed to decode state:', decodeError);
                    setStatus('error');
                    setMessage('Invalid state format received.');
                    return;
                }

                // Validate state structure
                if (!state.service || !state.integrationType || !state.userEmail) {
                    console.error('Invalid state object:', state);
                    setStatus('error');
                    setMessage('Invalid callback state data.');
                    return;
                }

                const webhookPayload = {
                    action: 'collect_access',
                    service: state.service,
                    integration_type: state.integrationType,
                    user_email: state.userEmail,
                    code: code,
                    redirect_uri: `${window.location.origin}/oauth.html`
                };

                console.log('Sending to webhook:', webhookPayload);
                
                const response = await n8n.postGoogleAuthCode(webhookPayload);
                
                if (Array.isArray(response) && response.length > 0 && response[0]?.status === 'success') {
                    await refetch();
                    setStatus('success');
                    setMessage('Successfully connected! Your Google services are now integrated. Redirecting...');
                    
                    if (state.service === 'Integrations') {
                        setTimeout(() => navigate('/management/integrations'), 2500);
                    } else {
                        setTimeout(() => navigate(`/services/${state.service.toLowerCase().replace(/ /g, '-')}`), 2500);
                    }
                } else {
                    const errorMessage = response[0]?.message || 'Webhook processing failed.';
                    throw new Error(errorMessage);
                }

            } catch (err: any) {
                console.error('OAuth processing error:', err);
                setStatus('error');
                setMessage(`Connection failed: ${err.message}`);
            }
        };

        processCode();
    }, [location.search, navigate, refetch]);

    const statusIcons = {
        loading: <Spinner />,
        success: <div className="p-4 bg-green-500/20 rounded-full">{React.cloneElement(ICONS.gmail, { className: "h-12 w-12 text-green-400"})}</div>,
        error: <div className="p-4 bg-red-500/20 rounded-full">{React.cloneElement(ICONS.error, { className: "h-12 w-12 text-red-400"})}</div>,
    };

    return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                {statusIcons[status]}
                <h2 className="text-2xl font-bold text-white mt-6 mb-2">
                    {status === 'loading' && 'Establishing Connection'}
                    {status === 'success' && 'Connection Successful'}
                    {status === 'error' && 'Connection Error'}
                </h2>
                <p className="text-dark-text-secondary max-w-md">{message}</p>
                {status === 'error' && (
                    <Link 
                        to="/management/integrations" 
                        className="mt-8 bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Return to Integrations
                    </Link>
                )}
            </div>
        </div>
    );
};

export default OAuthCallbackPage;