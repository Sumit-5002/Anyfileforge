import React, { useState, useEffect, useMemo } from 'react';
import * as hdf5 from 'jsfive';
import { 
    Download, Cpu, HardDrive, FileText, ChevronRight, ChevronDown, 
    Database, Activity, Info, Trash2, Layers, Loader2, Maximize2, 
    File as FileIcon, Workflow, Network, Boxes
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ToolWorkspace from '../common/ToolWorkspace';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseMat } from '../../../../services/researcher/matService';
import './MatViewerTool.css'; // Unique specialized styles

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const VarNode = ({ name, node, path, onSelect, selectedPath, level = 0 }) => {
    const isGroup = node instanceof hdf5.Group;
    const [isExpanded, setIsExpanded] = useState(level < 1);
    const isSelected = selectedPath === path;

    return (
        <div className="mat-tree-node">
            <div 
                className={`mat-tree-item ${isSelected ? 'selected' : ''}`}
                style={{ marginLeft: `${level * 16}px` }}
                onClick={isGroup ? () => setIsExpanded(!isExpanded) : () => onSelect(path, node)}
            >
                <div className={`node-chevron ${isExpanded ? 'expanded' : ''}`} style={{ width: 14 }}>
                    {isGroup ? <ChevronRight size={14} /> : null}
                </div>
                <div className="node-type-icon">
                    {isGroup ? <Boxes size={14} color="#f97316" /> : <Network size={14} color="#3b82f6" />}
                </div>
                <div className="node-label-text truncate">{name}</div>
            </div>
            {isGroup && isExpanded && (
                <div className="mat-tree-children">
                    {(node.keys || []).map((key) => (
                        <VarNode 
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
        const fetchFiles = async () => {
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
                        setError(`Failed to read ${f.file.name}`);
                    } finally {
                        setIsProcessing(false);
                    }
                }
            }
            const currentNames = files.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => { if (!currentNames.includes(name)) delete nextLoaded[name]; });
            setLoadedMat(nextLoaded);
            if (lastAdded) { setCurrentFile(lastAdded); setSelectedPath(null); setSelectedVariable(null); }
            else if (currentFile && !currentNames.includes(currentFile)) { setCurrentFile(currentNames[0] || null); setSelectedPath(null); setSelectedVariable(null); }
        };
        fetchFiles();
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
        if (!selectedVariable || !selectedVariable.data || (selectedVariable.shape && selectedVariable.shape.length > 1 && (selectedVariable.shape[0] > 1 && selectedVariable.shape[1] > 1))) return null;
        const data = previewData.slice(0, 1000);
        return {
            labels: data.map((_, i) => i + 1),
            datasets: [{
                label: selectedVariable.name,
                data,
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
                fill: true,
                tension: 0.1,
                pointRadius: 0
            }]
        };
    }, [selectedVariable, previewData]);

    return (
        <ToolWorkspace
            tool={{ name: 'MATLAB Workspace' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".mat"
            multiple={true}
            layout="research"
            sidebarTitle="MAT Explorer"
            sidebar={
                <div className="mat-sidebar-explorer">
                    <div className="mat-section">
                        <div className="mat-section-title"><Workflow size={14}/> WORKSPACES</div>
                        <div className="workspace-card-grid">
                            {files.map(f => (
                                <div key={f.file.name} 
                                     className={`workspace-card ${currentFile === f.file.name ? 'active' : ''}`}
                                     onClick={() => { setCurrentFile(f.file.name); setSelectedPath(null); setSelectedVariable(null); }}
                                >
                                    <div className="workspace-card-info">
                                        <FileIcon size={14} className={currentFile === f.file.name ? 'text-orange-500' : 'text-slate-400'} />
                                        <span className="text-xs font-bold font-mono truncate" style={{maxWidth:120}}>{f.file.name}</span>
                                    </div>
                                    <button className="btn-remove-file" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="mat-loading-badge">
                             <Loader2 size={14} className="spinning text-orange-500"/>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Unpacking Workspace...</span>
                        </div>
                    )}

                    {activeMatData && activeMatData.isHdf5 && (
                        <div className="mat-section flex-grow overflow-hidden d-flex flex-column">
                            <div className="mat-section-title"><Database size={14}/> VARIABLE TREE</div>
                            <div className="mat-tree-container flex-grow overflow-auto scroll-premium">
                                <VarNode 
                                    name="base" 
                                    node={activeMatData.h5file.root} 
                                    path="/" 
                                    onSelect={handleSelectNode} 
                                    selectedPath={selectedPath}
                                />
                            </div>
                        </div>
                    )}

                    {activeMatData && !activeMatData.isHdf5 && (
                        <div className="mat-section p-4 bg-orange-500/5 border border-orange-500/10">
                            <div className="mat-section-title"><Info size={14}/> V5 NOTICE</div>
                            <p className="text-[10px] opacity-60 leading-relaxed font-mono">
                                {activeMatData.status}. Browsing optimized for v7.3 (HDF5).
                            </p>
                        </div>
                    )}
                </div>
            }
        >
            <div className="mat-viewer-container h-full p-2">
                {!currentFile ? (
                    <div className="empty-state text-center p-12">
                        <Boxes size={64} className="opacity-10 mx-auto mb-6 text-orange-500"/>
                        <h2 className="mb-2 font-mono">MATLAB Data <span className="text-orange-500">Forge</span></h2>
                        <p className="text-muted text-sm max-w-sm mx-auto">Inspect complex MATLAB workspaces and visualize numerical arrays directly in your secure offline vault.</p>
                    </div>
                ) : !selectedVariable ? (
                    <div className="empty-state text-center p-12">
                        <Activity size={48} className="opacity-10 mx-auto mb-4 text-orange-500"/>
                        <p className="font-mono text-sm">Workspace <b>{currentFile}</b> is active. Select a variable to inspect.</p>
                    </div>
                ) : (
                    <div className="dataset-panel h-full d-flex flex-column fade-in">
                        <div className="dataset-header">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div className="breadcrumb-nav">
                                    <span className="breadcrumb-part font-mono text-xs">{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="breadcrumb-part font-mono text-xs">{selectedVariable.path}</span>
                                </div>
                                <span className="badge-pill bg-orange-500/10 text-orange-500 border border-orange-500/20 font-mono">MAT v{activeMatData.version}</span>
                            </div>
                            
                            <div className="custom-tabs">
                                <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Activity size={14}/> Analysis</button>
                                <button className={`tab-pill ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}><Info size={14}/> Properties</button>
                            </div>
                        </div>

                        <div className="tab-content flex-grow overflow-auto scroll-premium">
                            {activeTab === 'overview' && (
                                <div className="overview-tab d-flex flex-column gap-6 p-1">
                                    <div className="overview-grid">
                                        <div className="overview-card">
                                            <div className="card-label">Variable</div>
                                            <div className="card-value font-mono text-orange-400">{selectedVariable.name}</div>
                                        </div>
                                        <div className="overview-card">
                                            <div className="card-label">Dimensions</div>
                                            <div className="card-value font-mono">[{selectedVariable.shape?.join(', ') || '0'}]</div>
                                        </div>
                                        <div className="overview-card">
                                            <div className="card-label">Class</div>
                                            <div className="card-value font-mono uppercase text-slate-400">{selectedVariable.dtype || 'MAT-Object'}</div>
                                        </div>
                                    </div>

                                    {chartData ? (
                                        <div className="mat-chart-container shadow-premium">
                                            <div className="h-64">
                                                <Line data={chartData} options={{ 
                                                    responsive: true, 
                                                    maintainAspectRatio: false, 
                                                    plugins: { legend: { display: false } },
                                                    scales: { 
                                                        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.4)' } },
                                                        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.4)' } }
                                                    }
                                                }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm italic opacity-70 font-mono text-orange-200">
                                            Complex/Multi-dim data block. Inspecting raw grid...
                                        </div>
                                    )}

                                    <div className="data-preview mt-4">
                                         <div className="card-label mb-3 ml-2">Numerical Preview (Top 5000)</div>
                                         <div className="table-container bg-slate-900/80 rounded-xl overflow-hidden border border-slate-700/30">
                                            <table className="w-full text-[11px] font-mono">
                                                <thead className="bg-white/5 text-slate-400 uppercase tracking-tighter border-b border-white/5">
                                                    <tr><th className="p-3 text-left">idx</th><th className="p-3 text-left">value</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {previewData.slice(0, 50).map((v, i) => (
                                                        <tr key={i} className="hover:bg-white/5 transition-colors"><td className="p-2 px-3 text-slate-500">{i}</td><td className="p-2 px-3 text-orange-400/80 font-bold">{String(v)}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {previewData.length > 50 && <div className="p-3 text-center text-[10px] opacity-30 border-t border-white/5 font-mono">Showing 50 of {previewData.length} records.</div>}
                                            {previewData.length === 0 && <div className="p-12 text-center opacity-30 italic">No numeric data to display.</div>}
                                         </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'metadata' && (
                                <div className="metadata-tab d-flex flex-column gap-6 p-1">
                                    <div className="attributes-table bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5 text-slate-500 uppercase text-[10px] tracking-wider"><tr><th className="p-3 text-left">Property Name</th><th className="p-3 text-left">Value</th></tr></thead>
                                            <tbody className="divide-y divide-white/5">
                                                {Object.entries(selectedVariable.attributes).map(([k, v]) => (
                                                    <tr key={k} className="hover:bg-white/5 transition-colors"><td className="p-3 font-bold text-orange-500/80 font-mono text-xs">{k}</td><td className="p-3 font-mono text-xs text-slate-300">{String(v)}</td></tr>
                                                ))}
                                                {Object.keys(selectedVariable.attributes).length === 0 && <tr><td colSpan="2" className="p-8 text-center text-slate-500 font-mono text-xs">No attribute metadata stored for this node.</td></tr>}
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
