
// Use this file to map your complex file structure to a Simplified Module System (SMS)
// This makes imports cleaner and easier to manage

// 1. Pages
export { default as HomePage } from './pages/HomePage';
export { default as ToolsPage } from './pages/ToolsPage';
export { default as ToolDetailPage } from './pages/ToolDetailPage';
export { default as PricingPage } from './pages/PricingPage';
export { default as AboutPage } from './pages/AboutPage';
export { default as AuthPage } from './pages/AuthPage';
export { PrivacyPage, TermsPage } from './pages/LegalPages';

// 2. Components
export { default as Header } from './components/Header';
export { default as Footer } from './components/Footer';
export { default as ToolCard } from './components/ToolCard';
export { default as FileUploader } from './components/FileUploader';
export { default as SeoHead } from './components/SeoHead';
export { default as InstallPwa } from './components/InstallPwa';

// 3. Constants & Data
export { TOOLS } from './constants/toolsData';

// 4. Services
export { default as feedbackService } from './services/feedbackService';

// 5. Contexts & Hooks
export { useAuth } from './contexts/AuthContext';
