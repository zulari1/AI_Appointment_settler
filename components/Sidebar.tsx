import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ICONS } from '../constants';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}interface NavGroupProps {
  title: string; children: React.ReactNode;
}


const NavGroup: React.FC<NavGroupProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center justify-between w-full px-3 pt-4 pb-2 text-xs font-bold uppercase text-dark-text-secondary tracking-wider focus:outline-none"
            >
                <span>{title}</span>
                <svg className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && <div className="mt-1 space-y-1">{children}</div>}
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const managementLinks = [
      { name: 'Documents & Files', path: '/management/documents', icon: ICONS.documents },
      { name: 'Email Templates', path: '/management/templates', icon: ICONS.templates },
      { name: 'Integrations', path: '/management/integrations', icon: ICONS.integrations },
      { name: 'Settings', path: '/management/settings', icon: ICONS.settings },
      { name: 'Billing & Plans', path: '/management/billing', icon: ICONS.billing },
    ];

    const resourcesLinks = [
        { name: 'Knowledge Base', path: '/resources/knowledge-base', icon: ICONS.knowledgeBase },
        { name: 'Training Center', path: '/resources/training', icon: ICONS.training },
        { name: 'Support Chat', path: '/resources/support-chat', icon: ICONS.chat },
        { name: 'Contact Agency', path: '/resources/contact', icon: ICONS.email },
    ];
    
    const closeSidebar = () => setSidebarOpen(false);

    const sidebarContent = (
        <div className="w-64 bg-dark-card border-r border-dark-border flex-shrink-0 p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <span className="text-brand-accent mr-2">{ICONS.rocket}</span>
                    <h1 className="text-xl font-bold text-white">Zulari AI</h1>
                </div>
                <button 
                    onClick={closeSidebar} 
                    className="md:hidden text-dark-text-secondary hover:text-white"
                    aria-label="Close sidebar"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <nav className="flex-1 space-y-2 overflow-y-auto">
                 <NavLink 
                    to="/" 
                    end
                    onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${isActive ? 'bg-brand-primary text-white' : 'text-dark-text-secondary hover:bg-dark-border hover:text-dark-text'}`}
                  >
                    <span className="mr-4">{ICONS.dashboard}</span>
                    Dashboard
                </NavLink>
                <NavLink 
                    to="/services" 
                    onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${isActive ? 'bg-brand-primary text-white' : 'text-dark-text-secondary hover:bg-dark-border hover:text-dark-text'}`}
                  >
                    <span className="mr-4">{ICONS.custom}</span>
                    Core Services
                </NavLink>
                 <NavLink 
                    to="/microservices" 
                    onClick={closeSidebar}
                    className={({ isActive }) => `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${isActive ? 'bg-brand-primary text-white' : 'text-dark-text-secondary hover:bg-dark-border hover:text-dark-text'}`}
                  >
                    <span className="mr-4">{ICONS.fab}</span>
                    Microservices
                </NavLink>

                <NavGroup title="Management">
                    {managementLinks.map(link => (
                        <NavLink key={link.name} to={link.path} onClick={closeSidebar} className={({ isActive }) => `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 text-sm ${isActive ? 'bg-dark-border text-white' : 'text-dark-text-secondary hover:bg-dark-border hover:text-dark-text'}`}>
                            <span className="mr-4 w-5 h-5 flex items-center justify-center">{link.icon}</span>
                            {link.name}
                        </NavLink>
                    ))}
                </NavGroup>
                
                <NavGroup title="Resources">
                    {resourcesLinks.map(link => (
                        <NavLink key={link.name} to={link.path} onClick={closeSidebar} className={({ isActive }) => `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 text-sm ${isActive ? 'bg-dark-border text-white' : 'text-dark-text-secondary hover:bg-dark-border hover:text-dark-text'}`}>
                            <span className="mr-4 w-5 h-5 flex items-center justify-center">{link.icon}</span>
                            {link.name}
                        </NavLink>
                    ))}
                </NavGroup>
            </nav>
        </div>
    );
    
    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                {sidebarContent}
            </div>
            
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 transform transition-transform ease-in-out duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebarContent}
            </div>
            {sidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={closeSidebar}></div>}
        </>
    );
};

export default Sidebar;