import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import serverProcessingService from '../services/serverProcessingService';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ScrollToTop from './ScrollToTop';
import './App.css';

// Lazy load components for performance optimization (Bolt ⚡)
const HomePage = lazy(() => import('../features/home/HomePage'));
const ToolsPage = lazy(() => import('../features/tools/ToolsPage'));
const ToolDetailPage = lazy(() => import('../features/tools/ToolDetailPage'));
const PricingPage = lazy(() => import('../features/pricing/PricingPage'));
const AboutPage = lazy(() => import('../features/about/AboutPage'));
const DeveloperPage = lazy(() => import('../features/about/DeveloperPage'));
const AuthPage = lazy(() => import('../features/auth/AuthPage'));
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'));
const ProjectsPage = lazy(() => import('../features/projects/ProjectsPage'));

// Lazy load named exports
const PrivacyPage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.TermsPage })));
const LicensePage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.LicensePage })));

const PREMIUM_KEEP_ALIVE_MS = Number(import.meta.env.VITE_PREMIUM_KEEP_ALIVE_MS) || 8 * 60 * 1000;

function App() {
  const { userData } = useAuth();

  useEffect(() => {
    if (userData?.tier !== 'premium') return undefined;

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
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/tools/:toolId" element={<ToolDetailPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/developer" element={<DeveloperPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/license" element={<LicensePage />} />
              <Route path="/login" element={<AuthPage initialMode="login" />} />
              <Route path="/signup" element={<AuthPage initialMode="signup" />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
