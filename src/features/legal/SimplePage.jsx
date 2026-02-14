import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Lock } from 'lucide-react';
import './SimplePage.css';

function SimplePage({ title, lastUpdated, content }) {
    return (
        <div className="simple-page bg-mesh">
            <div className="container">
                <Link to="/" className="back-link">
                    <ArrowLeft size={16} />
                    Back to home
                </Link>

                <div className="simple-content-wrapper fade-in">
                    <div className="simple-header">
                        <h1>{title}</h1>
                        <p className="last-updated">Last updated: {lastUpdated}</p>
                    </div>

                    <div className="simple-body">
                        {content.map((section, idx) => (
                            <section key={idx} className="simple-section">
                                <h3>{section.heading}</h3>
                                <p>{section.text}</p>
                                {section.list && (
                                    <ul>
                                        {section.list.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </div>

                    <div className="simple-footer">
                        <div className="privacy-badge">
                            <Shield size={20} />
                            <span>100% Client-Side Processing</span>
                        </div>
                        <p>Questions? Contact us at <a href="mailto:privacy@anyfileforge.com">privacy@anyfileforge.com</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SimplePage;
