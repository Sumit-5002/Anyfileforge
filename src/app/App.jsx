import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ScrollToTop from './ScrollToTop';
import './App.css';

// Lazy load page components for better performance and smaller initial bundle size
const HomePage = lazy(() => import('../features/home/HomePage'));
const ToolsPage = lazy(() => import('../features/tools/ToolsPage'));
const ToolDetailPage = lazy(() => import('../features/tools/ToolDetailPage'));
const PricingPage = lazy(() => import('../features/pricing/PricingPage'));
const AboutPage = lazy(() => import('../features/about/AboutPage'));
const AuthPage = lazy(() => import('../features/auth/AuthPage'));
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'));
const ProjectsPage = lazy(() => import('../features/projects/ProjectsPage'));

// Legal pages
const PrivacyPage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.TermsPage })));
const LicensePage = lazy(() => import('../features/legal/LegalPages').then(m => ({ default: m.LicensePage })));

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Suspense fallback={<div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/tools/:toolId" element={<ToolDetailPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
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
