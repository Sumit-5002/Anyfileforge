import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Star, ArrowRight, Github, Zap, Shield, Lock,
    FileText, Image as ImageIcon, Play, Layers,
    Code, FlaskConical
} from 'lucide-react';
import ToolCard from '../../components/ui/ToolCard';
import { TOOLS } from '../../data/toolsData';
import SeoHead from '../../components/meta/SeoHead';
import { useMode } from '../../contexts/ModeContext';
import './HomePage.css';

function HomePage() {
    const { t } = useTranslation();
    const { effectiveMode } = useMode();
    const navigate = useNavigate();
    const showcaseRef = useRef(null);
    const [activeTab, setActiveTab] = useState('pdf');

    const visibleGroups = (TOOLS[activeTab] || [])
        .filter((group) => group.tools.length > 0);

    const handleToolSelect = (id) => {
        // Automatically append the smart mode determined by ModeContext
        navigate(`/tools/${id}?mode=${effectiveMode}`);
    };

    return (
        <>
            <SeoHead
                title="AnyFileForge - Professional Multi-Tool Platform"
                description="Secure offline-first processing for engineers and researchers. Automatically scales between browser-side and server-side logic."
            />
            <div className="home-page bg-mesh">
                <section className="hero bg-grid">
                    <div className="container hero-content reveal">
                        <div className="hero-badge float">
                            <Star size={14} fill="currentColor" />
                            <span>Adaptive Scientific Processing</span>
                        </div>
                        <h1 className="hero-title">
                            Forge Any <span className="forge-text">Data</span>
                        </h1>
                        <p className="hero-subtitle">
                           High-performance browserside tools with seamless server-fallback for complex tasks.
                        </p>
                        
                        <div className="hero-actions">
                            <button
                                className="btn btn-primary btn-large"
                                onClick={() => showcaseRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Get Started
                                <ArrowRight size={20} />
                            </button>
                            <div className="connection-status d-flex align-items-center gap-2 mt-4 px-4 py-2 bg-glass border-glass rounded-full text-xs font-bold opacity-75">
                                <Zap size={14} className={effectiveMode === 'online' ? 'text-warning' : 'text-muted'} />
                                <span>SYSTEM STATUS: {effectiveMode === 'online' ? 'CONNECTED (ACCELERATED)' : 'OFFLINE (AUTO-FLIGHT)'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section ref={showcaseRef} className="tools-showcase bg-grid">
                    <div className="container">
                        <div className="showcase-header">
                            <div className="tab-switcher">
                                {[
                                    { id: 'pdf', icon: FileText, label: 'PDF Suite' },
                                    { id: 'image', icon: ImageIcon, label: 'Image Engine' },
                                    { id: 'engineer', icon: Code, label: 'Engineer Labs' },
                                    { id: 'researcher', icon: FlaskConical, label: 'Data Researcher' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <tab.icon size={20} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {visibleGroups.map((catGroup, idx) => (
                            <div key={idx} className="tool-category-group fade-in">
                                <h3 className="category-title">{catGroup.category}</h3>
                                <div className="tools-grid">
                                    {catGroup.tools.map((tool) => (
                                        <ToolCard
                                            key={tool.id}
                                            tool={{
                                                ...tool,
                                                mode: effectiveMode === 'online' ? 'server' : 'serverless'
                                            }}
                                            onClick={() => handleToolSelect(tool.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

export default HomePage;
