import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, Info, Crown, Building } from 'lucide-react';
import { TOOLS } from '../../data/toolsData';
import TOOL_RUNNERS from './runners';
import { useAuth } from '../../contexts/AuthContext';
import './ToolDetailPage.css';

function ToolDetailPage() {
    const { t } = useTranslation();
    const { toolId } = useParams();
    const { user, userData, loading } = useAuth();

    const tool = useMemo(() => {
        let found = null;
        Object.values(TOOLS).forEach(suite => {
            suite.forEach(group => {
                const item = group.tools.find(t => t.id === toolId);
                if (item) {
                    found = { ...item, type: group.category };
                }
            });
        });

        if (!found && TOOLS.pdf && TOOLS.pdf[0]) {
            found = TOOLS.pdf[0].tools[0];
            found.type = TOOLS.pdf[0].category;
        }
        return found;
    }, [toolId]);

    if (!tool || loading) return null;

    const isServerMode = tool.mode === 'server';
    const requiresPremium = Boolean(tool.isPro);
    const isLoggedIn = Boolean(user);
    const isPremium = userData?.tier === 'premium';
    const requiresLogin = isServerMode || requiresPremium;
    const Runner = TOOL_RUNNERS[tool.id];

    return (
        <div className="tool-detail-page bg-mesh">
            <div className="container">
                <Link to="/" className="back-link">
                    <ArrowLeft size={16} />
                    {t('common.backToTools', 'Back to all tools')}
                </Link>

                <div className="tool-header fade-in">
                    <div className="tool-type-badge">{tool.type}</div>
                    <div className={`tool-mode-pill ${isServerMode ? 'server' : 'serverless'}`}>
                        {isServerMode ? 'Server Mode (Online)' : 'Serverless (Offline-Ready)'}
                    </div>
                    <h1 className="tool-title">{tool.name}</h1>
                    <p className="tool-description">{tool.description}</p>
                </div>

                <div className="uploader-wrapper fade-in">
                    {requiresLogin && !isLoggedIn ? (
                        <div className="login-gate">
                            <div className="login-gate-content">
                                <Crown size={42} color="var(--primary-500)" />
                                <h2>Login Required</h2>
                                <p>
                                    {isServerMode
                                        ? 'Server mode tools require an account to run cloud processing.'
                                        : 'Premium tools require an account before you can continue.'}
                                </p>
                                <div className="server-mode-actions">
                                    <Link to="/login" className="btn btn-primary">Login</Link>
                                    <Link to="/signup" className="btn btn-secondary">Create Account</Link>
                                </div>
                            </div>
                        </div>
                    ) : isServerMode ? (
                        <div className="server-mode-card">
                            <div className="server-mode-content">
                                <Building size={48} color="var(--primary-500)" />
                                <h2>Server Mode Required</h2>
                                <p>
                                    This tool needs backend compute and cannot run fully offline.
                                    Enable Server Mode to use cloud processing, advanced conversions, or heavy AI workloads.
                                </p>
                                {requiresPremium && (
                                    <div className="server-mode-premium">
                                        <Crown size={18} color="var(--accent-yellow)" />
                                        <span>Premium required for server execution</span>
                                    </div>
                                )}
                                <div className="server-mode-actions">
                                    <button className="btn btn-primary" disabled>
                                        Connect to Server (Coming Soon)
                                    </button>
                                    <Link to="/pricing" className="btn btn-secondary">
                                        View Plans
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : requiresPremium && !isPremium ? (
                        <div className="premium-gate">
                            <div className="premium-gate-content">
                                <Crown size={48} color="var(--accent-yellow)" />
                                <h2>{t('common.premiumRequired', 'Premium Access Required')}</h2>
                                <p>{t('common.premiumText', 'This professional tool is available exclusively for AnyFileForge Premium members.')}</p>
                                <div className="gate-actions">
                                    <Link to="/pricing" className="btn btn-primary">{t('common.upgradeBtn', 'Upgrade to Premium')}</Link>
                                    <Link to="/pricing" className="btn btn-secondary">{t('common.learnMore', 'Learn More')}</Link>
                                </div>
                                <ul className="gate-benefits">
                                    <li>✓ {t('common.benefit1', '100% Client-side processing')}</li>
                                    <li>✓ {t('common.benefit2', 'Batch processing unlocked')}</li>
                                    <li>✓ {t('common.benefit3', 'Support development of local-first tools')}</li>
                                </ul>
                            </div>
                        </div>
                    ) : Runner ? (
                        <Runner tool={tool} />
                    ) : (
                        <div className="server-mode-card">
                            <div className="server-mode-content">
                                <Info size={48} color="var(--primary-500)" />
                                <h2>Tool Coming Soon</h2>
                                <p>
                                    This tool is on the roadmap. We are prioritizing the most requested offline features first.
                                </p>
                                <div className="server-mode-actions">
                                    <Link to="/pricing" className="btn btn-secondary">
                                        View Plans
                                    </Link>
                                    <Link to="/tools" className="btn btn-primary">
                                        Back to Tools
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="tool-info-footer container fade-in">
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-icon-title">
                                <Info size={20} color="var(--primary-500)" />
                                <h3>About {tool.name}</h3>
                            </div>
                            <p>{t('common.toolAboutText', 'This professional tool allows you to process files directly in your browser. No files are uploaded to any server, making it the most secure choice for your sensitive data.')}</p>
                        </div>
                        <div className="info-item">
                            <div className="info-icon-title">
                                <ShieldCheck size={20} color="var(--primary-500)" />
                                <h3>{isServerMode ? 'Server Processing' : '100% Client-Side'}</h3>
                            </div>
                            <p>
                                {isServerMode
                                    ? 'This tool runs in server mode due to heavy compute, advanced conversions, or model-based processing that cannot be done entirely offline.'
                                    : t('common.toolSecurityText', 'We use WebAssembly and modern browser Canvas APIs to process your files locally. Your data residency never leaves your physical machine.')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ToolDetailPage;
