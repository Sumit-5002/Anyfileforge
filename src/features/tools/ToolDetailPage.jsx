import React, { useMemo, Suspense } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, Info, Crown, Building, Lock, Code, Activity, Terminal } from 'lucide-react';
import { TOOLS } from '../../data/toolsData';
import TOOL_RUNNERS from './runners';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import serverProcessingService from '../../services/serverProcessingService';
import './ToolDetailPage.css';

const AccessModal = ({ isOpen, onClose, onConfirm, error }) => {
    const [key, setKey] = React.useState("");
    if (!isOpen) return null;
    return (
        <div className="access-modal-overlay fade-in">
            <div className="access-modal-content slide-up">
                <div className="modal-header">
                    <Lock size={24} className="text-primary" />
                    <h3>Developer Access Required</h3>
                </div>
                <p>Please enter your developer project key to unlock Premium Online Mode on the frontend.</p>
                <div className="modal-body">
                    <input 
                        type="password" 
                        placeholder="Enter Project Key..." 
                        value={key} 
                        onChange={(e) => setKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onConfirm(key)}
                    />
                    {error && <div className="modal-error">{error}</div>}
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => onConfirm(key)}>Unlock Access</button>
                </div>
            </div>
        </div>
    );
};

function ToolDetailPage() {
    const { t } = useTranslation();
    const { toolId } = useParams();
    const [searchParams] = useSearchParams();
    const { user, userData, loading } = useAuth();

    const [hasFiles, setHasFiles] = React.useState(false);
    const [serverAvailable, setServerAvailable] = React.useState(true);
    
    const DEV_KEY = "AF-PROJECT-DEV-2026";
    const [isDev, setIsDev] = React.useState(() => typeof window !== 'undefined' && localStorage.getItem('anyfileforge_dev_access') === 'true');
    const [showDevConsole, setShowDevConsole] = React.useState(false);
    const [showAccessModal, setShowAccessModal] = React.useState(false);
    const [modalError, setModalError] = React.useState("");

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

    const queryMode = useMemo(() => searchParams.get('mode'), [searchParams]);
    const storedOnlineMode = useMemo(() => typeof window !== 'undefined' && window.localStorage.getItem('anyfileforge_mode') === 'online', []);
    const forceOnlineMode = queryMode === 'online' || (!queryMode && storedOnlineMode);
    const effectiveTool = useMemo(() => forceOnlineMode ? { ...tool, mode: 'server' } : tool, [forceOnlineMode, tool]);
    
    // Bypass auth check if user is a Developer
    const isServerMode = effectiveTool?.mode === 'server';
    const canAccessOnline = isServerMode && (Boolean(user) || isDev);

    React.useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await serverProcessingService.health();
                if (res) setServerAvailable(true);
            } catch {
                setServerAvailable(false);
            }
        };
        if (isServerMode) checkHealth();
    }, [isServerMode]);

    React.useEffect(() => {
        window.dispatchEvent(new CustomEvent('anyfileforge-workspace-active', { detail: { active: hasFiles } }));
        return () => {
            window.dispatchEvent(new CustomEvent('anyfileforge-workspace-active', { detail: { active: false } }));
        };
    }, [hasFiles]);

    if (!tool || loading) return null;

    const isLoggedIn = Boolean(user);
    const Runner = TOOL_RUNNERS[effectiveTool.id];

    const handleFilesAdded = (files) => {
        if (files && files.length > 0) setHasFiles(true);
    };

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
                        {isServerMode && serverAvailable && <span className="health-dot active"></span>}
                    </div>
                    <h1 className="tool-title">{effectiveTool.name}</h1>
                    <p className="tool-description">{effectiveTool.description}</p>
                </div>

                <div className="uploader-wrapper fade-in">
                    {isServerMode && forceOnlineMode && !canAccessOnline ? (
                        <div className="login-gate">
                            <div className="login-gate-content">
                                <Crown size={42} color="var(--primary-500)" />
                                <h2>Login Required</h2>
                                <p>
                                    Account and an active plan required for online server-mode tools.
                                    Switch to **Offline Mode** to explore without an account.
                                </p>
                                <div className="server-mode-actions">
                                    <Link to="/login" className="btn btn-primary">Login</Link>
                                    <Link to="/signup" className="btn btn-secondary">Create Account</Link>
                                </div>
                            </div>
                        </div>
                    ) : Runner ? (
                        <ErrorBoundary>
                            <Suspense fallback={<LoadingSpinner />}>
                                <Runner tool={effectiveTool} onFilesAdded={handleFilesAdded} />
                            </Suspense>
                        </ErrorBoundary>
                    ) : isServerMode ? (
                        <div className="server-mode-card">
                            <div className="server-mode-content">
                                <Building size={48} color="var(--primary-500)" />
                                <h2>{forceOnlineMode ? 'Server Mode Connection' : 'Server Optimized Tool'}</h2>
                                <p>
                                    {!forceOnlineMode
                                        ? 'This tool works best in Server Mode. For faster processing and better results with large files, we recommend connecting to your backend.'
                                        : (serverAvailable
                                            ? 'Server is active and ready for background compute. This tool handles large files and advanced processing.'
                                            : 'Connecting to backend compute... Please ensure your server is running on the configured port.')}
                                </p>
                                <div className="server-mode-premium">
                                    <Crown size={18} color="var(--accent-yellow)" />
                                    <span>Premium Online Mode</span>
                                </div>
                                <div className="server-mode-actions">
                                    {!forceOnlineMode ? (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                window.localStorage.setItem('anyfileforge_mode', 'online');
                                                setShowAccessModal(true);
                                            }}
                                        >
                                            Try Online Mode
                                        </button>
                                    ) : !canAccessOnline ? (
                                        <Link to="/login" className="btn btn-primary">
                                            Connect to Server
                                        </Link>
                                    ) : userData?.tier !== 'premium' ? (
                                        <Link to="/pricing" className="btn btn-primary">
                                            Upgrade to Premium
                                        </Link>
                                    ) : (
                                        <div className="btn btn-primary disabled" style={{ cursor: 'default', opacity: 0.8 }}>
                                            Server Active
                                        </div>
                                    )}
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

                {!hasFiles && (
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
                )}
            </div>
            
            <AccessModal 
                isOpen={showAccessModal} 
                onClose={() => setShowAccessModal(false)}
                error={modalError}
                onConfirm={(key) => {
                    if (key === DEV_KEY) {
                        localStorage.setItem('anyfileforge_dev_access', 'true');
                        setIsDev(true);
                        setShowAccessModal(false);
                        window.location.reload();
                    } else {
                        setModalError("Invalid Developer Project Key.");
                    }
                }}
            />

            {/* Developer Hub (Sumit's Console) */}
            {isDev && (
                <>
                    <button 
                        className="dev-toggle-bubble"
                        onClick={() => setShowDevConsole(!showDevConsole)}
                        style={{
                            position: 'fixed', bottom: '24px', right: '24px', 
                            background: '#1e293b', color: '#60a5fa', border: '1px solid #334155',
                            borderRadius: '16px', padding: '0 12px', height: '44px', cursor: 'pointer', zIndex: 1001,
                            boxShadow: '0 8px 16px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: 600, fontSize: '13px'
                        }}
                    >
                         <Terminal size={18} />
                         DEV HUB
                    </button>
                    
                    {showDevConsole && (
                        <div className="dev-status-panel fade-in slide-up" style={{
                            position: 'fixed', bottom: '80px', right: '24px', 
                            background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
                            color: '#e2e8f0', padding: '20px', borderRadius: '16px',
                            width: '280px', zIndex: 1001, border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                        }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                                <Activity size={18} className="text-primary" />
                                <h4 style={{ margin: 0, fontSize: '15px', color: 'white' }}>System Diagnostics</h4>
                             </div>

                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="dev-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ opacity: 0.7 }}>Tool ID:</span>
                                    <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>{toolId}</code>
                                </div>
                                <div className="dev-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ opacity: 0.7 }}>Service:</span>
                                    <span style={{ color: isServerMode ? '#fbbf24' : '#10b981', fontWeight: 600 }}>
                                        {isServerMode ? 'ONLINE' : 'OFFLINE'}
                                    </span>
                                </div>
                                <div className="dev-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ opacity: 0.7 }}>Health Check:</span>
                                    <span style={{ color: serverAvailable ? '#10b981' : '#ef4444' }}>
                                        {serverAvailable ? 'PASS' : 'FAIL'}
                                    </span>
                                </div>
                             </div>

                             <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button 
                                    className="btn-secondary" 
                                    style={{ padding: '6px', fontSize: '11px' }}
                                    onClick={() => {
                                        localStorage.removeItem('anyfileforge_mode');
                                        window.location.reload();
                                    }}
                                >
                                    Reset Mode
                                </button>
                                <button 
                                    style={{ background: '#ef4444', border: 'none', borderRadius: '6px', color: 'white', padding: '6px', fontSize: '11px', cursor: 'pointer' }}
                                    onClick={() => {
                                        localStorage.removeItem('anyfileforge_dev_access');
                                        setIsDev(false);
                                        window.location.reload();
                                    }}
                                >
                                    Exit Dev
                                </button>
                             </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ToolDetailPage;
