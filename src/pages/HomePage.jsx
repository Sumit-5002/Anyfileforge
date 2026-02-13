import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Star, ArrowRight, Github, Zap, Shield, Lock,
    FileText, Image as ImageIcon, Play, Layers
} from 'lucide-react';
import { ToolCard, TOOLS, SeoHead } from '../index';
import './HomePage.css';

function HomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const showcaseRef = useRef(null);
    const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' or 'image'

    const handleToolSelect = (id) => {
        navigate(`/tools/${id}`);
    };

    return (
        <>
            <SeoHead
                title="AnyFileForge - The Ultimate Free File Processing Platform"
                description="Merge, split, compress, and edit PDFs and images completely client-side. Fast, secure, and 100% private. No uploads, no waiting."
            />
            <div className="home-page bg-mesh">
                {/* Hero Section */}
                <section className="hero bg-grid">
                    <div className="container hero-content fade-in">
                        <div className="hero-badge">
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
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-large">
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
                                    {t('common.pdfTools')}
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('image')}
                                >
                                    <ImageIcon size={20} />
                                    {t('common.imageTools')}
                                </button>
                            </div>
                            <h2 className="section-title text-center">
                                {activeTab === 'pdf' ? 'The Ultimate PDF Toolkit' : 'Your Professional Photo Editor'}
                            </h2>
                            <p className="section-subtitle text-center">
                                {activeTab === 'pdf'
                                    ? '100% FREE tools to Merge, Split, Compress, Convert and Edit PDFs.'
                                    : 'Optimize, Resize, Crop and Transform your images with ease.'}
                            </p>
                        </div>

                        {TOOLS[activeTab].map((catGroup, idx) => (
                            <div key={idx} className="tool-category-group fade-in">
                                <h3 className="category-title">
                                    {catGroup.category}
                                </h3>
                                <div className="tools-grid">
                                    {catGroup.tools.map((tool) => (
                                        <ToolCard
                                            key={tool.id}
                                            tool={tool}
                                            onClick={() => handleToolSelect(tool.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="workflow-teaser card fade-in">
                            <div className="workflow-content">
                                <Layers size={32} color="var(--primary-500)" />
                                <div className="workflow-text">
                                    <h3>Create a custom Workflow</h3>
                                    <p>Combine multiple tools into one automated pipeline. Perfect for repetitive tasks.</p>
                                </div>
                            </div>
                            <button className="btn btn-primary">
                                {t('common.startNow')}
                                <Play size={16} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="features-section">
                    <div className="container">
                        <div className="features-grid">
                            <div className="feature-card card slide-up" style={{ animationDelay: '0.1s' }}>
                                <div className="feature-icon-wrapper">
                                    <Shield size={24} />
                                </div>
                                <h3 className="feature-title">Privacy by Design</h3>
                                <p className="feature-description">
                                    Zero data retention. Your files are processed locally using modern client-side technologies.
                                </p>
                            </div>
                            <div className="feature-card card slide-up" style={{ animationDelay: '0.2s' }}>
                                <div className="feature-icon-wrapper">
                                    <Zap size={24} />
                                </div>
                                <h3 className="feature-title">Instant Results</h3>
                                <p className="feature-description">
                                    No waiting in queues. Direct processing for immediate productivity spikes in your workflow.
                                </p>
                            </div>
                            <div className="feature-card card slide-up" style={{ animationDelay: '0.3s' }}>
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
