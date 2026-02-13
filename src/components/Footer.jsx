import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Github, Twitter, Mail, Heart, Send, Loader, CheckCircle, Globe } from 'lucide-react';
import feedbackService from '../services/feedbackService';
import './Footer.css';

function Footer() {
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) return;

        setStatus('submitting');
        try {
            await feedbackService.submitFeedback(formData);
            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error('Feedback error:', error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <footer className="footer bg-mesh">
            <div className="container">
                {/* Visual Feedback Section */}
                <div className="feedback-card fade-in">
                    <div className="feedback-info">
                        <h2>We Value Your <span className="forge-text">Feedback</span></h2>
                        <p>AnyFileForge is built for the global research community. Tell us how we can make your workflow faster.</p>
                        <ul className="feedback-benefits">
                            <li><CheckCircle size={14} /> Open source contributions welcome</li>
                            <li><CheckCircle size={14} /> Feature requests prioritized</li>
                            <li><CheckCircle size={14} /> 100% Secure communication</li>
                        </ul>
                    </div>

                    <form className="feedback-form" onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="input-group">
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your Name"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Your Email"
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Tell us what you think..."
                                required
                                rows="3"
                            />
                        </div>
                        <button
                            type="submit"
                            className={`btn btn-primary ${status === 'success' ? 'btn-success' : ''}`}
                            disabled={status === 'submitting' || status === 'success'}
                        >
                            {status === 'submitting' ? <Loader className="spinning" size={18} /> : status === 'success' ? <CheckCircle size={18} /> : <Send size={18} />}
                            {status === 'submitting' ? 'Processing...' : status === 'success' ? 'Sent Successfully!' : 'Send Feedback'}
                        </button>
                    </form>
                </div>

                <div className="footer-content">
                    <div className="footer-section">
                        <h4 className="footer-heading">AnyFileForge</h4>
                        <p className="footer-text">The ultimate local-first file utility for engineers and researchers. Privacy guaranteed by mathematics.</p>
                        <div className="social-links">
                            <a href="https://github.com" className="social-link"><Github size={20} /></a>
                            <a href="https://twitter.com" className="social-link"><Twitter size={20} /></a>
                            <a href="mailto:contact@anyfileforge.com" className="social-link"><Mail size={20} /></a>
                        </div>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-heading">Solutions</h4>
                        <ul className="footer-links">
                            <li><Link to="/tools">PDF Suite</Link></li>
                            <li><Link to="/tools">Image Engine</Link></li>
                            <li><Link to="/tools">Data Converter</Link></li>
                            <li><Link to="/about">About AnyFile</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-heading">Legal</h4>
                        <ul className="footer-links">
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                            <li><Link to="/terms">Terms of Use</Link></li>
                            <li><Link to="/privacy">License</Link></li>
                            <li><Link to="/about">Security</Link></li>
                        </ul>
                    </div>

                    {/* Language Switcher */}
                    <div className="footer-section">
                        <h4 className="footer-heading">Localization</h4>
                        <div className="lang-switcher">
                            <Globe size={18} className="lang-icon" />
                            <select
                                onChange={(e) => changeLanguage(e.target.value)}
                                value={i18n.language}
                                className="lang-select"
                            >
                                <option value="en">English (US)</option>
                                <option value="es">Español (ES)</option>
                                <option value="hi">हिन्दी (IN)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} AnyFileForge. Built with <Heart size={14} fill="var(--primary-500)" color="var(--primary-500)" /> for researchers.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
