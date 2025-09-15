import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ICONS } from '../constants';

interface ActionNotificationProps {
    message: string;
    type: 'success' | 'error';
    duration?: number;
}

const ActionNotification: React.FC<ActionNotificationProps> = ({ message, type, duration = 4000 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const container = document.getElementById('notification-container');
    if (!container) return null;

    const bgColor = type === 'success' ? 'bg-brand-secondary' : 'bg-red-500';
    const icon = type === 'success' ? '✅' : '❌';
    const title = type === 'success' ? 'Success!' : 'Error';

    return ReactDOM.createPortal(
        <div 
            className={`w-80 p-4 rounded-lg shadow-2xl text-white ${bgColor} ${isVisible ? 'animate-slide-in-right' : 'animate-slide-out-right'}`}
            role="alert"
        >
            <p className="font-bold flex items-center gap-2">{icon} {title}</p>
            <p className="text-sm mt-1">{message}</p>
        </div>,
        container
    );
};

export default ActionNotification;