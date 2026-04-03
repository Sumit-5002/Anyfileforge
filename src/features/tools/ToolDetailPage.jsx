import React, { useMemo, Suspense } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, Info, Crown, Building, Lock, Code, Activity, Terminal, Zap, Globe, Cpu } from 'lucide-react';
import { TOOLS } from '../../data/toolsData';
import GoogleAd from '../../components/ui/GoogleAd';
import TOOL_RUNNERS from './runners';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import serverProcessingService from '../../services/serverProcessingService';
import './ToolDetailPage.css';

function ToolDetailPage() {
    const { t } = useTranslation();
    const { toolId } = useParams();
    const [searchParams] = useSearchParams();
    const { user, userData, loading } = useAuth();

    const [hasFiles, setHasFiles] = React.useState(false);
    const [serverAvailable, setServerAvailable] = React.useState(true);

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
    
    const isServerMode = effectiveTool?.mode === 'server';
    const canAccessOnline = isServerMode && Boolean(user);

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

    const Runner = TOOL_RUNNERS[effectiveTool.id];

    const handleFilesAdded = (files) => {
        if (files && files.length > 0) setHasFiles(true);
    };

    return (
        <div className="tool-detail-page bg-mesh min-h-screen">
            <div className="container mx-auto px-4 py-2 md:py-4">
                <Link to="/" className="back-link flex items-center gap-2 text-slate-400 hover:text-white transition-all mb-4 w-fit text-xs font-bold uppercase tracking-widest">
                    <ArrowLeft size={16} />
                    {t('common.backToTools', 'Back to Workspace')}
                </Link>

                <div className="tool-header fade-in mb-4">
                    <h1 className="tool-title text-4xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">{effectiveTool.name}</h1>
                </div>

                <div className="uploader-wrapper fade-in shadow-2xl rounded-[40px] overflow-hidden">
                    {isServerMode && forceOnlineMode && !canAccessOnline ? (
                        <div className="login-gate bg-slate-900/50 backdrop-blur-xl p-12 text-center">
                            <div className="login-gate-content">
                                < Crown size={48} className="text-primary-500 mx-auto mb-6" />
                                <h2 className="text-2xl font-black italic tracking-tight text-white mb-4">AUTHENTICATION_FAILURE</h2>
                                <p className="text-slate-400 max-w-sm mx-auto mb-8">
                                    Server-mode tools require an active account. 
                                    Switch to **Offline Mode** or sign in to continue.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link to="/login" className="btn-primary-gradient px-8 py-3 rounded-2xl w-full sm:w-auto font-black italic uppercase text-xs">Login</Link>
                                    <Link to="/signup" className="btn-secondary px-8 py-3 rounded-2xl w-full sm:w-auto font-bold text-xs">Create Account</Link>
                                </div>
                            </div>
                        </div>
                    ) : Runner ? (
                        <ErrorBoundary>
                            <Suspense fallback={<div className="p-24 flex items-center justify-center"><LoadingSpinner /></div>}>
                                <Runner tool={effectiveTool} onFilesAdded={handleFilesAdded} />
                            </Suspense>
                        </ErrorBoundary>
                    ) : isServerMode ? (
                        <div className="server-mode-card bg-slate-900 border border-white/5 p-12 text-center">
                            <div className="server-mode-content">
                                <Building size={64} className="text-primary-500 mx-auto mb-6" />
                                <h2 className="text-2xl font-black italic tracking-tight text-white mb-4 uppercase">{forceOnlineMode ? 'Engine_Link' : 'Optimization_Ready'}</h2>
                                <p className="text-slate-400 max-w-md mx-auto mb-8">
                                    {!forceOnlineMode
                                        ? 'This tool is optimized for high-performance cloud processing. Switch to Server Mode for better reliability with massive datasets.'
                                        : (serverAvailable
                                            ? 'The computing engine is active. Large files and batch transformations are supported in this mode.'
                                            : 'Connecting to background engine... Please ensure the processing agent is running.')}
                                </p>
                                <div className="server-mode-premium flex items-center justify-center gap-2 mb-8 p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 w-fit mx-auto">
                                    < Crown size={18} className="text-yellow-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Premium Subscription Active</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    {!forceOnlineMode ? (
                                        <button
                                            className="btn-primary-gradient px-8 py-3 rounded-2xl w-full sm:w-auto font-black italic uppercase text-xs"
                                            onClick={() => {
                                                window.localStorage.setItem('anyfileforge_mode', 'online');
                                                window.location.reload();
                                            }}
                                        >
                                            Activate Online Mode
                                        </button>
                                    ) : !canAccessOnline ? (
                                        <Link to="/login" className="btn-primary-gradient px-8 py-3 rounded-2xl w-full sm:w-auto font-black italic uppercase text-xs">
                                            Establish Connection
                                        </Link>
                                    ) : (
                                        <div className="px-8 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-bold text-xs">
                                            Engine_Safe
                                        </div>
                                    )}
                                    <Link to="/pricing" className="btn-secondary px-8 py-3 rounded-2xl w-full sm:w-auto font-bold text-xs uppercase">
                                        Support Plan
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="server-mode-card tool-dev-card">
                            <div className="server-mode-content">
                                <Terminal size={56} className="tool-dev-icon" />
                                <span className="tool-dev-status">Status: In Development</span>
                                <h2 className="tool-dev-title">Under Development</h2>
                                <p className="tool-dev-description">
                                    <strong>{effectiveTool.name}</strong> is in active development.
                                    We are polishing the final workflow and UI before release.
                                </p>
                                <ul className="tool-dev-list">
                                    <li>Dedicated input and output flow for this tool</li>
                                    <li>Stable offline processing with clear progress UX</li>
                                    <li>Final export actions and error-safe handling</li>
                                </ul>
                                <p className="tool-dev-note">This placeholder is intentional so the app stays stable while this module is being built.</p>
                                <div className="tool-dev-actions">
                                    <Link to="/tools" className="btn btn-primary btn-large">
                                        Back to Tools
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ margin: '2rem 0' }}>
                    <GoogleAd slot="YOUR_AD_SLOT_ID_HERE" />
                </div>

                {!hasFiles && (
                    <div className="tool-info-footer mt-24 mb-16 fade-in">
                        <div className="info-grid">
                            <div className="info-item">
                                <div className="info-icon-title flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-primary-500/20 rounded-3xl"><Info size={24} className="text-primary-400" /></div>
                                    <h3 className="text-xl font-black italic tracking-tight text-white">About {effectiveTool.name}</h3>
                                </div>
                                 <p className="text-slate-400 leading-relaxed text-sm">
                                    {isServerMode
                                        ? `High-performance cloud processing for ${effectiveTool.name}. This tool utilizes remote compute clusters for heavy-duty transformations that typical browser engines cannot handle.`
                                        : (effectiveTool.about || `${effectiveTool.description} This ${effectiveTool.type?.toLowerCase() || 'utility'} tool operates entirely within your browser's private sandbox, ensuring no data ever touches our servers.`)}
                                </p>
                            </div>
                            <div className="info-item">
                                <div className="info-icon-title flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-emerald-500/20 rounded-3xl"><ShieldCheck size={24} className="text-emerald-400" /></div>
                                    <h3 className="text-xl font-black italic tracking-tight text-white">{isServerMode ? 'Engine Trust' : (effectiveTool.privacy_header || '100% Client-Side')}</h3>
                                </div>
                                <p className="text-slate-400 leading-relaxed text-sm">
                                    {isServerMode
                                        ? 'Connection to the remote engine is encrypted via TLS 1.3. Files are processed in volatile memory and purged immediately after the session concludes.'
                                        : (effectiveTool.privacy || '100% Client-Side execution. We use WebAssembly and modern browser APIs to process your files locally. Your sensitive data residency remains on your machine.')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ToolDetailPage;
