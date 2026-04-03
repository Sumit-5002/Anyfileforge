import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Star, ArrowRight, Github, Zap, Shield, Lock,
    FileText, Image as ImageIcon, Play, Layers,
    Code, FlaskConical, Linkedin, FileSpreadsheet, Music, Boxes, FileCode
} from 'lucide-react';
import ToolCard from '../../components/ui/ToolCard';
import GoogleAd from '../../components/ui/GoogleAd';
import { TOOLS } from '../../data/toolsData';
import SeoHead from '../../components/meta/SeoHead';
import ROUTES from '../../config/routes';
import './HomePage.css';
function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const showcaseRef = useRef(null);
    const [activeTab, setActiveTab] = useState('pdf');

    const visibleGroups = (TOOLS[activeTab] || [])
        .filter((group) => group.tools.length > 0);

    const handleToolSelect = (id) => {
        // Enforce 100% Offline Mode for all individual tools
        navigate(`/tools/${id}?mode=offline`);
    };

    return (
        <>
            <SeoHead
                title="AnyFileForge - The Ultimate Free File Processing Platform"
                description="Free offline serverless tools for PDFs and images, plus paid online server mode for large files and advanced processing."
            />
            <div className="home-page bg-mesh">
                {/* Hero Section */}
                <section className="hero bg-grid">
                    <div className="container hero-content reveal">
                        <div className="hero-badge float">
                            <Star size={14} fill="currentColor" />
                            <span>The Engineer's Choice for Any File</span>
                        </div>
                        <h1 className="hero-title">
                            {t('common.heroTitle')} <span className="forge-text">Files</span>
                        </h1>
                        <p className="hero-subtitle">
                            {t('common.heroSubtitle')}
                        </p>
                        <div className="hero-actions">
                            <button
                                className="btn btn-primary btn-large"
                                onClick={() => showcaseRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                {t('common.exploreBtn')}
                                <ArrowRight size={20} />
                            </button>
                            <a href="https://github.com/Sumit-5002/Anyfileforge" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-large">
                                <Github size={20} />
                                Source Code
                            </a>
                        </div>
                    </div>
                </section>

                {/* Tools Showcase */}
                <section ref={showcaseRef} className="tools-showcase bg-grid">
                    <div className="container">
                        <div className="showcase-header">
                            <div className="tab-switcher">
                                <button
                                    className={`tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('pdf')}
                                >
                                    <FileText size={20} />
                                    {t('common.pdfTools', 'PDF Suite')}
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('image')}
                                >
                                    <ImageIcon size={20} />
                                    {t('common.imageTools', 'Image Engine')}
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'engineer' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('engineer')}
                                >
                                    <Code size={20} />
                                    Engineer Labs
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'researcher' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('researcher')}
                                >
                                    <FlaskConical size={20} />
                                    Researcher
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('media')}
                                >
                                    <Layers size={20} />
                                    Universal
                                </button>
                            </div>

                            <h2 className="section-title text-center">
                                {activeTab === 'pdf' && 'The Ultimate PDF Suite'}
                                {activeTab === 'image' && 'Your High-Performance Image Engine'}
                                {activeTab === 'engineer' && 'Essential Engineer Labs'}
                                {activeTab === 'researcher' && 'Scientific Data Forge'}
                            </h2>
                            <p className="section-subtitle text-center">
                                {activeTab === 'pdf' && '100% FREE tools to Merge, Split, Compress, Convert and Edit PDFs.'}
                                {activeTab === 'image' && 'Optimize, Resize, Crop and Transform your images with ease.'}
                                {activeTab === 'engineer' && 'Format, validate, and convert code and data structures.'}
                                {activeTab === 'researcher' && 'Analyze data, manage citations, and generate plots instantly.'}
                                {activeTab === 'media' && 'Universal suite for documents, spreadsheets, audio, and 3D models.'}
                            </p>
                        </div>

                        {visibleGroups.map((catGroup, idx) => (
                            <div key={idx} className="tool-category-group fade-in">
                                <h3 className="category-title">
                                    {catGroup.category}
                                </h3>
                                <div className="tools-grid">
                                    {catGroup.tools.map((tool) => (
                                        <ToolCard
                                            key={tool.id}
                                            tool={{
                                                ...tool,
                                                mode: 'serverless'
                                            }}
                                            onClick={() => handleToolSelect(tool.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="workflow-teaser card card-sweep fade-in">
                            <div className="workflow-content">
                                <Layers size={32} color="var(--primary-500)" />
                                <div className="workflow-text">
                                    <h3>Automated Workflows (Supporter)</h3>
                                    <p>Chain multiple tools in a server-side pipeline. Industry-grade speed for large datasets.</p>
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={() => navigate(ROUTES.SUPPORT)}>
                                Support the Forge
                                <Play size={16} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Google Ad Slot */}
                <div className="container" style={{ margin: '2rem auto' }}>
                    <GoogleAd slot="YOUR_AD_SLOT_ID_HERE" />
                </div>

                {/* Features Section */}
                <section className="features-section">
                    <div className="container">
                        <div className="features-grid">
                            <div className="feature-card card card-sweep slide-up" style={{ animationDelay: '0.1s' }}>
                                <div className="feature-icon-wrapper">
                                    <Shield size={24} />
                                </div>
                                <h3 className="feature-title">Privacy by Design</h3>
                                <p className="feature-description">
                                    Zero data retention. Your files are processed locally using modern client-side technologies.
                                </p>
                            </div>
                            <div className="feature-card card card-sweep slide-up" style={{ animationDelay: '0.2s' }}>
                                <div className="feature-icon-wrapper">
                                    <Zap size={24} />
                                </div>
                                <h3 className="feature-title">Instant Results</h3>
                                <p className="feature-description">
                                    No waiting in queues. Direct processing for immediate productivity spikes in your workflow.
                                </p>
                            </div>
                            <div className="feature-card card card-sweep slide-up" style={{ animationDelay: '0.3s' }}>
                                <div className="feature-icon-wrapper">
                                    <Lock size={24} />
                                </div>
                                <h3 className="feature-title">End-to-End Secure</h3>
                                <p className="feature-description">
                                    Industry-standard encryption for all premium cloud storage operations and transfers.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

export default HomePage;
