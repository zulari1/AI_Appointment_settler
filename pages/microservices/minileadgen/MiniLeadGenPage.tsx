import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import OverviewPage from './OverviewPage';
import HunterPage from './HunterPage';
import ResearcherPage from './ResearcherPage';
import PersonalizerPage from './PersonalizerPage';
import OutreachPage from './OutreachPage';
import ReplierPage from './ReplierPage';
import ReplierTrainingPage from './ReplierTrainingPage';
import { ICONS } from '../../../constants';

// FIX: Explicitly type the icon property as React.ReactElement to allow cloning with new props.
const agentNavLinks: { path: string, name: string, icon: React.ReactElement }[] = [
    { path: '/microservices/mini-leads', name: 'Overview', icon: ICONS.dashboard },
    { path: '/microservices/mini-leads/hunter', name: 'Hunter', icon: ICONS.research },
    { path: '/microservices/mini-leads/researcher', name: 'Researcher', icon: ICONS.dna },
    { path: '/microservices/mini-leads/personalizer', name: 'Personalizer', icon: ICONS.email },
    { path: '/microservices/mini-leads/outreach', name: 'Outreach', icon: ICONS.paperPlane },
    { path: '/microservices/mini-leads/replier', name: 'Replier', icon: ICONS.reply },
    { path: '/microservices/mini-leads/replier-training', name: 'Replier Training', icon: ICONS.training },
];

const MiniLeadGenPage: React.FC = () => {
    const location = useLocation();
    
    // Find the current page's title from the nav links
    const getPageTitle = () => {
        const currentLink = agentNavLinks.find(link => location.pathname.startsWith(link.path) && (link.path !== '/microservices/mini-leads' || location.pathname === '/microservices/mini-leads'));
        if (currentLink) return currentLink.name;
        return 'Overview';
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <span className="text-brand-accent">{ICONS.leads}</span>
                    <span>Mini Lead Gen: {getPageTitle()}</span>
                </h1>
                <p className="text-dark-text-secondary mt-1">Four-agent pipeline to find, enrich, personalize, and contact new leads.</p>
            </header>

            <nav className="flex space-x-1 border-b border-dark-border overflow-x-auto pb-1">
                {agentNavLinks.map((link, index) => (
                     <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.path === '/microservices/mini-leads'}
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 flex-shrink-0 ${
                                isActive
                                    ? 'border-brand-primary text-white'
                                    : 'border-transparent text-dark-text-secondary hover:bg-dark-card hover:border-dark-border'
                            }`
                        }
                    >
                        {/* FIX: Cast props to 'any' to resolve TypeScript error with cloneElement and SVG props. */}
                        {React.cloneElement(link.icon, {className: 'h-4 w-4'})}
                        <span>
                           {link.name}
                        </span>
                    </NavLink>
                ))}
            </nav>

            <div className="pt-2">
                <Routes>
                    <Route index element={<OverviewPage />} />
                    <Route path="hunter" element={<HunterPage />} />
                    <Route path="researcher" element={<ResearcherPage />} />
                    <Route path="personalizer" element={<PersonalizerPage />} />
                    <Route path="outreach" element={<OutreachPage />} />
                    <Route path="replier" element={<ReplierPage />} />
                    <Route path="replier-training" element={<ReplierTrainingPage />} />
                </Routes>
            </div>
        </div>
    );
};

export default MiniLeadGenPage;