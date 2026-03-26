import React, { useRef, useState, useEffect } from 'react';
import { X, FileText, Download, Loader2, Upload, Info, Eye, Zap, FileImage, Trash2 } from 'lucide-react';
import FileUploader from '../../../../components/ui/FileUploader';
import './ToolWorkspace.css';

/**
 * Optimized Result Item component to manage individual artifact lifecycles.
 */
const ResultItem = ({ res, idx }) => {
    const isImg = res.type === 'image' || 
                 (res.data instanceof Blob && res.data.type?.startsWith('image/')) ||
                 (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(res.name));
    
    const [itemUrl, setItemUrl] = useState(null);

    useEffect(() => {
        let currentUrl = null;
        if (isImg && res.data instanceof Blob) {
            currentUrl = URL.createObjectURL(res.data);
            setItemUrl(currentUrl);
        } else if (isImg && typeof res.data === 'string') {
            setItemUrl(res.data);
        }
        
        return () => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [isImg, res.data]);

    const handleDownload = () => {
        const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = res.name || 'artifact.bin';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="result-artifact-card">
            <div className="artifact-preview-area">
                {isImg && itemUrl ? (
                    <>
                        <img src={itemUrl} alt={res.name} className="artifact-img" />
                        <div className="artifact-overlay">
                            <button className="artifact-btn artifact-btn-view" onClick={() => window.open(itemUrl, '_blank')} title="Inspect Full Resolution"><Eye size={20}/></button>
                            <button className="artifact-btn artifact-btn-download" onClick={handleDownload} title="Commence Download"><Download size={20}/></button>
                        </div>
                    </>
                ) : (
                    <div className="binary-stream-placeholder">
                        <FileText size={48} />
                        <span className="binary-label">{isImg ? 'Preparing' : 'Result File'}</span>
                        <div className="artifact-overlay">
                            <button className="artifact-btn artifact-btn-download" onClick={handleDownload}>
                                <Download size={20}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="artifact-footer">
                <div className="artifact-meta">
                    <div className="artifact-label-row">
                        <div className="artifact-dot"></div>
                        <span className="artifact-id">Result_0{idx + 1}</span>
                    </div>
                    <div className="artifact-filename">{res.name || 'unnamed'}</div>
                </div>
            </div>
        </div>
    );
};

/**
 * Unified Workspace Layout for all tools.
 */
function ToolWorkspace({
    tool,
    files = [],
    results = [],
    onFilesSelected,
    onRemoveFile,
    onReset,
    processing,
    progress = 0,
    onProcess,
    actionLabel,
    sidebar,
    multiple = true,
    accept,
    showHeaderActions = true,
    sidebarTitle = 'Settings',
    layout = 'default',
    allowEmpty = false,
    children
}) {
    const isResearch = layout === 'research' || tool?.category === 'Data Analysis' || tool?.category === 'Engineering Hub';
    const hasFiles = (files && files.length > 0) || (results && results.length > 0);
    const addMoreInputRef = useRef(null);

    const handleAddMore = (e) => {
        if (e.target.files && onFilesSelected) {
            onFilesSelected(Array.from(e.target.files));
        }
        e.target.value = '';
    };

    const renderResults = () => {
        if (!results || results.length === 0) return null;
        return (
            <div className="workspace-results-gallery fade-in">
                <div className="gallery-header">
                    <div className="gallery-title-area">
                        <div className="gallery-icon-bg"><Zap size={20} /></div>
                        <div>
                            <h4 className="gallery-title-main">Result Gallery</h4>
                            <p className="gallery-subtitle">Ready for Download</p>
                        </div>
                    </div>
                    <div className="gallery-badge">
                        {results.length} Snapshot{results.length !== 1 ? 's' : ''} Ready
                    </div>
                </div>

                <div className="results-grid">
                    {results.map((res, idx) => (
                        <ResultItem key={idx} res={res} idx={idx} />
                    ))}
                </div>
            </div>
        );
    };

    if (!hasFiles && !allowEmpty) {
        return (
            <div className={`tool-workspace-root fade-in ${isResearch ? 'research-mode' : ''}`}>
                <FileUploader
                    tool={{ ...tool, name: tool?.name || 'File' }}
                    onFilesSelected={onFilesSelected}
                    multiple={multiple}
                    accept={accept || tool?.accept || '*/*'}
                />
            </div>
        );
    }

    return (
        <div className={`tool-workspace-root fade-in ${isResearch ? 'research-mode' : ''}`}>
            {/* Top Info Bar */}
            <div className="workspace-header sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md px-4 py-4 md:px-8 border-b border-white/5">
                <div className="workspace-file-summary flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl"><FileText size={isResearch ? 14 : 18} className="text-primary" /></div>
                    <span className="summary-text text-sm font-bold text-slate-300">
                        <strong className="text-white">{files.length}</strong> {isResearch ? 'Resource' : 'file'}{files.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="workspace-header-actions flex gap-2">
                    {showHeaderActions && onFilesSelected && (
                        <>
                            <button className="btn-add-more bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95" onClick={() => addMoreInputRef.current?.click()}>+ Add Files</button>
                            <input type="file" multiple={multiple} hidden ref={addMoreInputRef} accept={accept || tool?.accept || '*/*'} onChange={handleAddMore} />
                        </>
                    )}
                    {showHeaderActions && onReset && (
                        <button
                            className="btn-reset-workspace bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to clear all files? This action cannot be undone.')) {
                                    onReset();
                                }
                            }}
                            title="Clear all files from workspace"
                            aria-label="Clear all files from workspace"
                        >
                            <Trash2 size={14} />
                            <span>Clear All</span>
                        </button>
                    )}
                </div>
            </div>

            <div className={`workspace-layout ${isResearch ? 'layout-research' : ''} flex flex-col lg:flex-row`}>
                {/* Sidebar Left (Mobile: Top, Desktop: Left) */}
                {isResearch && (
                    <div className="workspace-sidebar sidebar-left w-full lg:w-[320px] shrink-0 border-r border-white/5 lg:h-[calc(100vh-140px)] overflow-y-auto overflow-x-hidden">
                        <div className="sidebar-inner p-6">
                            <h4 className="sidebar-title text-[10px] uppercase font-black tracking-widest text-slate-600 mb-6 px-1">
                                {sidebarTitle === 'Settings' ? 'DATA_EXPLORER' : sidebarTitle}
                            </h4>
                            {sidebar}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="workspace-main flex-grow min-w-0 bg-slate-950/40 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                        {renderResults()}
                    </div>
                </div>

                {/* Right Sidebar (Process control for non-research mode) */}
                {!isResearch && (
                    <div className="workspace-sidebar w-full lg:w-[380px] shrink-0 border-l border-white/5 bg-slate-900/40 lg:h-[calc(100vh-140px)] overflow-y-auto">
                        <div className="sidebar-inner p-8">
                            {sidebarTitle && <h4 className="sidebar-title text-[10px] uppercase font-black tracking-widest text-primary-500 mb-6">{sidebarTitle}</h4>}
                            {sidebar}
                            
                            {processing && (
                                <div className="workspace-progress-container mt-8 mb-4">
                                    <div className="progress-info flex justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Sync_Progress</span>
                                        <span className="text-sm font-mono text-primary-400">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="progress-bar-bg h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="progress-bar-fill h-full bg-primary-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(progress, 100)}%` }} />
                                    </div>
                                </div>
                            )}

                            {onProcess && (
                                <button
                                    className="btn-primary-gradient w-full py-5 rounded-[24px] flex items-center justify-center gap-3 mt-8 shadow-2xl transition-all"
                                    onClick={onProcess}
                                    disabled={processing || files.length === 0}
                                >
                                    <div className="flex-shrink-0">
                                        {processing ? <Loader2 className="spinning" size={22} /> : <Zap size={22} fill="currentColor" opacity={0.2} />}
                                    </div>
                                    <span className="font-black italic tracking-tighter uppercase text-base md:text-lg leading-none pt-0.5">{actionLabel || 'INITIATE PROCESS'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ToolWorkspace;
