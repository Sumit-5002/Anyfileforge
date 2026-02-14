import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../features/home/HomePage';
import ToolsPage from '../features/tools/ToolsPage';
import ToolDetailPage from '../features/tools/ToolDetailPage';
import PricingPage from '../features/pricing/PricingPage';
import AboutPage from '../features/about/AboutPage';
import DeveloperPage from '../features/about/DeveloperPage';
import AuthPage from '../features/auth/AuthPage';
import { PrivacyPage, TermsPage, LicensePage } from '../features/legal/LegalPages';
import ProfilePage from '../features/profile/ProfilePage';
import ProjectsPage from '../features/projects/ProjectsPage';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ScrollToTop from './ScrollToTop';
import './App.css';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Header />
        <main className="main-content">
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
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
