import React, { useState, useEffect, useMemo } from 'react';
import * as hdf5 from 'jsfive';
import { Download, Cpu, HardDrive, FileText, ChevronRight, ChevronDown, Database, Activity, Info, Trash2, Layers, Loader2, Maximize2, File as FileIcon } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ToolWorkspace from '../common/ToolWorkspace';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseMat } from '../../../../services/researcher/matService';
import './Hdf5ViewerTool.css'; // Reuse the professional researcher styles

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DatasetNode = ({ name, node, path, onSelect, selectedPath, level = 0 }) => {
    // MATLAB v7.3 is HDF5 based.
    const isGroup = node instanceof hdf5.Group;
    const [isExpanded, setIsExpanded] = useState(level < 1);
    const isSelected = selectedPath === path;

    return (
        <div className="tree-node-wrapper">
            <div 
                className={`tree-node-item ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={isGroup ? () => setIsExpanded(!isExpanded) : () => onSelect(path, node)}
            >
                <div className={`node-chevron ${isExpanded ? 'expanded' : ''}`}>
                    {isGroup ? <ChevronRight size={14} /> : null}
                </div>
                <div className="node-type-icon">
                    {isGroup ? <Database size={14} className="text-primary-400" /> : <Activity size={14} className="text-secondary-400" />}
                </div>
                <div className="node-label-text">{name}</div>
            </div>
            {isGroup && isExpanded && (
                <div className="node-children">
                    {(node.keys || []).map((key) => (
                        <DatasetNode 
                            key={path + key} 
                            name={key} 
                            node={node.get(key)} 
                            path={path === '/' ? `/${key}` : `${path}/${key}`} 
                            onSelect={onSelect} 
                            selectedPath={selectedPath}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const MatViewerTool = () => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedMat, setLoadedMat] = useState({}); // { fileName: matData }
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);
    const [selectedVariable, setSelectedVariable] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const loadMatFiles = async () => {
            const nextLoaded = { ...loadedMat };
            let lastAdded = null;
            for (const f of files) {
                if (!nextLoaded[f.file.name]) {
                    setIsProcessing(true);
                    try {
                        const data = await parseMat(f.file);
                        nextLoaded[f.file.name] = data;
                        lastAdded = f.file.name;
                    } catch (e) { 
                        console.error(e); 
                        setError(`Failed to load ${f.file.name}`);
                    } finally {
                        setIsProcessing(false);
                    }
                }
            }
            const currentNames = files.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => { if (!currentNames.includes(name)) delete nextLoaded[name]; });
            setLoadedMat(nextLoaded);
            if (lastAdded) {
                setCurrentFile(lastAdded);
                setSelectedPath(null);
                setSelectedVariable(null);
            } else if (currentFile && !currentNames.includes(currentFile)) {
                setCurrentFile(currentNames[0] || null);
                setSelectedPath(null);
                setSelectedVariable(null);
            }
        };
        loadMatFiles();
    }, [files]);

    const activeMatData = currentFile ? loadedMat[currentFile] : null;

    const handleSelectNode = (path, node) => {
        setSelectedPath(path);
        if (node instanceof hdf5.Dataset) {
            setSelectedVariable({
                name: path.split('/').pop(),
                path,
                shape: node.shape,
                dtype: node.dtype,
                data: node.value,
                attributes: node.attrs || {}
            });
            setActiveTab('overview');
        } else {
            setSelectedVariable(null);
        }
    };

    const previewData = useMemo(() => {
        if (!selectedVariable || !selectedVariable.data) return [];
        let data = selectedVariable.data;
        if (data.length > 5000) data = data.slice(0, 5000);
        return Array.from(data);
    }, [selectedVariable]);

    const chartData = useMemo(() => {
        if (!selectedVariable || !selectedVariable.data || (selectedVariable.shape && selectedVariable.shape.length > 1 && selectedVariable.shape[1] > 1)) return null;
        const data = previewData.slice(0, 1000);
        return {
            labels: data.map((_, i) => i + 1),
            datasets: [{
                label: selectedVariable.name,
                data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.1,
                pointRadius: 0
            }]
        };
    }, [selectedVariable, previewData]);

    return (
        <ToolWorkspace
            tool={{ name: 'MATLAB Workspace Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".mat"
            multiple={true}
            layout="research"
            onReset={() => { setLoadedMat({}); setCurrentFile(null); setSelectedVariable(null); }}
            sidebar={
                <div className="sidebar-info researcher-tool-container h-full d-flex flex-column">
                    <div className="explorer-section">
                        <div className="section-header"><Layers size={14}/> LOADED WORKSPACES</div>
                        <div className="file-tabs-list">
                            {files.map(f => (
                                <div key={f.file.name} 
                                     className={`file-item-tab ${currentFile === f.file.name ? 'active' : ''}`}
                                     onClick={() => { setCurrentFile(f.file.name); setSelectedPath(null); setSelectedVariable(null); }}
                                >
                                    <span className="file-name">{f.file.name}</span>
                                    <button className="p-1 opacity-40 hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="p-3 m-3 bg-primary/10 border border-primary/20 rounded-xl d-flex align-items-center gap-2">
                             <Loader2 size={14} className="spinning text-primary"/>
                             <span className="text-xs font-bold uppercase tracking-widest text-primary">Unpacking MAT...</span>
                        </div>
                    )}

                    {activeMatData && activeMatData.isHdf5 && (
                        <div className="explorer-section flex-grow overflow-hidden d-flex flex-column">
                            <div className="section-header"><Database size={14}/> WORKSPACE TREE (v7.3)</div>
                            <div className="tree-explorer flex-grow overflow-auto scroll-premium">
                                <DatasetNode 
                                    name="Root" 
                                    node={activeMatData.h5file.root} 
                                    path="/" 
                                    onSelect={handleSelectNode} 
                                    selectedPath={selectedPath}
                                />
                            </div>
                        </div>
                    )}

                    {activeMatData && !activeMatData.isHdf5 && (
                        <div className="p-4 m-3 bg-white/5 border border-white/10 rounded-xl">
                            <div className="text-secondary-400 font-bold text-xs uppercase mb-2">v5 Legacy Info</div>
                            <p className="text-xs opacity-60 leading-relaxed">
                                This is a MATLAB v5 file. Direct browsing is optimized for v7.3 (HDF5). 
                                Header: {activeMatData.status}
                            </p>
                        </div>
                    )}
                </div>
            }
        >
            <div className="researcher-tool-container h-full">
                {!currentFile ? (
                    <div className="empty-state text-center p-12">
                        <FileIcon size={64} className="opacity-10 mx-auto mb-6"/>
                        <h2 className="mb-2">MATLAB Data Forge</h2>
                        <p className="text-muted">Load .mat workspaces for local inspection and visualization.</p>
                    </div>
                ) : !selectedVariable ? (
                    <div className="empty-state text-center p-12">
                        <Maximize2 size={48} className="opacity-10 mx-auto mb-4"/>
                        <p>Select a <b>variable</b> from the workspace tree to inspect contents.</p>
                    </div>
                ) : (
                    <div className="dataset-panel h-full d-flex flex-column">
                        <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div className="breadcrumb-nav">
                                    <span className="breadcrumb-part">{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="breadcrumb-part">{selectedVariable.path}</span>
                                </div>
                                <span className="badge-pill bg-primary/10 text-primary border border-primary/20">MAT v{activeMatData.version}</span>
                            </div>
                            
                            <div className="custom-tabs">
                                <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Activity size={14}/> Data View</button>
                                <button className={`tab-pill ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}><Info size={14}/> Attributes</button>
                            </div>
                        </div>

                        <div className="tab-content flex-grow overflow-auto scroll-premium">
                            {activeTab === 'overview' && (
                                <div className="overview-tab d-flex flex-column gap-6">
                                    <div className="overview-grid">
                                        <div className="overview-card">
                                            <div className="card-label">Variable Name</div>
                                            <div className="card-value font-mono">{selectedVariable.name}</div>
                                        </div>
                                        <div className="overview-card">
                                            <div className="card-label">Shape</div>
                                            <div className="card-value font-mono">[{selectedVariable.shape?.join(', ') || '0'}]</div>
                                        </div>
                                        <div className="overview-card">
                                            <div className="card-label">DType</div>
                                            <div className="card-value font-mono uppercase text-primary-400">{selectedVariable.dtype}</div>
                                        </div>
                                    </div>

                                    {chartData ? (
                                        <div className="chart-wrapper bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                                            <div className="h-64">
                                                <Line data={chartData} options={{ 
                                                    responsive: true, 
                                                    maintainAspectRatio: false, 
                                                    plugins: { legend: { display: false } },
                                                    scales: { 
                                                        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
                                                        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
                                                    }
                                                }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl text-sm italic opacity-70">
                                            Multi-dimensional or complex data detected. Detailed grid view active below.
                                        </div>
                                    )}

                                    <div className="data-preview">
                                         <div className="card-label mb-3">Workspace Values (First 1000)</div>
                                         <div className="table-container bg-black/30 rounded-xl overflow-hidden border border-white/5 shadow-premium">
                                            <table className="w-full text-xs font-mono">
                                                <thead className="bg-white/5 text-muted uppercase tracking-tighter border-b border-white/10">
                                                    <tr><th className="p-3 text-left">Index</th><th className="p-3 text-left">Value</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {previewData.slice(0, 50).map((v, i) => (
                                                        <tr key={i}><td className="p-2 px-3 text-muted">{i}</td><td className="p-2 px-3 text-primary-400 font-bold">{String(v)}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {previewData.length > 50 && <div className="p-2 text-center text-xs opacity-40">... and {previewData.length - 50} more items ...</div>}
                                         </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'metadata' && (
                                <div className="metadata-tab d-flex flex-column gap-6">
                                    <div className="attributes-table bg-black/20 rounded-xl border border-white/5">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5 text-muted uppercase text-xs"><tr><th className="p-3 text-left">MAT Attribute</th><th className="p-3 text-left">Value</th></tr></thead>
                                            <tbody className="divide-y divide-white/5">
                                                {Object.entries(selectedVariable.attributes).map(([k, v]) => (
                                                    <tr key={k}><td className="p-3 font-bold text-primary-400">{k}</td><td className="p-3 font-mono">{String(v)}</td></tr>
                                                ))}
                                                {Object.keys(selectedVariable.attributes).length === 0 && <tr><td colSpan="2" className="p-6 text-center text-muted">No header attributes found for this variable.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
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
