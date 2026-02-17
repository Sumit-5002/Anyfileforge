import React, { useRef } from 'react';
import { X, FileText, Download, Loader } from 'lucide-react';
import './ToolWorkspace.css';

/**
 * Unified Workspace Layout for all tools
 * Patterns: Header (file info) | Main (Grid/List) | Sidebar (Actions)
 */
function ToolWorkspace({
    tool,
    files,
    onFilesSelected,
    onReset,
    processing,
    onProcess,
    actionLabel,
    sidebar,
    children // This is the main grid or file list area
}) {
    const addMoreInputRef = useRef(null);

    const handleAddMore = (e) => {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length > 0 && onFilesSelected) {
            onFilesSelected(newFiles);
        }
        // Clear value so the same file can be selected again
        e.target.value = '';
    };

    return (
        <div className="tool-workspace-root fade-in">
            {/* Top Info Bar */}
            <div className="workspace-header">
                <div className="workspace-file-summary">
                    <FileText size={20} className="text-primary" />
                    <span className="summary-text">
                        <strong>{files.length}</strong> file{files.length !== 1 ? 's' : ''} selected
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
                                + Add More
                            </button>
                            <input
                                type="file"
                                multiple
                                hidden
                                ref={addMoreInputRef}
                                accept={tool.accept || '*/*'}
                                onChange={handleAddMore}
                                tabIndex="-1"
                                aria-hidden="true"
                            />
                        </>
                    )}
                    <button className="btn-reset-workspace" onClick={onReset} aria-label="Reset workspace">
                        <X size={16} /> Reset
                    </button>
                </div>
            </div>

            <div className="workspace-layout">
                {/* Main Content Area (e.g., Page Grid or File List) */}
                <div className="workspace-main">
                    {children}
                </div>

                {/* Sidebar Controls */}
                <div className="workspace-sidebar">
                    <div className="sidebar-inner">
                        <h4 className="sidebar-title">Settings</h4>

                        {sidebar}

                        <button
                            className="btn-primary btn-full workspace-action-btn"
                            onClick={onProcess}
                            disabled={processing || files.length === 0}
                        >
                            {processing ? <Loader className="spinning" size={20} /> : <Download size={20} />}
                            {processing ? 'Processing...' : (actionLabel || tool.name)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ToolWorkspace;
