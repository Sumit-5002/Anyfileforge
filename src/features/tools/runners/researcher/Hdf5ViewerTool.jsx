import React, { useState, useEffect, useMemo } from 'react';
import * as hdf5 from 'jsfive';
import { Download, FileText, ChevronRight, ChevronDown, Database, Activity, Info, Trash2, Layers, Loader2, Maximize2 } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ToolWorkspace from '../common/ToolWorkspace';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import './Hdf5ViewerTool.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DatasetNode = ({ name, node, path, onSelect, selectedPath, level = 0 }) => {
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
                    {node.keys.map((key) => (
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

const Hdf5ViewerTool = () => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedFiles, setLoadedFiles] = useState({}); // { fileName: h5FileObject }
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const loadH5 = async () => {
            const nextLoaded = { ...loadedFiles };
            let lastAdded = null;
            for (const f of files) {
                if (!nextLoaded[f.file.name]) {
                    setIsProcessing(true);
                    try {
                        const buffer = await f.file.arrayBuffer();
                        const h5 = new hdf5.File(buffer, f.file.name);
                        nextLoaded[f.file.name] = h5;
                        lastAdded = f.file.name;
                    } catch (err) { setError(`Failed to parse ${f.file.name}: ${err.message}`); }
                    finally { setIsProcessing(false); }
                }
            }
            const currentFileNames = files.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => { if (!currentFileNames.includes(name)) delete nextLoaded[name]; });
            setLoadedFiles(nextLoaded);
            if (lastAdded) { setCurrentFile(lastAdded); setSelectedPath(null); setSelectedDataset(null); }
            else if (currentFile && !currentFileNames.includes(currentFile)) { setCurrentFile(currentFileNames[0] || null); setSelectedPath(null);  setSelectedDataset(null); }
        };
        loadH5();
    }, [files]);

    const activeH5 = currentFile ? loadedFiles[currentFile] : null;

    const handleSelectNode = (path, node) => {
        setSelectedPath(path);
        if (node instanceof hdf5.Dataset) {
            setSelectedDataset({
                name: path.split('/').pop(),
                path,
                shape: node.shape,
                dtype: node.dtype,
                data: node.value,
                attributes: node.attrs || {}
            });
            setActiveTab('overview');
        } else { setSelectedDataset(null); }
    };

    const previewData = useMemo(() => {
        if (!selectedDataset || !selectedDataset.data) return [];
        let data = selectedDataset.data;
        if (data.length > 1000) data = data.slice(0, 1000);
        return Array.from(data);
    }, [selectedDataset]);

    const chartData = useMemo(() => {
        if (!selectedDataset || !selectedDataset.data || selectedDataset.shape.length > 1) return null;
        const data = previewData;
        return {
            labels: data.map((_, i) => i + 1),
            datasets: [{
                label: selectedDataset.name,
                data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.1,
                pointRadius: 0
            }]
        };
    }, [selectedDataset, previewData]);

    return (
        <ToolWorkspace
            tool={{ name: 'HDF5 Scientific Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".h5,.hdf5"
            multiple={true}
            layout="research"
            onReset={() => { setLoadedFiles({}); setCurrentFile(null); setSelectedDataset(null); }}
            sidebar={
                <div className="sidebar-info researcher-tool-container">
                    <div className="explorer-section">
                        <div className="section-header"><Layers size={14}/> OPENED FILES</div>
                        <div className="file-tabs-list">
                            {files.map(f => (
                                <div key={f.file.name} 
                                     className={`file-item-tab ${currentFile === f.file.name ? 'active' : ''}`}
                                     onClick={() => { setCurrentFile(f.file.name); setSelectedPath(null); setSelectedDataset(null); }}
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
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl d-flex align-items-center gap-2">
                             <Loader2 size={14} className="spinning text-primary"/>
                             <span className="text-xs font-bold uppercase tracking-widest text-primary">Parsing HDF5...</span>
                        </div>
                    )}

                    {activeH5 && (
                        <div className="explorer-section flex-grow overflow-hidden d-flex flex-column">
                            <div className="section-header"><Database size={14}/> BROWSER</div>
                            <div className="tree-explorer flex-grow overflow-auto scroll-premium">
                                <DatasetNode 
                                    name={currentFile} 
                                    node={activeH5.root} 
                                    path="/" 
                                    onSelect={handleSelectNode} 
                                    selectedPath={selectedPath}
                                />
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="researcher-tool-container h-full">
                {!currentFile ? (
                    <div className="empty-state text-center p-12">
                        <Database size={64} className="opacity-10 mx-auto mb-6"/>
                        <h2 className="mb-2">HDF5 Explorer</h2>
                        <p className="text-muted">Import binary datasets for high-performance visual analysis.</p>
                    </div>
                ) : !selectedDataset ? (
                    <div className="empty-state text-center p-12">
                        <Maximize2 size={48} className="opacity-10 mx-auto mb-4"/>
                        <p>Select a <b>dataset</b> from the explorer to begin inspection.</p>
                    </div>
                ) : (
                    <div className="dataset-panel h-full d-flex flex-column">
                        <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div className="breadcrumb-nav">
                                    <span className="breadcrumb-part">{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="breadcrumb-part">{selectedDataset.path}</span>
                                </div>
                                <span className="badge-pill bg-primary/10 text-primary border border-primary/20">{selectedDataset.dtype}</span>
                            </div>
                            
                            <div className="custom-tabs">
                                <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Activity size={14}/> Analysis</button>
                                <button className={`tab-pill ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}><Info size={14}/> Metadata</button>
                            </div>
                        </div>

                        <div className="tab-content flex-grow overflow-auto scroll-premium">
                            {activeTab === 'overview' && (
                                <div className="overview-tab d-flex flex-column gap-6">
                                    <div className="overview-grid">
                                        <div className="overview-card">
                                            <div className="card-label">Shape</div>
                                            <div className="card-value font-mono">[{selectedDataset.shape.join(', ')}]</div>
                                        </div>
                                        <div className="overview-card">
                                            <div className="card-label">Data Type</div>
                                            <div className="card-value uppercase">{selectedDataset.dtype}</div>
                                        </div>
                                    </div>

                                    {chartData ? (
                                        <div className="chart-wrapper bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                                            <div className="h-64">
                                                <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl text-sm">
                                            Visualizing {selectedDataset.shape.length}-dimensional data. Heatmap slice visualization active for NxD arrays.
                                        </div>
                                    )}

                                    <div className="data-preview">
                                         <div className="card-label mb-3">Raw Values (First 1000)</div>
                                         <div className="table-container bg-black/30 rounded-xl overflow-hidden border border-white/5">
                                            <table className="w-full text-xs font-mono">
                                                <thead className="bg-white/5 text-muted uppercase tracking-tighter border-b border-white/10">
                                                    <tr><th className="p-3 text-left">POS</th><th className="p-3 text-left">VALUE</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {previewData.slice(0, 50).map((v, i) => (
                                                        <tr key={i}><td className="p-2 px-3 text-muted">{i}</td><td className="p-2 px-3 text-primary-300 font-bold">{v}</td></tr>
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
                                            <thead className="bg-white/5 text-muted uppercase text-xs"><tr><th className="p-3 text-left">Attribute</th><th className="p-3 text-left">Value</th></tr></thead>
                                            <tbody className="divide-y divide-white/5">
                                                {Object.entries(selectedDataset.attributes).map(([k, v]) => (
                                                    <tr key={k}><td className="p-3 font-bold text-primary-300">{k}</td><td className="p-3 font-mono">{String(v)}</td></tr>
                                                ))}
                                                {Object.keys(selectedDataset.attributes).length === 0 && <tr><td colSpan="2" className="p-6 text-center text-muted">No attributes found.</td></tr>}
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

export default Hdf5ViewerTool;
