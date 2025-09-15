import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import * as n8n from '../services/n8nService';
import { ICONS } from '../constants';

const Spinner: React.FC = () => (
    <div className="flex justify-center items-center">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);


const OAuthCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Finalizing connection to Google...');

    useEffect(() => {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            setStatus('error');
            setMessage(`Authorization failed: ${error}. Redirecting...`);
            setTimeout(() => navigate('/'), 4000);
            return;
        }
        
        if (code) {
            n8n.postGoogleAuthCode(code)
                .then(() => {
                    localStorage.setItem('googleServicesConnected', 'true');
                    // Dispatch a storage event to notify other tabs/components immediately
                    window.dispatchEvent(new Event('storage')); 
                    
                    setStatus('success');
                    setMessage('Successfully connected! Your Google services are now integrated. Redirecting...');
                    setTimeout(() => navigate('/'), 2500);
                })
                .catch(err => {
                    localStorage.removeItem('googleServicesConnected');
                    setStatus('error');
                    setMessage(`Connection failed: ${err.message}. Please try again.`);
                });
        } else {
            setStatus('error');
            setMessage('Invalid callback state. No authorization code found.');
        }
    }, [searchParams, navigate]);

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
                     <Link to="/" className="mt-8 bg-brand-primary hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Return to Dashboard
                    </Link>
                )}
            </div>
        </div>
    );
};

export default OAuthCallbackPage;