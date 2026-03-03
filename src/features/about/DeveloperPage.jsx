import React from 'react';
import { Github, Mail, Cpu, Heart, Coffee, Terminal, Linkedin } from 'lucide-react';
import SeoHead from '../../components/meta/SeoHead';
import './DeveloperPage.css';

function DeveloperPage() {
    const profileImageSrc = `${import.meta.env.BASE_URL}PROFILE.png`;

    return (
        <>
            <SeoHead
                title="About the Developer - AnyFileForge"
                description="Meet the mind behind AnyFileForge. Sumit's mission to bring privacy and local-first processing to everyone."
            />
            <div className="developer-page bg-mesh">
                <div className="container">
                    <div className="dev-hero-section slide-up">
                        <div className="dev-avatar-wrapper">
                            <div className="dev-avatar">
                                <img src={profileImageSrc} alt="Sumit" width="180" height="180" decoding="async" fetchPriority="high" />
                                <div className="dev-status-pulse"></div>
                            </div>
                        </div>
                        <h1 className="dev-name">Sumit</h1>
                        <p className="dev-title">Full-Stack Software Engineer</p>
                        <p className="dev-tagline">"Crafting high-performance digital solutions with precision."</p>

                        <div className="dev-social-stack">
                            <a href="https://github.com/Sumit-5002" target="_blank" rel="noopener noreferrer" className="dev-social-link">
                                <Github size={20} />
                                <span>GitHub</span>
                            </a>
                            <a href="https://linkedin.com/in/sumit-prasad-bce2005" target="_blank" rel="noopener noreferrer" className="dev-social-link">
                                <Linkedin size={20} />
                                <span>LinkedIn</span>
                            </a>
                            <a href="mailto:sumitboy2005@gmail.com" className="dev-social-link">
                                <Mail size={20} />
                                <span>Email</span>
                            </a>
                        </div>
                    </div>

                    <div className="dev-content-grid">
                        <div className="dev-card main-bio fade-in">
                            <div className="card-header">
                                <Terminal size={24} color="var(--primary-500)" />
                                <h3>The Vision</h3>
                            </div>
                            <p>
                                I started <strong>AnyFileForge</strong> because I was tired of "free" file converters that silently profit from user data.
                                In an era where privacy is a luxury, I wanted to build a suite of tools that runs entirely on <em>your</em> device.
                            </p>
                            <p>
                                Every line of code in this project is written with <strong>Local-First</strong> principles. No cloud overhead,
                                no tracking, just pure performance and privacy.
                            </p>
                        </div>

                        <div className="dev-card tech-stack fade-in">
                            <div className="card-header">
                                <Cpu size={24} color="var(--accent-yellow)" />
                                <h3>Tech Stack</h3>
                            </div>
                            <div className="tech-tags">
                                <span className="tech-tag">React.js</span>
                                <span className="tech-tag">Vite</span>
                                <span className="tech-tag">Firebase</span>
                                <span className="tech-tag">WebAssembly</span>
                                <span className="tech-tag">Lucide Icons</span>
                                <span className="tech-tag">Vanilla CSS</span>
                            </div>
                        </div>

                        <div className="dev-card mission-card fade-in">
                            <div className="card-header">
                                <Heart size={24} color="#ef4444" />
                                <h3>The Mission</h3>
                            </div>
                            <p>
                                To decentralize data processing. By keeping computation client-side, we reduce server costs
                                and increase user security. AnyFileForge is a testament to what modern browsers are capable of.
                            </p>
                        </div>
                    </div>

                    <div className="dev-footer-cta slide-up">
                        <h2>Want to collaborate?</h2>
                        <p>I'm always open to discussing open-source projects or privacy-focused ventures.</p>
                        <div className="cta-actions">
                            <a href="mailto:sumitboy2005@gmail.com" className="btn btn-primary btn-large">
                                <Mail size={20} />
                                Get in Touch
                            </a>
                            <a href="https://github.com/Sumit-5002" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-large">
                                <Coffee size={20} />
                                Support my Work
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default DeveloperPage;
