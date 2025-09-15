
import React, { useState, useEffect } from 'react';
import { HashRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import ErrorBoundary from './components/ErrorBoundary';

// AI Service Pages
import ServicesHubPage from './pages/services/ServicesHubPage';
import ResearchAgentPage from './pages/ResearchAgentPage';
import WebAssistantServicePage from './pages/WebAssistantServicePage';
import CustomerSupportAIDashboardPage from './pages/CustomerSupportAIDashboardPage';
import SalesAIAgentDashboardPage from './pages/SalesAIAgentDashboardPage';
import LeadGenerationPage from './pages/leadgen'; // New Core Lead Gen
import CustomSolutionPage from './pages/CustomSolutionPage';
import CalendarAIPage from './pages/CalendarAIPage';
import CRMDashboardPage from './pages/CRMDashboardPage';
import InfluencerResearchPage from './pages/InfluencerResearchPage';
import SEOPage from './pages/services/SEOPage';
import AiReadinessAuditPage from './pages/services/AiReadinessAuditPage';


// Microservices Pages
import MicroservicesHubPage from './pages/microservices/MicroservicesHubPage';
import WebsiteScorecardPage from './pages/microservices/WebsiteScorecardPage';
import EmailRewritePage from './pages/microservices/audit/EmailRewritePage';
import StrategyCallPage from './pages/microservices/StrategyCallPage';
import SimulatorPage from './pages/microservices/SimulatorPage';
import MiniLeadGenPage from './pages/microservices/MiniLeadGenPage';


// Management Pages
import TeamPage from './pages/management/TeamPage';
import DocumentsPage from './pages/management/DocumentsPage';
import EmailTemplatesPage from './pages/management/EmailTemplatesPage';
import IntegrationsPage from './pages/management/IntegrationsPage';
import SettingsPage from './pages/management/SettingsPage';
import BillingPage from './pages/management/BillingPage';

// Resources Pages
import KnowledgeBasePage from './pages/resources/KnowledgeBasePage';
import TrainingPage from './pages/resources/TrainingPage';
import SupportChatPage from './pages/resources/SupportChatPage';
import ContactPage from './pages/resources/ContactPage';

// Other Pages
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import AiAssistant from './components/AiAssistant';
import { useAuth } from './hooks/useAuth';interface ProtectedRouteProps {
  children: React.ReactNode;
}


const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { loading, hasAccess } = useAuth();
    const navigate = useNavigate();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // compute hasAccess only after user and permission checks complete
        if (typeof hasAccess === 'boolean') setReady(true);
    }, [hasAccess]);

    useEffect(() => {
        if (!ready) return; // WAIT until readiness
        if (hasAccess === false) {
            navigate('/dashboard', { replace: true });
        }
    }, [ready, hasAccess, navigate]);

    if (loading || !ready || hasAccess !== true) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return <>{children}</>;
};

const MainLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ErrorBoundary>
            <div className="flex h-screen bg-dark-bg text-dark-text">
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header setSidebarOpen={setSidebarOpen} />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-dark-bg p-4 md:p-8">
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            
                            {/* Core AI Services */}
                            <Route path="/services" element={<ServicesHubPage />} />
                            <Route path="/services/research-ai" element={<ResearchAgentPage />} />
                            <Route path="/services/web-ai" element={<WebAssistantServicePage />} />
                            <Route path="/services/support-ai" element={<CustomerSupportAIDashboardPage />} />
                            <Route path="/services/sales-ai" element={<SalesAIAgentDashboardPage />} />
                            <Route path="/services/lead-gen" element={<Navigate to="/leadgen" />} />
                            <Route path="/services/custom-solution" element={<CustomSolutionPage />} />
                            <Route path="/services/calendar-ai" element={<CalendarAIPage />} />
                            <Route path="/services/crm-automation" element={<CRMDashboardPage />} />
                            <Route path="/services/influencer-research" element={<InfluencerResearchPage />} />
                            <Route path="/services/seo-optimization" element={<SEOPage />} />
                            <Route path="/services/ai-readiness-audit" element={<AiReadinessAuditPage />} />

                            {/* New Core Lead Gen Route */}
                            <Route path="/leadgen/*" element={<LeadGenerationPage />} />

                            {/* Microservices */}
                            <Route path="/microservices" element={<MicroservicesHubPage />} />
                            <Route path="/microservices/audit" element={<AiReadinessAuditPage />} />
                            <Route path="/microservices/scorecard" element={<WebsiteScorecardPage />} />
                            <Route path="/microservices/email-rewrite" element={<EmailRewritePage />} />
                            <Route path="/microservices/strategy-call" element={<StrategyCallPage />} />
                            <Route path="/microservices/simulator" element={<SimulatorPage />} />
                            <Route path="/microservices/mini-leads/*" element={<ProtectedRoute><MiniLeadGenPage /></ProtectedRoute>} />
                            
                            {/* Management */}
                            <Route path="/management/team" element={<TeamPage />} />
                            <Route path="/management/documents" element={<DocumentsPage />} />
                            <Route path="/management/templates" element={<EmailTemplatesPage />} />
                            <Route path="/management/integrations" element={<IntegrationsPage />} />
                            <Route path="/management/settings" element={<SettingsPage />} />
                            <Route path="/management/billing" element={<BillingPage />} />

                            {/* Resources */}
                            <Route path="/resources/knowledge-base" element={<KnowledgeBasePage />} />
                            <Route path="/resources/training" element={<TrainingPage />} />
                            <Route path="/resources/support-chat" element={<SupportChatPage />} />
                            <Route path="/resources/contact" element={<ContactPage />} />
                            
                            {/* Legacy Redirects */}
                            <Route path="/research-ai" element={<Navigate to="/services/research-ai" />} />
                            <Route path="/web-ai" element={<Navigate to="/services/web-ai" />} />
                            <Route path="/support-ai" element={<Navigate to="/services/support-ai" />} />
                            <Route path="/sales-ai" element={<Navigate to="/services/sales-ai" />} />
                            <Route path="/lead-gen" element={<Navigate to="/leadgen" />} />
                            <Route path="/custom-solution" element={<Navigate to="/services/custom-solution" />} />

                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </main>
                </div>
            </div>
            <AiAssistant />
        </ErrorBoundary>
    );
}

const App: React.FC = () => {
    return (
        <HashRouter>
            <Routes>
                <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                <Route path="/*" element={<MainLayout />} />
            </Routes>
        </HashRouter>
    );
};

export default App;