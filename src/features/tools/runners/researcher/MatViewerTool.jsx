import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseMat } from '../../../../services/researcher/matService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Cpu, HardDrive, FileText, ChevronRight, ChevronDown, Database } from 'lucide-react';
import './Hdf5ViewerTool.css'; // Shared premium researcher styles

const MatViewerTool = () => {
    const { files, addFiles } = useFileList();
    const [matData, setMatData] = useState(null);
    const [selectedPath, setSelectedPath] = useState('');
    const [selectedNode, setSelectedNode] = useState(null);
    const [expandedPaths, setExpandedPaths] = useState(new Set(['/']));
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (files.length > 0) {
            loadFile(files[0].file);
        } else {
            setMatData(null);
            setSelectedNode(null);
            setError('');
        }
    }, [files]);

    const loadFile = async (fileObj) => {
        try {
            setError('');
            const data = await parseMat(fileObj);
            setMatData(data);
            if (data.isHdf5) {
                setSelectedPath('/');
                setSelectedNode(data.h5file.root);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleExpand = (path) => {
        const next = new Set(expandedPaths);
        next.has(path) ? next.delete(path) : next.add(path);
        setExpandedPaths(next);
    };

    const handleSelectNode = (node, path) => {
        setSelectedPath(path);
        setSelectedNode(node);
        setActiveTab('overview');
    };

    const renderTree = (node, path = '/') => {
        const isExpanded = expandedPaths.has(path);
        const children = node.keys ? node.keys() : [];

        return (
            <div key={path} className="tree-node">
                <div 
                    className={`tree-item ${selectedPath === path ? 'active' : ''}`}
                    onClick={() => handleSelectNode(node, path)}
                >
                    <div className="d-flex align-items-center gap-2">
                        {children.length > 0 && (
                            <span onClick={(e) => { e.stopPropagation(); toggleExpand(path); }}>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                        )}
                        <Database size={14} className={children.length > 0 ? 'text-primary' : 'text-success'} />
                        <span className="node-name">{path === '/' ? 'Workspace Root' : path.split('/').pop()}</span>
                    </div>
                </div>
                {isExpanded && children.length > 0 && (
                    <div className="tree-children">
                        {children.map(name => {
                            const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
                            return renderTree(node.get(name), childPath);
                        })}
                    </div>
                )}
            </div>
        );
    };

    const handleExportReport = () => {
        if (!matData) return;
        const content = `MAT-File Analysis Report\n======================\nVersion: ${matData.version}\nStatus: ${matData.status}\nMemory: ${(matData.totalBytes / 1024 / 1024).toFixed(2)} MB\n`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'mat_workspace_report.txt'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ToolWorkspace
            tool={{ name: 'MAT Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".mat"
            onReset={() => { setMatData(null); setError(''); }}
            sidebar={
                <div className="sidebar-info h-full d-flex flex-column">
                    <div className="workspace-tree-container flex-grow overflow-auto p-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                        <div className="text-secondary text-xs uppercase mb-3 font-bold letter-spacing-1">Workspace variables</div>
                        {matData?.isHdf5 ? renderTree(matData.h5file.root) : (
                            <div className="text-muted small p-2">V5 Metadata preview only. Full variable browsing limited to V7.3.</div>
                        )}
                    </div>
                    {matData && (
                        <div className="meta-stats mt-auto pt-4 border-t border-white/5">
                            <div className="stat-row d-flex justify-content-between mb-2 small">
                                <span className="text-muted">Memory:</span>
                                <strong>{(matData.totalBytes / 1024 / 1024).toFixed(2)} MB</strong>
                            </div>
                            <div className="stat-row d-flex justify-content-between mb-4 small">
                                <span className="text-muted">Version:</span>
                                <strong>{matData.version}</strong>
                            </div>
                            <button className="btn-secondary w-full d-flex align-items-center justify-content-center gap-2" onClick={handleExportReport} style={{ height: '40px' }}>
                                <Download size={14} /> Export Report (.txt)
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <div className="mat-main h-full">
                {!matData ? (
                    <div className="empty-state text-center p-12">
                        <Cpu size={64} style={{ opacity: 0.1, margin: '0 auto 16px' }} />
                        <h3>MATLAB Workspace Viewer</h3>
                        <p className="text-muted max-w-sm mx-auto">Analyze .mat files locally (v5 and v7.3). 100% Privacy via Browser parser.</p>
                        {error && <div className="error-badge mt-4 text-danger bg-danger/10 p-2 rounded">{error}</div>}
                    </div>
                ) : (
                    <div className="dataset-panel fade-in h-full">
                        <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="breadcrumb-nav d-flex align-items-center gap-2">
                                    <span className="breadcrumb-part">MAT WORKSPACE</span>
                                    <span className="opacity-30">/</span>
                                    {selectedPath.split('/').filter(Boolean).map((part, i, arr) => (
                                        <React.Fragment key={i}>
                                            <span className="breadcrumb-part">{part}</span>
                                            {i < arr.length - 1 && <span className="opacity-30">/</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <span className="badge-pill bg-primary/10 text-primary border border-primary/20 uppercase font-bold text-xs" style={{ padding: '4px 12px', borderRadius: '20px' }}>
                                    MAT v{matData.version}
                                </span>
                            </div>
                        </div>

                        <div className="custom-tabs d-flex gap-1 mb-6 p-1 bg-black/20 rounded-lg w-fit">
                            <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                            <button className={`tab-pill ${activeTab === 'attributes' ? 'active' : ''}`} onClick={() => setActiveTab('attributes')}>Variable Metadata</button>
                        </div>

                        <div className="tab-content h-full">
                            {activeTab === 'overview' && (
                                <div className="overview-grid">
                                    <div className="overview-card highlight">
                                        <div className="card-label">SELECTED VARIABLE</div>
                                        <div className="card-value font-mono">{selectedPath || 'None Selected'}</div>
                                    </div>
                                    {selectedNode?.shape && (
                                        <div className="overview-card">
                                            <div className="card-label">DIMENSIONS</div>
                                            <div className="card-value font-mono">{selectedNode.shape.join(', ')}</div>
                                        </div>
                                    )}
                                    <div className="overview-card">
                                        <div className="card-label">TYPE</div>
                                        <div className="card-value font-mono">{selectedNode?.dtype || (selectedNode?.keys ? 'Struct/Group' : 'Data Object')}</div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'attributes' && (
                                <div className="attributes-view bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/10 bg-white/5">
                                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Property</th>
                                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 font-mono">
                                            <tr>
                                                <td className="p-4 text-primary text-sm">Path</td>
                                                <td className="p-4 text-sm">{selectedPath}</td>
                                            </tr>
                                            <tr>
                                                <td className="p-4 text-primary text-sm">Is Group</td>
                                                <td className="p-4 text-sm">{selectedNode?.keys ? 'Yes' : 'No'}</td>
                                            </tr>
                                            {selectedNode?.attrs && Object.keys(selectedNode.attrs).map(key => (
                                                <tr key={key}>
                                                    <td className="p-4 text-primary text-sm">{key}</td>
                                                    <td className="p-4 text-sm">{String(selectedNode.attrs[key])}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};

export default MatViewerTool;
