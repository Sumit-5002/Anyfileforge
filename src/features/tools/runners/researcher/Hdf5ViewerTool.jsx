import React, { useState, useEffect, useMemo } from 'react';
import * as hdf5 from 'jsfive';
import { 
    Download, FileText, ChevronRight, ChevronDown, Database, 
    Activity, Info, Trash2, Layers, Loader2, Maximize2,
    FileJson, FileSpreadsheet as CSVIcon, Search, Workflow, Boxes, Network,
    Sigma, Calculator, Code2, Compare, GitCompare
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ToolWorkspace from '../common/ToolWorkspace';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import './Hdf5ViewerTool.css'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DatasetNode = ({ name, node, path, onSelect, selectedPaths, level = 0 }) => {
    // In jsfive, nodes can be Group or Dataset
    const isGroup = node instanceof hdf5.Group;
    const [isExpanded, setIsExpanded] = useState(level < 1);
    const isSelected = selectedPaths.includes(path);

    let keys = [];
    if (isGroup) {
        try {
            if (typeof node.keys === 'function') keys = node.keys();
            else if (Array.isArray(node.keys)) keys = node.keys;
            else if (node._links) keys = Object.keys(node._links);
        } catch (e) {
            console.warn("Could not read keys for group:", name, e);
        }
    }

    return (
        <div className="tree-node-wrapper">
            <div 
                className={`tree-node-item ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${level * 16 + 10}px`, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', transition: 'background 0.2s', background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'transparent' }}
                onClick={isGroup ? () => setIsExpanded(!isExpanded) : () => onSelect(path, node, name)}
            >
                <div className={`node-chevron ${isExpanded ? 'expanded' : ''}`} style={{ width: 14, transition: 'transform 0.2s', transform: isExpanded && isGroup ? 'rotate(90deg)' : 'none', display: isGroup ? 'block' : 'none' }}>
                    <ChevronRight size={14} />
                </div>
                <div className="node-type-icon">
                    {isGroup ? <Boxes size={14} color="#a78bfa" /> : <Network size={14} color="#60a5fa" />}
                </div>
                <div className="node-label-text font-mono text-[11px] font-bold tracking-tight truncate overflow-hidden" title={name}>{name}</div>
            </div>
            {isGroup && isExpanded && (
                <div className="node-children">
                    {keys.sort().map((key) => {
                        let childNode;
                        try {
                            childNode = node.get(key);
                        } catch(e) { return null; }
                        return (
                            <DatasetNode 
                                key={path + key} 
                                name={key} 
                                node={childNode} 
                                path={path === '/' ? `/${key}` : `${path}/${key}`} 
                                onSelect={onSelect} 
                                selectedPaths={selectedPaths}
                                level={level + 1}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const Hdf5ViewerTool = ({ tool }) => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedFiles, setLoadedFiles] = useState({}); 
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedPaths, setSelectedPaths] = useState([]);
    const [selectedDatasets, setSelectedDatasets] = useState([]); // Array of dataset objects
    const [isProcessing, setIsProcessing] = useState(false);
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
                    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
                }
            }
            const currentFileNames = files.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => { if (!currentFileNames.includes(name)) delete nextLoaded[name]; });
            setLoadedFiles(nextLoaded);
            if (lastAdded) { setCurrentFile(lastAdded); setSelectedPaths([]); setSelectedDatasets([]); }
        };
        loadH5();
    }, [files]);

    const activeH5 = currentFile ? loadedFiles[currentFile] : null;

    const handleSelectNode = (path, node, name) => {
        if (node instanceof hdf5.Dataset) {
            const isMulti = window.event && (window.event.ctrlKey || window.event.metaKey || window.event.shiftKey);
            
            // In jsfive, node.value might need to be accessed. 
            // It could be a typed array.
            const rawValue = node.value;
            const ds = {
                name: name || path.split('/').pop(),
                path,
                shape: node.shape || [],
                dtype: node.dtype || 'mixed',
                data: Array.isArray(rawValue) ? rawValue : (rawValue.buffer ? Array.from(rawValue) : [rawValue]),
                attributes: node.attrs || {}
            };

            if (isMulti) {
                setSelectedPaths(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
                setSelectedDatasets(prev => prev.some(d => d.path === path) ? prev.filter(d => d.path !== path) : [...prev, ds]);
            } else {
                setSelectedPaths([path]);
                setSelectedDatasets([ds]);
            }
            setActiveTab('overview');
        } else {
            setSelectedPaths([]);
            setSelectedDatasets([]);
        }
    };

    const previewData = useMemo(() => {
        if (selectedDatasets.length === 0) return [];
        return selectedDatasets[0].data.slice(0, 1000);
    }, [selectedDatasets]);

    const chartData = useMemo(() => {
        if (selectedDatasets.length === 0) return null;
        
        const datasets = selectedDatasets.map((ds, idx) => {
            const dataSlice = ds.data.slice(0, 1000);
            const colors = ['#8b5cf6', '#3b82f6', '#f97316', '#10b981', '#ef4444'];
            return {
                label: ds.name,
                data: dataSlice.map(v => typeof v === 'number' ? v : 0),
                borderColor: colors[idx % colors.length],
                backgroundColor: `${colors[idx % colors.length]}22`,
                fill: selectedDatasets.length === 1,
                tension: 0.1,
                pointRadius: 0
            };
        });

        const maxPoints = Math.max(...selectedDatasets.map(ds => Math.min(ds.data.length, 1000)));

        return {
            labels: Array.from({ length: maxPoints }, (_, i) => i + 1),
            datasets
        };
    }, [selectedDatasets]);

    const stats = useMemo(() => {
        if (selectedDatasets.length === 0 || typeof selectedDatasets[0].data[0] !== 'number') return null;
        const data = selectedDatasets[0].data;
        const n = data.length;
        if (n === 0) return null;
        let sum = 0, min = data[0], max = data[0];
        for (let i = 0; i < n; i++) {
            const v = data[i];
            sum += v;
            if (v < min) min = v;
            if (v > max) max = v;
        }
        return { mean: sum/n, min, max, count: n };
    }, [selectedDatasets]);

    const handleExport = (format) => {
        if (selectedDatasets.length === 0) return;
        const ds = selectedDatasets[0];
        let content = '';
        let fileName = `${ds.name}.${format}`;

        if (format === 'csv') {
            content = ds.data.join('\n');
            const blob = new Blob([content], { type: 'text/csv' });
            triggerDownload(blob, fileName);
        } else if (format === 'json') {
            content = JSON.stringify(ds, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            triggerDownload(blob, fileName);
        }
    };

    const triggerDownload = (blob, fileName) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ToolWorkspace
            tool={tool}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".h5,.hdf5"
            multiple={true}
            layout="research"
            sidebarTitle="HDF5 Voyager"
            onReset={() => {
                files.forEach(f => removeFile(f.id));
                setLoadedFiles({});
                setCurrentFile(null);
                setSelectedPaths([]);
                setSelectedDatasets([]);
            }}
            sidebar={
                <div className="sidebar-info researcher-tool-container h-full flex flex-col">
                    <div className="explorer-section">
                        <div className="section-header"><Layers size={14}/> LOADED ARCHIVES</div>
                        <div className="file-tabs-list">
                            {files.map(f => (
                                <div key={f.file.name} className={`file-item-tab ${currentFile === f.file.name ? 'active' : ''}`} onClick={() => { setCurrentFile(f.file.name); setSelectedPaths([]); setSelectedDatasets([]); }}>
                                    <div className="flex items-center gap-2 overflow-hidden"><Database size={13} className={currentFile === f.file.name ? 'text-primary-400' : 'text-slate-500'} /><span className="file-name font-mono text-[11px] font-bold">{f.file.name}</span></div>
                                    <button className="btn-remove-ocean" style={{opacity:0.6}} onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}><Trash2 size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    {isProcessing && (<div className="ocean-loading-badge" style={{borderColor: 'rgba(139, 92, 246, 0.4)', color: '#a78bfa'}}><Loader2 size={14} className="spinning"/><span className="text-[10px] uppercase font-bold text-primary-400">Parsing...</span></div>)}
                    {activeH5 && (
                        <div className="explorer-section flex-grow overflow-hidden flex flex-col">
                            <div className="section-header flex justify-between"><span><Search size={14}/> BROWSER</span><span className="text-[9px] opacity-40">Shift/Double for Multi</span></div>
                            <div className="tree-explorer flex-grow overflow-auto scroll-premium pr-1">
                                <DatasetNode name="root" node={activeH5.root} path="/" onSelect={handleSelectNode} selectedPaths={selectedPaths} />
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="researcher-tool-container h-full p-4 pb-8 overflow-hidden">
                {!currentFile ? (
                    <div className="empty-state text-center p-12"><Database size={64} className="opacity-10 mx-auto mb-6 text-primary-500"/><h2 className="mb-2 font-mono">HDF5 Scientific <span className="text-secondary-400">Voyager</span></h2><p className="text-muted text-sm max-w-sm mx-auto">Explore high-dimensional hierarchical data structures with system-level speed and precision.</p></div>
                ) : selectedDatasets.length === 0 ? (
                    <div className="empty-state text-center p-12"><Maximize2 size={48} className="opacity-10 mx-auto mb-4 text-primary-400"/><p className="font-mono text-sm opacity-60">Archive <b>{currentFile}</b> mounted. Select dataset(s).</p></div>
                ) : (
                    <div className="dataset-panel h-full flex flex-col fade-in overflow-hidden gap-2">
                        <div className="dataset-header mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="breadcrumb-nav bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 overflow-hidden max-w-[70%]">
                                    <Database size={12} className="text-slate-500 flex-shrink-0"/>
                                    <span className="breadcrumb-part font-mono text-[10px] text-slate-400 truncate">{currentFile}</span>
                                    <ChevronRight size={10} className="text-slate-600"/>
                                    <span className="breadcrumb-part font-mono text-[10px] text-primary-400 font-bold truncate">{selectedDatasets[0].path}</span>
                                    {selectedDatasets.length > 1 && <span className="bg-secondary-500/20 text-secondary-400 text-[9px] px-2 py-0.5 rounded-full font-bold">+{selectedDatasets.length-1}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleExport('csv')} className="btn btn-secondary p-2.5 rounded-xl hover:bg-secondary-500/10 hover:text-secondary-400 transition-all border-white/5 shadow-premium" title="CSV Export"><CSVIcon size={16}/></button>
                                    <button onClick={() => handleExport('json')} className="btn btn-secondary p-2.5 rounded-xl hover:bg-secondary-500/10 hover:text-secondary-400 transition-all border-white/5 shadow-premium" title="JSON Export"><FileJson size={16}/></button>
                                    <div className="bg-primary/10 text-primary border border-primary/20 font-bold tracking-widest px-3 py-1.5 rounded-full text-[9px] uppercase ml-2">HDF-5 Binary</div>
                                </div>
                            </div>
                            <div className="custom-tabs">
                                <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Activity size={14}/> Dual Plot</button>
                                <button className={`tab-pill ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}><Calculator size={14}/> Stats</button>
                                <button className={`tab-pill ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}><Info size={14}/> Meta</button>
                            </div>
                        </div>
                        <div className="tab-content flex-grow overflow-y-auto scroll-premium pr-2 pb-6">
                             {activeTab === 'overview' && (
                                <div className="overview-tab flex flex-col gap-6 p-1">
                                    <div className="overview-grid">
                                        {selectedDatasets.slice(0, 2).map((ds, idx) => (
                                            <div key={idx} className="overview-card"><div className="card-label">{idx === 0 ? 'Primary' : 'Secondary'} Dataset</div><div className="card-value font-mono text-primary-400">{ds.name} [{ds.shape.join(',')}]</div></div>
                                        ))}
                                    </div>
                                    <div className="chart-wrapper bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                                        <div className="h-64"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: selectedDatasets.length > 1, labels: { color: 'rgba(255,255,255,0.4)', boxWidth: 10 } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: 'rgba(255,255,255,0.3)' } }, y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: 'rgba(255,255,255,0.3)' } } } }} /></div>
                                    </div>
                                    <div className="data-preview mt-4">
                                         <div className="card-label mb-3 ml-2 text-primary-400 font-bold uppercase tracking-widest text-[9px]">Comparative Buffer Analysis</div>
                                         <div className="table-container bg-black/40 rounded-xl overflow-hidden border border-white/5">
                                            <table className="w-full text-[11px] font-mono">
                                                <thead className="bg-white/5 text-muted border-b border-white/10"><tr><th className="p-3 text-left">pos</th>{selectedDatasets.map(ds => <th key={ds.path} className="p-3 text-left">{ds.name}</th>)}</tr></thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {previewData.slice(0, 50).map((v, i) => (
                                                        <tr key={i} className="hover:bg-white/5"><td className="p-2 px-3 text-muted">{i}</td>{selectedDatasets.map(ds => <td key={ds.path} className="p-2 px-3 text-primary-300">{(ds.data[i] !== undefined ? (typeof ds.data[i] === 'number' ? ds.data[i].toFixed(4) : String(ds.data[i])) : '-')}</td>)}</tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                         </div>
                                    </div>
                                </div>
                             )}
                             {activeTab === 'analysis' && (<div className="analysis-tab p-1 fade-in">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-6 flex items-center gap-2"><Calculator size={14}/> Mathematical Synthesis</h3>
                                {stats ? (<div className="stats-grid grid grid-cols-2 gap-4"><div className="stat-box bg-black/40 p-6 rounded-2xl border border-white/5"><div className="card-label">Primary Mean</div><div className="text-2xl font-mono text-primary-300">{stats.mean.toFixed(8)}</div></div><div className="stat-box bg-black/40 p-6 rounded-2xl border border-white/5"><div className="card-label">Primary Peak</div><div className="text-2xl font-mono text-primary-300">{stats.max.toFixed(4)}</div></div></div>) : <div className="p-12 text-center opacity-40 font-mono">Select numeric nodes to synthesize.</div>}
                             </div>)}
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};

export default Hdf5ViewerTool;
