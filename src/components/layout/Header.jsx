import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Hammer, ChevronDown, FileText, ImageIcon, Layers, Cpu, Crown, ShieldCheck, Zap, Info, HelpCircle, Globe, User, LogOut, CreditCard, Lock, LayoutGrid, Heart, ChevronRight, Smartphone, Monitor, Briefcase, FileSignature, Code, Headphones, HelpCircle as FaqIcon, Eye, EyeOff } from 'lucide-react';
import { useDeviceType } from '../../hooks/useDeviceType';
import { TOOLS } from '../../data/toolsData';
import InstallPwa from '../pwa/InstallPwa';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Logo = ({ onClick }) => (
    <Link to="/" className="logo-container" onClick={onClick}>
        <div className="logo-icon-wrapper">
            <img src="/logo.png" alt="AnyFileForge" className="logo-img" />
        </div>
        <span className="logo-text">ANYFILE<span className="forge-text">FORGE</span></span>
    </Link>
);

function Header() {
    const { isMobile } = useDeviceType();
    const { user, logout } = useAuth();
    const { i18n } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isGridOpen, setIsGridOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [isOnlineMode, setIsOnlineMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem('anyfileforge_mode') === 'online';
    });


    // Body overflow management for mobile menus
    useEffect(() => {
        const handleModeChange = () => {
            setIsOnlineMode(window.localStorage.getItem('anyfileforge_mode') === 'online');
        };
        window.addEventListener('anyfileforge-mode-changed', handleModeChange);
        return () => window.removeEventListener('anyfileforge-mode-changed', handleModeChange);
    }, []);

    useEffect(() => {
        if ((isMenuOpen || isGridOpen) && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen, isGridOpen, isMobile]);

    const toggleDropdown = (name) => {
        if (activeDropdown === name) setActiveDropdown(null);
        else setActiveDropdown(name);
    };

    const handleLogoClick = () => {
        setIsMenuOpen(false);
        setIsGridOpen(false);
    };

    const mobileLanguageOptions = [
        { code: 'en', label: 'English (US)' },
        { code: 'es', label: 'Español (ES)' },
        { code: 'hi', label: 'हिन्दी (IN)' }
    ];

    return (
        <header className="header" onMouseLeave={() => !isMobile && setActiveDropdown(null)}>
            <div className="container header-container">
                {/* Desktop Logo */}
                <div className="desktop-only">
                    <Logo onClick={handleLogoClick} />
                </div>

                {/* Mobile Header Row */}
                <div className="mobile-header-row">
                    <button
                        type="button"
                        className={`mobile-menu-btn ${isMenuOpen ? 'is-active' : ''}`}
                        onClick={() => { setIsMenuOpen(!isMenuOpen); setIsGridOpen(false); }}
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-nav-drawer"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className="mobile-center">
                        <Logo onClick={handleLogoClick} />
                    </div>

                    <button
                        type="button"
                        className={`mobile-grid-btn ${isGridOpen ? 'is-active' : ''}`}
                        onClick={() => { setIsGridOpen(!isGridOpen); setIsMenuOpen(false); }}
                        aria-label="View all tools"
                        aria-expanded={isGridOpen}
                        aria-controls="mobile-tools-grid"
                    >
                        {isGridOpen ? <X size={24} /> : <LayoutGrid size={24} />}
                    </button>
                </div>

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
                                            {cat.tools.slice(0, 6).map(tool => (
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
                    <Link to="/pricing" className="nav-link bold">PRICING</Link>
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
                </div>
            </div>

            {/* Mobile Navigation Drawer (3-Line Menu) */}
            {isMenuOpen && (
                <div className="mobile-nav-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div id="mobile-nav-drawer" className="mobile-nav-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-nav-top">
                            <span className="mobile-nav-brand">Menu</span>
                            <button type="button" className="mobile-nav-close" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mobile-nav-body">
                            <div className="menu-comp">
                                {/* Navigation Section */}
                                <div className="menu-comp__section">
                                    <Link to="/projects" className="navbar__item" onClick={() => setIsMenuOpen(false)}>
                                        <div className="navbar__item__icon"><Layers size={20} /></div>
                                        <div className="navbar__item__title">My Projects</div>
                                        <div className="navbar__item__go"><ChevronRight size={16} /></div>
                                    </Link>
                                </div>

                                {/* Other Products Section */}
                                <div className="menu-comp__section border-top">
                                    <h4 className="nav__title">OTHER PRODUCTS</h4>
                                    <div className="navbar__item">
                                        <div className="navbar__item__icon"><Cpu size={20} /></div>
                                        <div className="navbar__item__content">
                                            <div className="navbar__item__title">AnyForge AI</div>
                                            <div className="navbar__item__description">Smart document analysis & automation (Coming Soon)</div>
                                        </div>
                                    </div>
                                    <div className="navbar__item">
                                        <div className="navbar__item__icon"><Code size={20} /></div>
                                        <div className="navbar__item__content">
                                            <div className="navbar__item__title">AnyForge API</div>
                                            <div className="navbar__item__description">Developer SDK for local file processing (Coming Soon)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Solutions Section */}
                                <div className="menu-comp__section border-top">
                                    <h4 className="nav__title">SOLUTIONS</h4>
                                    <div className="navbar__item">
                                        <div className="navbar__item__icon"><Briefcase size={20} /></div>
                                        <div className="navbar__item__content">
                                            <div className="navbar__item__title">AnyForge Business</div>
                                            <div className="navbar__item__description">Streamlined PDF editing and workflows for teams (Coming Soon)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Applications */}
                                <div className="menu-comp__section border-top">
                                    <h4 className="nav__title">APPLICATIONS</h4>
                                    <div className="navbar__item">
                                        <div className="navbar__item__icon"><Monitor size={20} /></div>
                                        <div className="navbar__item__content">
                                            <div className="navbar__item__title">Desktop App</div>
                                            <div className="navbar__item__description">Native Windows & Mac experience (Coming Soon)</div>
                                        </div>
                                    </div>
                                    <div className="navbar__item">
                                        <div className="navbar__item__icon"><Smartphone size={20} /></div>
                                        <div className="navbar__item__content">
                                            <div className="navbar__item__title">Mobile App</div>
                                            <div className="navbar__item__description">Forge files on iOS & Android (Coming Soon)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* General Links */}
                                <div className="menu-comp__section border-top pt-16">
                                    <Link to="/pricing" className="navbar__item navbar__item--xs" onClick={() => setIsMenuOpen(false)}>
                                        <div className="navbar__item__icon"><CreditCard size={18} /></div>
                                        <div className="navbar__item__title">Pricing</div>
                                    </Link>
                                    <Link to="/privacy" className="navbar__item navbar__item--xs" onClick={() => setIsMenuOpen(false)}>
                                        <div className="navbar__item__icon"><ShieldCheck size={18} /></div>
                                        <div className="navbar__item__title">Security</div>
                                    </Link>
                                    <Link to="/tools" className="navbar__item navbar__item--xs" onClick={() => setIsMenuOpen(false)}>
                                        <div className="navbar__item__icon"><LayoutGrid size={18} /></div>
                                        <div className="navbar__item__title">Features</div>
                                    </Link>
                                    <Link to="/about" className="navbar__item navbar__item--xs" onClick={() => setIsMenuOpen(false)}>
                                        <div className="navbar__item__icon"><Info size={18} /></div>
                                        <div className="navbar__item__title">About us</div>
                                    </Link>

                                    <div className="divider"></div>

                                    <button
                                        type="button"
                                        className="navbar__item navbar__item--xs navbar__item--toggle"
                                        onClick={() => {
                                            setIsHelpOpen((v) => !v);
                                            setIsLanguageOpen(false);
                                        }}
                                        aria-expanded={isHelpOpen}
                                    >
                                        <div className="navbar__item__icon"><HelpCircle size={18} /></div>
                                        <div className="navbar__item__title">Help</div>
                                        <div className={`navbar__item__go ${isHelpOpen ? 'is-open' : ''}`}><ChevronDown size={16} /></div>
                                    </button>
                                    {isHelpOpen && (
                                        <div className="mobile-submenu">
                                            <Link to="/about" className="navbar__item navbar__item--xs mobile-submenu__item" onClick={() => { setIsMenuOpen(false); setIsHelpOpen(false); }}>
                                                <div className="navbar__item__icon"><Info size={18} /></div>
                                                <div className="navbar__item__title">About</div>
                                            </Link>
                                            <Link to="/developer" className="navbar__item navbar__item--xs mobile-submenu__item" onClick={() => { setIsMenuOpen(false); setIsHelpOpen(false); }}>
                                                <div className="navbar__item__icon"><User size={18} /></div>
                                                <div className="navbar__item__title">Developer</div>
                                            </Link>
                                            <Link to="/privacy" className="navbar__item navbar__item--xs mobile-submenu__item" onClick={() => { setIsMenuOpen(false); setIsHelpOpen(false); }}>
                                                <div className="navbar__item__icon"><Lock size={18} /></div>
                                                <div className="navbar__item__title">Privacy</div>
                                            </Link>
                                            <Link to="/terms" className="navbar__item navbar__item--xs mobile-submenu__item" onClick={() => { setIsMenuOpen(false); setIsHelpOpen(false); }}>
                                                <div className="navbar__item__icon"><FileText size={18} /></div>
                                                <div className="navbar__item__title">Terms</div>
                                            </Link>
                                            <Link to="/license" className="navbar__item navbar__item--xs mobile-submenu__item" onClick={() => { setIsMenuOpen(false); setIsHelpOpen(false); }}>
                                                <div className="navbar__item__icon"><Crown size={18} /></div>
                                                <div className="navbar__item__title">License</div>
                                            </Link>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="navbar__item navbar__item--xs navbar__item--toggle"
                                        onClick={() => {
                                            setIsLanguageOpen((v) => !v);
                                            setIsHelpOpen(false);
                                        }}
                                        aria-expanded={isLanguageOpen}
                                    >
                                        <div className="navbar__item__icon"><Globe size={18} /></div>
                                        <div className="navbar__item__title">Language</div>
                                        <div className={`navbar__item__go ${isLanguageOpen ? 'is-open' : ''}`}><ChevronDown size={16} /></div>
                                    </button>
                                    {isLanguageOpen && (
                                        <div className="mobile-submenu">
                                            {mobileLanguageOptions.map((opt) => (
                                                <button
                                                    key={opt.code}
                                                    type="button"
                                                    className={`navbar__item navbar__item--xs mobile-submenu__item mobile-lang-option ${i18n.language?.startsWith(opt.code) ? 'is-active' : ''}`}
                                                    onClick={() => {
                                                        i18n.changeLanguage(opt.code);
                                                        setIsLanguageOpen(false);
                                                    }}
                                                >
                                                    <div className="navbar__item__title">{opt.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Account Area */}
                                <div className="menu-comp__section auth-section">
                                    {user ? (
                                        <div className="mobile-auth-buttons">
                                            <Link to="/profile" className="navbar__item" onClick={() => setIsMenuOpen(false)}>
                                                <div className="navbar__item__icon"><User size={20} /></div>
                                                <div className="navbar__item__title">Profile Settings</div>
                                            </Link>
                                            <button className="btn btn-secondary btn-full mt-8" onClick={() => { logout(); setIsMenuOpen(false); }}>
                                                Logout
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mobile-auth-buttons">
                                            <Link to="/login" className="btn btn-secondary btn-full" onClick={() => setIsMenuOpen(false)}>Login</Link>
                                            <Link to="/signup" className="btn btn-primary btn-full mt-12" onClick={() => setIsMenuOpen(false)}>Sign Up for Free</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile All Tools Overlay (4-Box Grid) */}
            {isGridOpen && (
                <div className="mobile-grid-overlay" onClick={() => setIsGridOpen(false)}>
                    <div id="mobile-tools-grid" className="mobile-grid-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-grid-header">
                            <span className="grid-title">All Forge Tools</span>
                            <button type="button" className="grid-close" onClick={() => setIsGridOpen(false)} aria-label="Close tools grid"><X size={24} /></button>
                        </div>
                        <div className="grid-scroll-body">
                            <ul className="grid-suite-list">
                                {/* PDF Tools Grid */}
                                <div className="grid-suite-section">
                                    <h3 className="section-divider-text">PDF TOOLS</h3>
                                    {TOOLS.pdf.map((category, idx) => (
                                        <li key={`pdf-${idx}`} className="grid-suite-item">
                                            <div className="grid-category-title">{category.category}</div>
                                            <ul className="grid-sub-list">
                                                {category.tools.map(tool => (
                                                    <li key={tool.id}>
                                                        <Link
                                                            to={`/tools/${tool.id}`}
                                                            className="grid-tool-link"
                                                            onClick={() => setIsGridOpen(false)}
                                                        >
                                                            <tool.icon size={16} className="tool-ico" style={{ color: tool.color }} />
                                                            <span>{tool.name}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </div>

                                {/* Image Tools Grid */}
                                <div className="grid-suite-section border-top mt-24 pt-24">
                                    <h3 className="section-divider-text">IMAGE TOOLS</h3>
                                    {TOOLS.image.map((category, idx) => (
                                        <li key={`img-${idx}`} className="grid-suite-item">
                                            <div className="grid-category-title">{category.category}</div>
                                            <ul className="grid-sub-list">
                                                {category.tools.map(tool => (
                                                    <li key={tool.id}>
                                                        <Link
                                                            to={`/tools/${tool.id}`}
                                                            className="grid-tool-link"
                                                            onClick={() => setIsGridOpen(false)}
                                                        >
                                                            <tool.icon size={16} className="tool-ico" style={{ color: tool.color }} />
                                                            <span>{tool.name}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </div>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
