import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ICONS } from '../constants';
import { useIntegrations } from '../hooks/useIntegrations';

const IntegrationStatusIcon: React.FC<{ type: 'Gmail' | 'Calendar' }> = ({ type }) => {
    const { getIntegration } = useIntegrations();
    const integration = getIntegration(type);
    const isConnected = integration?.status === 'Connected';
    const icon = type === 'Gmail' ? '✉️' : '📅';
    const title = `${type} is ${isConnected ? 'Connected' : 'Not Connected'}`;

    return (
        <Link to="/management/integrations" title={title} className="relative">
            <span className="text-lg">{icon}</span>
            <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-dark-card ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </Link>
    );
};

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
    const user = {
        name: 'Demo User',
        email: 'demo@zulari.app',
        picture: null
    };
    
    const [role, setRole] = useState(localStorage.getItem('zulari-user-role') || 'Manager');

    useEffect(() => {
        localStorage.setItem('zulari-user-role', role);
    }, [role]);

    const handleLogout = () => {
        console.log("Logout action is disabled.");
    };

    return (
        <header className="flex-shrink-0 bg-dark-card border-b border-dark-border p-4 flex justify-between items-center">
             <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-dark-text-secondary"
                aria-label="Open sidebar"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <div className="flex-1 flex justify-end items-center">
                <div className="flex items-center space-x-4 md:space-x-6">
                    <div className="flex items-center gap-4">
                        <IntegrationStatusIcon type="Gmail" />
                        <IntegrationStatusIcon type="Calendar" />
                    </div>

                    <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)}
                        className="bg-dark-bg border border-dark-border rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                        aria-label="Select user role"
                    >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="User">User</option>
                        <option value="Client">Client (View Only)</option>
                    </select>

                    <button className="relative text-dark-text-secondary hover:text-white">
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-dark-card"></span>
                        {ICONS.bell}
                    </button>
                    
                    <div className="flex items-center space-x-3">
                        {user?.picture ? (
                            <img src={user.picture} alt={user.name || 'User profile'} className="h-10 w-10 rounded-full" />
                        ) : (
                            <div className="p-2 bg-brand-primary rounded-full text-white h-10 w-10 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                        )}
                         <div className="hidden sm:block">
                            <p className="font-semibold text-sm text-white">{user?.name || 'User'}</p>
                            <p className="text-xs text-dark-text-secondary">{user?.email}</p>
                        </div>
                    </div>
                     <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 bg-dark-bg hover:bg-dark-border text-dark-text-secondary font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        <span className="hidden sm:inline">Logout</span>
                        {ICONS.logout}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;