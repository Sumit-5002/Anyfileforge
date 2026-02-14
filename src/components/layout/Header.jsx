import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Hammer, ChevronDown, FileText, ImageIcon, Layers } from 'lucide-react';
import { useDeviceType } from '../../hooks/useDeviceType';
import { TOOLS } from '../../data/toolsData';
import InstallPwa from '../pwa/InstallPwa';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

function Header() {
    const { isMobile } = useDeviceType();
    const { user, logout } = useAuth();
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
                        <img src="/logo.png" alt="AnyFileForge" className="logo-img" />
                    </div>
                    <span className="logo-text">ANYFILE<span className="forge-text">FORGE</span></span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="desktop-nav">
                    <Link to="/projects" className="nav-link bold">PROJECTS</Link>
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
                    {user ? (
                        <>
                            <Link to="/profile" className="nav-link login-link">Profile</Link>
                            <button className="btn btn-secondary signup-btn" onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link login-link">Login</Link>
                            <Link to="/signup" className="btn btn-primary signup-btn">Sign up</Link>
                        </>
                    )}

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
                    <Link to="/projects" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Projects</Link>
                    <div className="mobile-section">
                        <h4 className="mobile-section-title">IMAGE SUITE</h4>
                        <Link to="/tools/image-convert" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Image Tools</Link>
                        <Link to="/tools/image-compress" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Compress Image</Link>
                    </div>
                    <Link to="/pricing" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
                    <div className="mobile-actions">
                        {user ? (
                            <>
                                <Link to="/profile" className="btn btn-secondary btn-full" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                                <button className="btn btn-primary btn-full" onClick={() => { logout(); setIsMenuOpen(false); }}>Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-secondary btn-full" onClick={() => setIsMenuOpen(false)}>Login</Link>
                                <Link to="/signup" className="btn btn-primary btn-full" onClick={() => setIsMenuOpen(false)}>Sign up</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
