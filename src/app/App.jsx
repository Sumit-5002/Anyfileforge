import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import serverProcessingService from '../services/serverProcessingService';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ScrollToTop from './ScrollToTop';
import HomePage from '../features/home/HomePage';
import ROUTES from '../config/routes';
import './App.css';

// Lazy load components for performance optimization (Bolt ⚡)
const ToolsPage = lazy(() => import('../features/tools/ToolsPage'));
const ToolDetailPage = lazy(() => import('../features/tools/ToolDetailPage'));
const PricingPage = lazy(() => import('../features/pricing/PricingPage'));
const AboutPage = lazy(() => import('../features/about/AboutPage'));
const DeveloperPage = lazy(() => import('../features/about/DeveloperPage'));
const AuthPage = lazy(() => import('../features/auth/AuthPage'));
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'));
const ProjectsPage = lazy(() => import('../features/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('../features/projects/ProjectDetailPage'));
const NotFoundPage = lazy(() => import('../features/error/NotFoundPage'));


// Lazy load named exports
const PrivacyPage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.TermsPage })));
const LicensePage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.LicensePage })));
const SecurityPage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.SecurityPage })));


const PREMIUM_KEEP_ALIVE_MS = Number(import.meta.env.VITE_PREMIUM_KEEP_ALIVE_MS) || 8 * 60 * 1000;

function App() {
  const { userData } = useAuth();
  const location = useLocation();
  const isToolView = location.pathname.startsWith('/tools/') && location.pathname !== '/tools';

  // Ignore Firebase internal auth paths to avoid 404
  if (location.pathname.startsWith('/__/')) return null;

  useEffect(() => {
    if (userData?.tier !== 'supporter' && userData?.tier !== 'enterprise') return undefined;

    const pingServer = async () => {
      try {
        const onlineMode = window.localStorage.getItem('anyfileforge_mode') === 'online';
        if (!onlineMode) return;
        await serverProcessingService.keepAlive();
      } catch {
        // Keep-alive should not block the UI on transient network failures.
      }
    };

    pingServer();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        pingServer();
      }
    }, PREMIUM_KEEP_ALIVE_MS);

    const onFocus = () => {
      pingServer();
    };

    const onModeChange = () => {
      pingServer();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('anyfileforge-mode-changed', onModeChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('anyfileforge-mode-changed', onModeChange);
    };
  }, [userData?.tier]);

  return (
    <>
      <ScrollToTop />
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path={ROUTES.HOME}           element={<HomePage />} />
              <Route path={ROUTES.TOOLS}          element={<ToolsPage />} />
              <Route path={ROUTES.TOOL_DETAIL}    element={<ToolDetailPage />} />
              <Route path={ROUTES.SUPPORT}        element={<PricingPage />} />
              <Route path={ROUTES.ABOUT}          element={<AboutPage />} />
              <Route path={ROUTES.DEVELOPER}      element={<DeveloperPage />} />
              <Route path={ROUTES.PRIVACY}        element={<PrivacyPage />} />
              <Route path={ROUTES.SECURITY}       element={<SecurityPage />} />
              <Route path={ROUTES.TERMS}          element={<TermsPage />} />
              <Route path={ROUTES.LICENSE}        element={<LicensePage />} />
              <Route path={ROUTES.LOGIN}          element={<AuthPage initialMode="login" />} />
              <Route path={ROUTES.SIGNUP}         element={<AuthPage initialMode="signup" />} />
              <Route path={ROUTES.RESET}          element={<AuthPage initialMode="forgot-password" />} />
              <Route path={ROUTES.PROFILE}        element={<ProfilePage />} />
              <Route path={ROUTES.PROJECTS}       element={<ProjectsPage />} />
              <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
              <Route path="/__/auth/*"             element={null} />
              <Route path="*"                     element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        {!isToolView && <Footer />}
      </div>
    </>
  );
}

export default App;
