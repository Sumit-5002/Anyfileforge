import React, { useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, Info, Crown, Building } from 'lucide-react';
import { TOOLS } from '../../data/toolsData';
import TOOL_RUNNERS from './runners';
import { useAuth } from '../../contexts/AuthContext';
import './ToolDetailPage.css';

function ToolDetailPage() {
    const { t } = useTranslation();
    const { toolId } = useParams();
    const [searchParams] = useSearchParams();
    const { user, loading } = useAuth();

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

    const queryMode = searchParams.get('mode');
    const storedOnlineMode = typeof window !== 'undefined' && window.localStorage.getItem('anyfileforge_mode') === 'online';
    const forceOnlineMode = queryMode === 'online' || (!queryMode && storedOnlineMode);
    const effectiveTool = forceOnlineMode ? { ...tool, mode: 'server' } : tool;

    const isServerMode = effectiveTool.mode === 'server';
    const isLoggedIn = Boolean(user);
    const requiresLogin = isServerMode;
    const Runner = TOOL_RUNNERS[effectiveTool.id];

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
                    <h1 className="tool-title">{effectiveTool.name}</h1>
                    <p className="tool-description">{effectiveTool.description}</p>
                </div>

                <div className="uploader-wrapper fade-in">
                    {requiresLogin && !isLoggedIn ? (
                        <div className="login-gate">
                            <div className="login-gate-content">
                                <Crown size={42} color="var(--primary-500)" />
                                <h2>Login Required</h2>
                                <p>
                                    {isServerMode
                                        ? 'Online server-mode tools require an account and an active paid plan.'
                                        : 'This tool requires an account before you can continue.'}
                                </p>
                                <div className="server-mode-actions">
                                    <Link to="/login" className="btn btn-primary">Login</Link>
                                    <Link to="/signup" className="btn btn-secondary">Create Account</Link>
                                </div>
                            </div>
                        </div>
                    ) : Runner ? (
                        <Runner tool={effectiveTool} />
                    ) : isServerMode ? (
                        <div className="server-mode-card">
                            <div className="server-mode-content">
                                <Building size={48} color="var(--primary-500)" />
                                <h2>Server Mode Required</h2>
                                <p>
                                    This tool needs backend compute and cannot run fully offline.
                                    Online server mode is a paid feature for large files, cloud-source uploads, advanced conversions, or heavy AI workloads.
                                </p>
                                <div className="server-mode-premium">
                                    <Crown size={18} color="var(--accent-yellow)" />
                                    <span>Paid online plan required for server execution</span>
                                </div>
                                <div className="server-mode-actions">
                                    <button className="btn btn-primary" disabled>
                                        Connect to Online Mode (Coming Soon)
                                    </button>
                                    <Link to="/pricing" className="btn btn-secondary">
                                        View Plans
                                    </Link>
                                </div>
                            </div>
                        </div>
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
                                <h3>About {effectiveTool.name}</h3>
                            </div>
                            <p>
                                {isServerMode
                                    ? 'This is an online server-mode tool intended for heavy processing. Paid mode can support large files and cloud-source imports, while optional server storage can keep results for future work.'
                                    : t('common.toolAboutText', 'This professional tool allows you to process files directly in your browser. No files are uploaded to any server, making it the most secure choice for your sensitive data.')}
                            </p>
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
