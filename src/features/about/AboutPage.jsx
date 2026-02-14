import React from 'react';
import { Shield, Lock, Code, Users, Heart, Github, ExternalLink } from 'lucide-react';
import SeoHead from '../../components/meta/SeoHead';
import './AboutPage.css';

function AboutPage() {
    // ... values and stats arrays ...
    const values = [
        {
            icon: Shield,
            title: 'Local-Only Processing',
            description: "Unlike other tools, we don't upload your files. All processing happens in your browser memory. Your privacy is mathematically guaranteed."
        },
        {
            icon: Code,
            title: 'Open Source',
            description: 'Audit our code on GitHub to verify our "No-Upload" policy. We have nothing to hide.'
        },
        {
            icon: Lock,
            title: 'Zero Data Retention',
            description: 'Since we never receive your files, we have nothing to store or delete. Your data stays on your machine.'
        },
        {
            icon: Users,
            title: 'For Engineers',
            description: 'Built for those who understand the risks of cloud processing. Keep your intellectual property on your machine.'
        }
    ];

    const stats = [
        { value: '100%', label: 'Browser-Based' },
        { value: '0MB', label: 'Uploaded to Server' },
        { value: 'Instant', label: 'Processing' },
        { value: 'Privacy', label: 'First' }
    ];

    return (
        <>
            <SeoHead
                title="About Us - AnyFileForge"
                description="We are re-inventing file processing. 100% client-side, zero data collection, and open source values."
            />
            <div className="about-page bg-mesh">
                {/* Hero Section */}
                <section className="about-hero bg-grid">
                    <div className="container">
                        <h1 className="page-title">Why AnyFileForge is Different</h1>
                        <p className="page-subtitle">
                            Most PDF tools on the web upload your private documents to their servers.
                            <strong> We don't.</strong> Your files never leave your device.
                        </p>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="stats-section">
                    <div className="container">
                        <div className="stats-grid">
                            {stats.map((stat, index) => (
                                <div key={index} className="stat-card card">
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Comparison Section */}
                <section className="comparison-section container">
                    <h2 className="section-title text-center">Cloud Processing vs. AnyFileForge</h2>
                    <div className="comparison-grid">
                        <div className="comparison-item card">
                            <h3>Standard Cloud Tools</h3>
                            <ul className="comparison-list">
                                <li>❌ Uploads files to remote servers</li>
                                <li>❌ Limited by internet upload speeds</li>
                                <li>❌ Files stored for 2+ hours</li>
                                <li>❌ Risk of data breach on server</li>
                            </ul>
                        </div>
                        <div className="comparison-item card highlight">
                            <h3>AnyFileForge (Local)</h3>
                            <ul className="comparison-list">
                                <li>✅ Processing happens in your RAM</li>
                                <li>✅ Lightning fast (local disk speeds)</li>
                                <li>✅ Files never exist on a server</li>
                                <li>✅ 100% private and secure</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="values-section">
                    <div className="container">
                        <h2 className="section-title text-center">Our Core Principles</h2>
                        <div className="values-grid">
                            {values.map((value, index) => (
                                <div key={index} className="value-card card">
                                    <div className="value-icon">
                                        <value.icon size={32} color="var(--primary-500)" strokeWidth={2} />
                                    </div>
                                    <h3 className="value-title">{value.title}</h3>
                                    <p className="value-description">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="faq-section container">
                    <h2 className="section-title text-center">Common Questions</h2>
                    <div className="faq-grid">
                        <div className="faq-item">
                            <h4>Do you keep a copy of my processed files?</h4>
                            <p>No. In fact, we couldn't if we wanted to. All processing code runs in your browser (JS). We don't even have a backend database for files.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Is it safe for company documents?</h4>
                            <p>It's the safest method possible. Since data never crosses the network, it satisfies almost all corporate data sovereignty policies.</p>
                        </div>
                        <div className="faq-item">
                            <h4>What are the system requirements?</h4>
                            <p>Any modern browser (Chrome, Firefox, Safari, Edge). Because processing is local, a device with 4GB+ RAM is recommended for large PDFs.</p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

export default AboutPage;
