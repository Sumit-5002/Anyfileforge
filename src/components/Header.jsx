import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Hammer, ChevronDown, FileText, ImageIcon, Layers } from 'lucide-react';
import { useDeviceType } from '../hooks/useDeviceType';
import { TOOLS, InstallPwa } from '../index';
import './Header.css';

function Header() {
    const { isMobile } = useDeviceType();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const toggleDropdown = (name) => {
        if (activeDropdown === name) setActiveDropdown(null);
        else setActiveDropdown(name);
    };

    return (
        <header className="header" onMouseLeave={() => !isMobile && setActiveDropdown(null)}>
            <div className="container header-container">
                <Link to="/" className="logo-container" onClick={() => setIsMenuOpen(false)}>
                    <div className="logo-icon-wrapper">
                        <Hammer className="logo-icon" size={28} />
                    </div>
                    <span className="logo-text">ANYFILE<span className="forge-text">FORGE</span></span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="desktop-nav">
                    <div className="nav-item-dropdown" onMouseEnter={() => !isMobile && setActiveDropdown('pdf')}>
                        <button className={`nav-link-btn ${activeDropdown === 'pdf' ? 'active' : ''}`} onClick={() => toggleDropdown('pdf')}>
                            PDF TOOLS <ChevronDown size={14} />
                        </button>
                        {activeDropdown === 'pdf' && (
                            <div className="mega-menu">
                                <div className="mega-menu-grid">
                                    {TOOLS.pdf.map((cat, idx) => (
                                        <div key={idx} className="mega-col">
                                            <h4 className="mega-title">{cat.category}</h4>
                                            {cat.tools.slice(0, 5).map(tool => (
                                                <Link key={tool.id} to={`/tools/${tool.id}`} className="mega-item" onClick={() => setActiveDropdown(null)}>
                                                    <div className="mega-icon-wrapper" style={{ color: tool.color }}>
                                                        <tool.icon size={18} />
                                                    </div>
                                                    {tool.name}
                                                </Link>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="nav-item-dropdown" onMouseEnter={() => !isMobile && setActiveDropdown('image')}>
                        <button className={`nav-link-btn ${activeDropdown === 'image' ? 'active' : ''}`} onClick={() => toggleDropdown('image')}>
                            IMAGE TOOLS <ChevronDown size={14} />
                        </button>
                        {activeDropdown === 'image' && (
                            <div className="mega-menu">
                                <div className="mega-menu-grid">
                                    {TOOLS.image.map((cat, idx) => (
                                        <div key={idx} className="mega-col">
                                            <h4 className="mega-title">{cat.category}</h4>
                                            {cat.tools.map(tool => (
                                                <Link key={tool.id} to={`/tools/${tool.id}`} className="mega-item" onClick={() => setActiveDropdown(null)}>
                                                    <div className="mega-icon-wrapper" style={{ color: tool.color }}>
                                                        <tool.icon size={18} />
                                                    </div>
                                                    {tool.name}
                                                </Link>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link to="/tools" className="nav-link bold">ALL TOOLS</Link>
                </nav>

                <div className="header-actions">
                    <InstallPwa />
                    <Link to="/login" className="nav-link login-link">Login</Link>
                    <Link to="/signup" className="btn btn-primary signup-btn">Sign up</Link>

                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="mobile-nav fade-in">
                    <div className="mobile-section">
                        <h4 className="mobile-section-title">PDF SUITE</h4>
                        <Link to="/tools" className="mobile-link" onClick={() => setIsMenuOpen(false)}>All PDF Tools</Link>
                        <Link to="/tools/pdf-merge" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Merge PDF</Link>
                        <Link to="/tools/pdf-split" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Split PDF</Link>
                    </div>
                    <div className="mobile-section">
                        <h4 className="mobile-section-title">IMAGE SUITE</h4>
                        <Link to="/tools/image-convert" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Image Tools</Link>
                        <Link to="/tools/image-compress" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Compress Image</Link>
                    </div>
                    <Link to="/pricing" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
                    <div className="mobile-actions">
                        <Link to="/login" className="btn btn-secondary btn-full" onClick={() => setIsMenuOpen(false)}>Login</Link>
                        <Link to="/signup" className="btn btn-primary btn-full" onClick={() => setIsMenuOpen(false)}>Sign up</Link>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
