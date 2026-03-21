import React, { useRef, useState } from 'react';
import { X, FileText, Download, Loader, Upload } from 'lucide-react';
import FileUploader from '../../../../components/ui/FileUploader';
import './ToolWorkspace.css';

/**
 * Unified Workspace Layout for all tools.
 * 
 * TWO STATES:
 *   1. No files → Shows the premium FileUploader (same as PDF tools).
 *   2. Has files → Shows the Header + Main + Sidebar workspace layout.
 * 
 * Props:
 *   accept       – file accept string, e.g. ".h5,.hdf5"
 *   multiple     – allow multiple files (default false)
 *   dropzoneLabel – label for the dropzone when no files loaded
 *   dropzoneHint  – hint text for the dropzone
 */
function ToolWorkspace({
    tool,
    files = [],
    onFilesSelected,
    onReset,
    processing,
    onProcess,
    actionLabel,
    sidebar,
    sidebarTitle = 'Settings',
    progress = 0,
    accept,
    multiple = false,
    dropzoneLabel,
    dropzoneHint,
    layout = 'default', // 'default' or 'research'
    children
}) {
    const addMoreInputRef = useRef(null);

    const handleAddMore = (e) => {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length > 0 && onFilesSelected) {
            onFilesSelected(newFiles);
        }
        e.target.value = '';
    };

    const hasFiles = files && files.length > 0;
    const isResearch = layout === 'research';

    // ─── STATE 1: No files yet → show the premium uploader ───
    if (!hasFiles) {
        return (
            <div className={`tool-workspace-root fade-in ${isResearch ? 'research-mode' : ''}`}>
                <FileUploader
                    tool={{ ...tool, name: tool?.name || 'File' }}
                    onFilesSelected={onFilesSelected}
                    multiple={multiple}
                    accept={accept || '*/*'}
                />
            </div>
        );
    }

    // ─── STATE 2: Files loaded → show workspace ───
    return (
        <div className={`tool-workspace-root fade-in ${isResearch ? 'research-mode' : ''}`}>
            {/* Top Info Bar */}
            <div className="workspace-header">
                <div className="workspace-file-summary">
                    <FileText size={isResearch ? 16 : 20} className="text-primary" />
                    <span className="summary-text" style={isResearch ? { fontSize: '0.8rem', opacity: 0.7 } : {}}>
                        <strong>{files.length}</strong> {isResearch ? 'Loaded Resource' : 'file'}{files.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="workspace-header-actions">
                    {onFilesSelected && (
                        <>
                            <button
                                type="button"
                                className="btn-add-more"
                                onClick={() => addMoreInputRef.current?.click()}
                                aria-label="Add more files"
                            >
                                + Import
                            </button>
                            <input
                                type="file"
                                multiple={multiple}
                                hidden
                                ref={addMoreInputRef}
                                accept={accept || tool?.accept || '*/*'}
                                onChange={handleAddMore}
                                tabIndex="-1"
                                aria-hidden="true"
                            />
                        </>
                    )}
                    <button className="btn-reset-workspace" onClick={onReset} aria-label="Reset workspace">
                        <X size={14} /> Clear
                    </button>
                </div>
            </div>

            <div className={`workspace-layout ${isResearch ? 'layout-research' : ''}`}>
                {/* Sidebar Controls (Moved to Left in Research Mode) */}
                {isResearch && (
                    <div className="workspace-sidebar sidebar-left">
                        <div className="sidebar-inner">
                            <h4 className="sidebar-title" style={{ letterSpacing: '2px', fontSize: '0.7rem' }}>
                                {sidebarTitle === 'Settings' ? 'EXPLORER' : sidebarTitle}
                            </h4>
                            {sidebar}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="workspace-main">
                    {children}
                </div>

                {/* Right Sidebar (Process control for non-research mode) */}
                {!isResearch && (
                    <div className="workspace-sidebar">
                        <div className="sidebar-inner">
                            {sidebarTitle && <h4 className="sidebar-title">{sidebarTitle}</h4>}
                            {sidebar}
                            
                            {processing && (
                                <div className="workspace-progress-container mt-4 mb-2">
                                    <div className="progress-info">
                                        <span>{progress >= 100 ? '✅ Done!' : 'Processing…'}</span>
                                        {progress > 0 && progress < 100 && <span>{Math.round(progress)}%</span>}
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                                    </div>
                                </div>
                            )}

                            {onProcess && (
                                <button
                                    className="btn-primary btn-full workspace-action-btn"
                                    onClick={onProcess}
                                    disabled={processing || files.length === 0}
                                >
                                    {processing ? <Loader className="spinning" size={20} /> : <Download size={20} />}
                                    {actionLabel || 'Process'}
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
