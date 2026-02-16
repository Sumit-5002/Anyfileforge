import React from 'react';
import { Shield, Lock, Code, Users, Heart, Github, ExternalLink } from 'lucide-react';
import SeoHead from '../../components/meta/SeoHead';
import './AboutPage.css';

function AboutPage() {
    // ... values and stats arrays ...
    const values = [
        {
            icon: Shield,
            title: 'Offline-First Processing',
            description: 'Offline mode is fully serverless and runs in your browser memory. Online server mode is optional for paid heavy workloads.'
        },
        {
            icon: Code,
            title: 'Open Source',
            description: 'Audit our code on GitHub to verify offline-first processing and the boundaries of paid online server features.'
        },
        {
            icon: Lock,
            title: 'Controlled Data Retention',
            description: 'Offline mode retains nothing on our servers. Online mode can optionally store results for future work if you choose paid storage.'
        },
        {
            icon: Users,
            title: 'For Engineers',
            description: 'Built for those who understand the risks of cloud processing. Keep your intellectual property on your machine.'
        }
    ];

    const stats = [
        { value: '100%', label: 'Browser-Based' },
        { value: '0MB', label: 'Offline Upload' },
        { value: 'Instant', label: 'Processing' },
        { value: 'Privacy', label: 'First' }
    ];

    return (
        <>
            <SeoHead
                title="About Us - AnyFileForge"
                description="We are re-inventing file processing with free offline serverless tools and paid online server tools for large and advanced workloads."
            />
            <div className="about-page bg-mesh">
                {/* Hero Section */}
                <section className="about-hero bg-grid">
                    <div className="container">
                        <h1 className="page-title">Why AnyFileForge is Different</h1>
                        <p className="page-subtitle">
                            Most tools force cloud upload. We support both modes:
                            <strong> free offline serverless processing</strong> and
                            <strong> paid online server processing</strong> for large or advanced jobs.
                        </p>
                        <div className="dev-notice-box" style={{
                            marginTop: '24px',
                            padding: '16px',
                            background: 'rgba(250, 204, 21, 0.05)',
                            border: '1px solid rgba(250, 204, 21, 0.2)',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            color: 'var(--accent-yellow)',
                            maxWidth: '600px',
                            marginInline: 'auto',
                            textAlign: 'center'
                        }}>
                            <strong>Beta Phase:</strong> Our mission is 100% Local-First. Currently, 70% of tools run entirely in-browser. We are engineering the remaining 30% to move from server-side to client-side WebAssembly.
                        </div>
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
                                <li>❌ Requires cloud upload for all tasks</li>
                                <li>❌ Limited by internet upload speeds</li>
                                <li>❌ No true offline fallback</li>
                                <li>❌ Risk of data breach on server</li>
                            </ul>
                        </div>
                        <div className="comparison-item card highlight">
                            <h3>AnyFileForge (Local)</h3>
                            <ul className="comparison-list">
                                <li>✅ Free offline mode for local processing</li>
                                <li>✅ Paid online mode for large/heavy processing</li>
                                <li>✅ Cloud uploads (Drive/Dropbox/OneDrive) in online mode</li>
                                <li>✅ Optional server storage only when requested</li>
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
                            <p>Offline mode: no, files stay local. Online mode: we only retain files if you opt in to paid storage for future reuse.</p>
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
