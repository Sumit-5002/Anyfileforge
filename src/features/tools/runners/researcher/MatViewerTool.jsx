import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseMat } from '../../../../services/researcher/matService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Cpu, HardDrive, FileText, ChevronRight, ChevronDown, Database, File as FileIcon, Trash2 } from 'lucide-react';
import './Hdf5ViewerTool.css';

const MatViewerTool = () => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedMat, setLoadedMat] = useState({}); // { fileName: matData }
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedPath, setSelectedPath] = useState('');
    const [selectedNode, setSelectedNode] = useState(null);
    const [expandedPaths, setExpandedPaths] = useState(new Set(['/']));
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const loadMatFiles = async () => {
            const nextLoaded = { ...loadedMat };
            let lastAdded = null;
            for (const f of files) {
                if (!nextLoaded[f.file.name]) {
                    try {
                        const data = await parseMat(f.file);
                        nextLoaded[f.file.name] = data;
                        lastAdded = f.file.name;
                    } catch (e) { console.error(e); }
                }
            }
            const currentNames = files.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => { if (!currentNames.includes(name)) delete nextLoaded[name]; });
            setLoadedMat(nextLoaded);
            if (lastAdded) setCurrentFile(lastAdded);
            else if (currentFile && !currentNames.includes(currentFile)) setCurrentFile(currentNames[0] || null);
        };
        loadMatFiles();
    }, [files]);

    const handleSelectNode = (node, path) => {
        setSelectedPath(path);
        setSelectedNode(node);
        setActiveTab('overview');
    };

    const renderTree = (node, path = '/') => {
        const isExpanded = expandedPaths.has(path);
        const children = node.keys ? node.keys() : [];
        const isSelected = selectedPath === path;

        return (
            <div key={path} className="tree-node">
                <div className={`node-label ${isSelected ? 'active-node' : ''}`} onClick={() => handleSelectNode(node, path)}>
                    <span onClick={(e) => { if (children.length > 0) { e.stopPropagation(); const n=new Set(expandedPaths); n.has(path)?n.delete(path):n.add(path); setExpandedPaths(n); } }}>
                        {children.length > 0 ? (isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <span style={{width:14}}/>}
                    </span>
                    <Database size={14} color={children.length > 0 ? '#3b82f6' : '#10b981'} />
                    <span className="node-name">{path === '/' ? 'Workspace' : path.split('/').pop()}</span>
                </div>
                {isExpanded && children.length > 0 && (
                    <div className="node-children">
                        {children.map(name => renderTree(node.get(name), path === '/' ? `/${name}` : `${path}/${name}`))}
                    </div>
                )}
            </div>
        );
    };

    const currentData = currentFile ? loadedMat[currentFile] : null;

    return (
        <ToolWorkspace
            tool={{ name: 'MAT Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".mat"
            multiple={true}
            layout="research"
            onReset={() => { setLoadedMat({}); setCurrentFile(null); }}
            sidebar={
                <div className="sidebar-info researcher-tool-container h-full d-flex flex-column gap-6">
                    <div className="opened-files shadow-sm">
                        <div className="text-muted text-xs uppercase mb-3 font-bold tracking-wider">Opened Workspaces</div>
                        <div className="d-flex flex-column gap-2">
                            {files.map(f => (
                                <div key={f.file.name} 
                                     className={`file-tab d-flex align-items-center justify-content-between p-2 rounded-lg cursor-pointer transition-all ${currentFile === f.file.name ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/5'}`}
                                     style={{ border: '1px solid currentColor' }}
                                     onClick={() => { setCurrentFile(f.file.name); setSelectedPath('/'); setSelectedNode(loadedMat[f.file.name]?.h5file?.root); }}
                                >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <FileIcon size={14} className={currentFile === f.file.name ? 'text-primary' : 'text-muted'} />
                                        <span className="text-xs truncate font-medium">{f.file.name}</span>
                                    </div>
                                    <button className="p-1 hover:text-danger opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {currentData && (
                        <div className="workspace-tree-container flex-grow overflow-auto p-2" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                            <div className="text-secondary text-xs uppercase mb-3 font-bold">Workspace: {currentFile}</div>
                            {currentData.isHdf5 ? renderTree(currentData.h5file.root) : <div className="text-muted small p-4 bg-black/20 rounded">V5 preview only. Full browsing for V7.3.</div>}
                        </div>
                    )}
                </div>
            }
        >
             <div className="mat-main h-full researcher-tool-container">
                {!currentFile ? (
                    <div className="empty-state text-center p-12"><Cpu size={64} className="opacity-10 mx-auto mb-4"/><h3>MAT Explorer</h3><p className="text-muted">Import .mat files locally.</p></div>
                ) : !selectedNode ? (
                    <div className="empty-state text-center p-12"><HardDrive size={48} className="opacity-10 mx-auto mb-4"/><p>Select a variable from <b>{currentFile}</b>.</p></div>
                ) : (
                    <div className="dataset-panel fade-in">
                        <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="breadcrumb-nav d-flex align-items-center gap-2">
                                    <span className="breadcrumb-part truncate" style={{maxWidth:120}}>{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="breadcrumb-part">{selectedPath === '/' ? 'Root' : selectedPath}</span>
                                </div>
                                <span className="badge-pill bg-primary/10 text-primary border border-primary/20">MAT v{currentData.version}</span>
                            </div>
                        </div>

                        <div className="custom-tabs d-flex gap-1 mb-6 p-1 bg-black/20 rounded-lg w-fit">
                            <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                            <button className={`tab-pill ${activeTab === 'attributes' ? 'active' : ''}`} onClick={() => setActiveTab('attributes')}>Properties</button>
                        </div>

                        <div className="tab-content">
                            {activeTab === 'overview' && (
                                <div className="overview-grid">
                                    <div className="overview-card"><div className="card-label">VARIABLE</div><div className="card-value font-mono truncate">{selectedPath}</div></div>
                                    {selectedNode.shape && <div className="overview-card"><div className="card-label">DIMENSIONS</div><div className="card-value font-mono">[{selectedNode.shape.join(', ')}]</div></div>}
                                    <div className="overview-card"><div className="card-label">DTYPE</div><div className="card-value font-mono">{selectedNode.dtype || 'Struct'}</div></div>
                                </div>
                            )}
                            {activeTab === 'attributes' && (
                                <div className="attributes-view bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                                     <table className="w-full text-left font-mono text-sm">
                                        <thead className="bg-white/5 text-xs text-muted"><tr><th className="p-3">Property</th><th className="p-3">Value</th></tr></thead>
                                        <tbody className="divide-y divide-white/5">
                                            <tr><td className="p-3 text-primary">Path</td><td className="p-3">{selectedPath}</td></tr>
                                            {selectedNode.attrs && Object.keys(selectedNode.attrs).map(k => <tr key={k}><td className="p-3 text-primary">{k}</td><td className="p-3">{String(selectedNode.attrs[k])}</td></tr>)}
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
