import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as hdf5 from 'jsfive';
import { 
    Download, Cpu, HardDrive, FileText, ChevronRight, ChevronDown, 
    Database, Activity, Info, Trash2, Layers, Loader2, Maximize2, 
    File as FileIcon, Workflow, Network, Boxes, FileJson, FileSpreadsheet as CSVIcon,
    BarChart3, Hash, Sigma, Calculator, Code2, Waves, Eye, Zap
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ToolWorkspace from '../common/ToolWorkspace';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseMat } from '../../../../services/researcher/matService';
import './MatViewerTool.css'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Simple FFT implementation (Magnitude only)
const fftMagnitude = (data) => {
    const N = data.length;
    if (N < 2) return data;
    const freqs = new Array(N/2).fill(0);
    for (let k = 0; k < N/2; k++) {
        let re = 0, im = 0;
        for (let n = 0; n < N; n++) {
            const angle = (2 * Math.PI * k * n) / N;
            re += data[n] * Math.cos(angle);
            im -= data[n] * Math.sin(angle);
        }
        freqs[k] = Math.sqrt(re*re + im*im);
    }
    return freqs;
};

const HeatmapRenderer = ({ data, shape }) => {
    const canvasRef = useRef(null);
    const [h, w] = shape && shape.length >= 2 ? [shape[0], shape[1]] : [0, 0];

    useEffect(() => {
        if (!canvasRef.current || !data || !h || !w) return;
        
        // Extremely robust data flattening
        let flatData = data;
        if (Array.isArray(data) && Array.isArray(data[0])) flatData = data.flat();
        else if (data.buffer && data.length) flatData = Array.from(data); // Handle TypedArrays simply
        
        const ctx = canvasRef.current.getContext('2d');
        const imgData = ctx.createImageData(w, h);
        
        // Handle RGB/RGBA specifically
        const isRgb = shape.length >= 3 && (shape[2] === 3 || shape[shape.length-1] === 3);
        
        if (isRgb) {
            // Raw Matrix → RGB conversion with scaling check
            let maxVal = 0;
            for(let v of flatData) if(v > maxVal) maxVal = v;
            const scale = maxVal <= 1.0 ? 255 : 1; // Auto-scale if data is 0-1

            for (let i = 0; i < (w * h); i++) {
                const idx = i * 4;
                const dataIdx = i * 3;
                imgData.data[idx] = (flatData[dataIdx] || 0) * scale;
                imgData.data[idx+1] = (flatData[dataIdx+1] || 0) * scale;
                imgData.data[idx+2] = (flatData[dataIdx+2] || 0) * scale;
                imgData.data[idx+3] = 255;
            }
        } else {
            // Scientific Mapping (Single Channel)
            let min = flatData[0] || 0, max = flatData[0] || 0;
            for (let i = 0; i < flatData.length; i++) {
                const v = flatData[i];
                if (v < min) min = v;
                if (v > max) max = v;
            }
            
            const range = max - min || 1;
            const len = Math.min(flatData.length, w * h);

            for (let i = 0; i < len; i++) {
                const val = ((flatData[i] - min) / range) * 255;
                const idx = i * 4;
                imgData.data[idx] = val; 
                imgData.data[idx+1] = val * 0.45; 
                imgData.data[idx+2] = val * 0.1; 
                imgData.data[idx+3] = 255; 
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }, [data, h, w, shape]);

    const exportToPng = () => {
        if (!canvasRef.current) return;
        try {
            const link = document.createElement('a');
            link.download = `matrix_render_${Date.now()}.png`;
            link.href = canvasRef.current.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("PNG Capture Failed:", e);
            alert("Export failed: " + e.message);
        }
    };

    return (
        <div className="heatmap-box">
            <div className="canvas-header flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="card-label">Spatial Matrix Forge</span>
                    <span className="text-xs opacity-40 font-mono">{shape.join(' × ')} Res</span>
                </div>
                <button 
                    onClick={exportToPng}
                    className="p-2 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg text-orange-500 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                >
                    <Download size={14}/> Capture PNG
                </button>
            </div>
            <div className="canvas-wrapper flex items-center justify-center bg-black rounded-lg overflow-hidden border border-white/5 shadow-2xl" style={{ minHeight: 400 }}>
                <canvas ref={canvasRef} width={w} height={h} style={{ maxWidth: '100%', maxHeight: '400px', imageRendering: 'pixelated' }} />
            </div>
        </div>
    );
};

const MatrixNode = ({ name, node, path, onSelect, selectedPath, level = 0 }) => {
    const isGroup = node instanceof hdf5.Group;
    const [isExpanded, setIsExpanded] = useState(level < 1);
    const isSelected = selectedPath === path;
    let keys = [];
    if (isGroup) {
        if (typeof node.keys === 'function') keys = node.keys();
        else if (Array.isArray(node.keys)) keys = node.keys;
        else if (node._links) keys = Object.keys(node._links);
    }
    return (
        <div className="mat-tree-node">
            <div 
                className={`mat-tree-item ${isSelected ? 'selected' : ''} group`} 
                style={{ marginLeft: `${level * 12}px` }} 
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(path, node);
                    if (isGroup) setIsExpanded(!isExpanded);
                }}
            >
                <div className={`node-chevron ${isExpanded ? 'expanded rotate-90' : ''} transition-transform duration-200`} style={{ width: 14 }}>
                    {isGroup ? <ChevronRight size={14} className="opacity-40" /> : null}
                </div>
                <div className="node-type-icon">
                    {isGroup ? <Boxes size={14} className="text-orange-500/70" /> : <Activity size={12} className={isSelected ? 'text-orange-500' : 'text-slate-500'} />}
                </div>
                <div className="node-label-text font-mono truncate text-[11px]">{name}</div>
            </div>
            {isGroup && isExpanded && (
                <div className="mat-tree-children border-l border-white/5 ml-[6px]">
                    {keys.length > 0 ? keys.map((key) => (
                        <MatrixNode 
                            key={path + key} 
                            name={key} 
                            node={node.get(key)} 
                            path={path === '/' ? `/${key}` : `${path}/${key}`} 
                            onSelect={onSelect} 
                            selectedPath={selectedPath} 
                            level={level + 1}
                        />
                    )) : (
                        <div className="text-[9px] opacity-20 p-2 font-mono" style={{ marginLeft: 24 }}>No items</div>
                    )}
                </div>
            )}
        </div>
    );
};

const MatViewerTool = ({ tool }) => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedMat, setLoadedMat] = useState({}); 
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);
    const [selectedVariable, setSelectedVariable] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [viewMode, setViewMode] = useState('time'); // 'time' or 'freq'

    useEffect(() => {
        const fetchFiles = async () => {
            const nextLoaded = { ...loadedMat };
            let lastAdded = null;
            for (const f of files) {
                if (!nextLoaded[f.file.name]) {
                    setIsProcessing(true);
                    try { const data = await parseMat(f.file); nextLoaded[f.file.name] = data; lastAdded = f.file.name; } catch (e) { console.error(e); } finally { setIsProcessing(false); }
                }
            }
            const currentNames = files.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => { if (!currentNames.includes(name)) delete nextLoaded[name]; });
            setLoadedMat(nextLoaded);
            if (lastAdded) { setCurrentFile(lastAdded); setSelectedPath(null); setSelectedVariable(null); }
        };
        fetchFiles();
    }, [files]);

    const activeMatData = currentFile ? loadedMat[currentFile] : null;

    const handleSelectNode = (path, node) => {
        setSelectedPath(path);
        // HDF5 Nodes
        if (node instanceof hdf5.Dataset || (node && node.shape)) {
            setSelectedVariable({
                name: path.split('/').pop(),
                path,
                shape: node.shape || [],
                dtype: node.dtype || 'Node',
                data: node.value || (node.getValue ? node.getValue() : []),
                attributes: node.attrs || node.attributes || {}
            });
            setActiveTab('overview');
            setViewMode('time');
        } else if (node.isV5) {
            // MAT v5 Variables
            setSelectedVariable({
                name: node.name,
                path: node.name,
                shape: node.shape,
                dtype: node.type,
                data: node.data || [],
                attributes: {}
            });
            setActiveTab('overview');
            setViewMode('time');
        } else if (node instanceof hdf5.Group || (node && node.keys)) {
            // Allow selecting groups to see attributes
            setSelectedVariable({
                name: path.split('/').pop() || 'Group',
                path,
                shape: null,
                dtype: 'Group',
                data: [],
                attributes: node.attrs || node.attributes || {}
            });
            setActiveTab('metadata');
        } else { 
            setSelectedVariable(null); 
        }
    };

    const spectralData = useMemo(() => {
        if (viewMode !== 'freq' || !selectedVariable || !selectedVariable.data || selectedVariable.data.length === 0) return null;
        // Limit FFT to 512 points for performance in this simple implementation
        const slice = Array.from(selectedVariable.data).slice(0, 512).map(v => typeof v === 'number' ? v : 0);
        const mags = fftMagnitude(slice);
        return {
            labels: mags.map((_, i) => i),
            datasets: [{
                label: 'Frequency Spectrum (Magnitude)',
                data: mags,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                tension: 0.1,
                pointRadius: 0
            }]
        };
    }, [viewMode, selectedVariable]);

    const chartData = useMemo(() => {
        if (!selectedVariable || !selectedVariable.data || selectedVariable.data.length === 0 || (selectedVariable.shape && selectedVariable.shape.length > 1 && (selectedVariable.shape[0] > 1 && selectedVariable.shape[1] > 1))) return null;
        const data = Array.from(selectedVariable.data).slice(0, 1000);
        return {
            labels: data.map((_, i) => i + 1),
            datasets: [{
                label: 'Temporal Amplitude',
                data: data.map(v => typeof v === 'number' ? v : 0),
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
                fill: true,
                tension: 0.1,
                pointRadius: 0
            }]
        };
    }, [selectedVariable]);

    const stats = useMemo(() => {
        if (!selectedVariable || !selectedVariable.data || selectedVariable.data.length === 0 || typeof selectedVariable.data[0] !== 'number') return null;
        const data = selectedVariable.data;
        const n = data.length;
        let sum = 0, min = data[0], max = data[0];
        for (let i = 0; i < n; i++) {
            const v = data[i]; sum += v;
            if (v < min) min = v; if (v > max) max = v;
        }
        return { mean: sum / n, min, max, count: n };
    }, [selectedVariable]);

    const exportVariable = (format) => {
        if (!selectedVariable || !selectedVariable.data) return;
        const data = Array.from(selectedVariable.data);
        let content = '';
        let fileName = `${selectedVariable.name}.${format}`;
        if (format === 'csv') content = data.join('\n');
        else if (format === 'json') content = JSON.stringify({ name: selectedVariable.name, data }, null, 2);
        else if (format === 'python') {
            content = `import h5py\nf = h5py.File('${currentFile}', 'r')\ndata = f['${selectedVariable.path.substring(1)}'][:]`;
            fileName = `load_${selectedVariable.name}.py`;
        }
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
    };

    return (
        <ToolWorkspace
            tool={tool}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".mat"
            multiple={true}
            layout="research"
            onReset={() => {
                files.forEach(f => removeFile(f.id));
                setLoadedMat({});
                setCurrentFile(null);
                setSelectedPath(null);
                setSelectedVariable(null);
            }}
            sidebarTitle="MAT EXPLORER"
            sidebar={
                <div className="mat-sidebar-explorer">
                    <div className="mat-section">
                        <div className="mat-section-title"><Workflow size={14}/> MAT WORKSPACES</div>
                        <div className="workspace-card-grid">
                            {files.map(f => (
                                <div key={f.file.name} className={`workspace-card ${currentFile === f.file.name ? 'active' : ''}`} onClick={() => { setCurrentFile(f.file.name); setSelectedPath(null); setSelectedVariable(null); }}>
                                    <div className="workspace-card-info"><FileIcon size={14} className={currentFile === f.file.name ? 'text-orange-500' : 'text-slate-400'} /><span className="text-xs font-bold font-mono truncate">{f.file.name}</span></div>
                                    <button className="btn-remove-file" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}><Trash2 size={12}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    {isProcessing && <div className="mat-loading-badge"><Loader2 size={14} className="spinning text-orange-500"/><span className="text-[10px] uppercase font-bold text-orange-500">Unpacking...</span></div>}
                    
                    {activeMatData && activeMatData.isHdf5 && (
                        <div className="mat-section flex-grow overflow-hidden flex flex-col">
                            <div className="mat-section-title"><Database size={14}/> DATA TREE (v7.3)</div>
                            <div className="mat-tree-container flex-grow overflow-auto scroll-premium">
                                <MatrixNode name="root" node={activeMatData.h5file.root} path="/" onSelect={handleSelectNode} selectedPath={selectedPath} />
                            </div>
                        </div>
                    )}

                    {activeMatData && activeMatData.isV5 && (
                        <div className="mat-section flex-grow overflow-hidden flex flex-col">
                            <div className="mat-section-title"><Database size={14}/> WORKSPACE (v5)</div>
                            <div className="mat-tree-container flex-grow overflow-auto scroll-premium">
                                {activeMatData.variables.map(v => (
                                    <div 
                                        key={v.name} 
                                        className={`mat-tree-item ${selectedPath === v.name ? 'selected' : ''}`}
                                        onClick={() => handleSelectNode(v.name, v)}
                                    >
                                        <div className="node-type-icon"><Network size={14} color="#3b82f6" /></div>
                                        <div className="node-label-text font-mono truncate">{v.name}</div>
                                    </div>
                                ))}
                                {activeMatData.variables.length === 0 && (
                                    <div className="text-[10px] opacity-40 font-mono p-4 text-center">No variables found in v5 file.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {selectedVariable && (
                        <div className="mat-export-tools">
                             <div className="mat-section-title mb-3"><Download size={12}/> EXPORT SYSTEM</div>
                             <div className="export-grid">
                                 <button onClick={() => exportVariable('csv')} className="btn-export" title="Export to CSV"><CSVIcon size={18}/></button>
                                 <button onClick={() => exportVariable('json')} className="btn-export" title="Export to JSON"><FileJson size={18}/></button>
                                 <button onClick={() => exportVariable('python')} className="btn-export" title="Get Python Loader"><Code2 size={18}/></button>
                             </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="mat-viewer-container p-2">
                {!currentFile ? (
                    <div className="empty-state text-center p-12"><Boxes size={64} className="opacity-10 mx-auto mb-6 text-orange-500"/><h2 className="mb-2 font-mono">MATLAB <span className="text-orange-500">Forge vNext</span></h2><p className="text-muted text-sm max-w-sm mx-auto">Inspect workspaces, visualize matrices, and analyze signals with next-gen HDF5 parsing.</p></div>
                ) : !selectedVariable ? (
                    <div className="empty-state text-center p-12"><Activity size={48} className="opacity-10 mx-auto mb-4 text-orange-500"/><p className="font-mono text-sm opacity-60">Dataset <b>{currentFile}</b> mounted. Select a node.</p></div>
                ) : (
                    <div className="dataset-panel fade-in">
                        <div className="dataset-header">
                            <div className="flex items-center justify-between gap-4">
                                <div className="breadcrumb-nav">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-orange-500/10 rounded-lg"><Boxes size={18} className="text-orange-500"/></div>
                                        <div className="flex flex-col">
                                            <span className="card-label opacity-50">Artifact Discovery</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono text-slate-300 truncate max-w-[120px]">{currentFile}</span>
                                                <ChevronRight size={14} className="opacity-20"/>
                                                <span className="text-sm font-mono font-bold text-orange-400 truncate max-w-[150px]">{selectedVariable.path}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-bold text-orange-500 font-mono">
                                    v{activeMatData?.version || '7.3'}
                                </div>
                            </div>
                            <div className="custom-tabs">
                                <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Eye size={16}/> Visualization</button>
                                <button className={`tab-pill ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}><Sigma size={16}/> Math Stats</button>
                                <button className={`tab-pill ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}><Info size={16}/> Attributes</button>
                            </div>
                        </div>
                        <div className="tab-content flex-grow overflow-auto scroll-premium">
                            {selectedVariable && (
                                <div className="identity-banner p-4 bg-white/3 border border-white/5 rounded-2xl mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-orange-500/20 rounded-lg">
                                            <Info size={16} className="text-orange-400"/>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Heuristic Content Analysis</div>
                                            <div className="text-xs font-mono">
                                                {selectedVariable.shape?.length === 3 || (selectedVariable.shape?.length === 2 && selectedVariable.shape[0] > 100) 
                                                    ? 'Identified as Spatial Image Matrix' 
                                                    : selectedVariable.name.toLowerCase().includes('audio') 
                                                    ? 'Identified as Acoustic Temporal Waveform' 
                                                    : selectedVariable.dtype === 'table' 
                                                    ? 'Identified as Structured Tabular Data' 
                                                    : 'Identified as Mathematical Work-Tensor'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[9px] opacity-30 font-mono text-right max-w-[200px]">
                                        Internal heuristics suggest this variable represents {selectedVariable.shape?.length > 2 ? 'volumetric' : 'planar' } scientific data.
                                    </div>
                                </div>
                            )}

                            {activeTab === 'overview' && (
                                <div className="overview-tab flex flex-col gap-8 py-2">
                                    <div className="overview-grid">
                                        <div className="overview-card">
                                            <div className="card-label">Dimensions</div>
                                            <div className="card-value font-mono">[{selectedVariable.shape?.join(' × ') || '0'}]</div>
                                        </div>
                                        <div className="overview-card">
                                            <div className="card-label">Data Format</div>
                                            <div className="card-value font-mono uppercase text-orange-400/80">{selectedVariable.dtype || 'Numeric'}</div>
                                        </div>
                                        <div className="overview-card">
                                            <div className="card-label">Visualization Mode</div>
                                            <div className="flex gap-2 mt-1">
                                                <button className={`mode-pill ${viewMode === 'time' ? 'active' : ''}`} onClick={() => setViewMode('time')}>Domain</button>
                                                <button className={`mode-pill ${viewMode === 'freq' ? 'active' : ''}`} onClick={() => setViewMode('freq')}>Spectral</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="visualization-container">
                                        <div className="flex flex-col gap-6">
                                            {(selectedVariable.shape?.length === 2 || selectedVariable.shape?.length === 3) && selectedVariable.shape[0] > 1 && selectedVariable.shape[1] > 1 ? (
                                                <HeatmapRenderer data={selectedVariable.data} shape={selectedVariable.shape} />
                                            ) : (viewMode === 'freq' ? spectralData : chartData) ? (
                                                <div className="mat-chart-container shadow-2xl">
                                                    <div className="h-[400px]">
                                                        <Line 
                                                            data={viewMode === 'freq' ? spectralData : chartData} 
                                                            options={{ 
                                                                responsive: true, 
                                                                maintainAspectRatio: false, 
                                                                plugins: { legend: { display: false } }, 
                                                                scales: { 
                                                                    x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'monospace', size: 10 } } }, 
                                                                    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'monospace', size: 10 } } } 
                                                                } 
                                                            }} 
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-20 bg-slate-900/50 border border-white/5 rounded-3xl text-center opacity-40 font-mono italic">
                                                    Complex matrix structure detected. No direct 1D/2D visualization available.
                                                </div>
                                            )}
                                        </div>

                                        <div className="data-preview">
                                             <div className="card-label mb-4 px-2 flex items-center gap-2"><Activity size={12} className="text-orange-500"/> Raw Vector Stream</div>
                                             <div className="table-container shadow-2xl">
                                                <table className="w-full text-[11px] font-mono">
                                                    <thead>
                                                        <tr className="border-b border-white/5 bg-slate-800/50">
                                                            <th className="p-3 text-left w-16 text-slate-500">Index</th>
                                                            <th className="p-3 text-left text-orange-500">Value Magnitude</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/[0.02]">
                                                        {Array.from(selectedVariable.data).slice(0, 50).map((v, i) => (
                                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                                <td className="p-3 text-slate-500">{i.toString().padStart(4, '0')}</td>
                                                                <td className="p-3 text-slate-200 font-bold">{typeof v === 'number' ? v.toFixed(8) : String(v)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'analysis' && (
                                <div className="analysis-tab p-1 fade-in">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-8 flex items-center gap-3">
                                        <Calculator size={16}/> Statistical Synthesis Engine
                                    </h3>
                                    {stats ? (
                                        <div className="stats-grid">
                                            <div className="stat-box">
                                                <div className="card-label">Arithmetic Mean</div>
                                                <div className="text-3xl font-mono text-orange-400">{stats.mean.toFixed(8)}</div>
                                            </div>
                                            <div className="stat-box">
                                                <div className="card-label">Minimum Extrema</div>
                                                <div className="text-3xl font-mono text-slate-400">{stats.min.toFixed(4)}</div>
                                            </div>
                                            <div className="stat-box">
                                                <div className="card-label">Maximum Extrema</div>
                                                <div className="text-3xl font-mono text-slate-400">{stats.max.toFixed(4)}</div>
                                            </div>
                                            <div className="stat-box border-orange-500/20">
                                                <div className="card-label">Sample Population</div>
                                                <div className="text-3xl font-mono text-orange-500/80">{stats.count.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-20 text-center opacity-40 font-mono">
                                            <Sigma size={64} className="mx-auto mb-6 opacity-10 text-orange-500"/>
                                            <p>Select a numeric dataset node to perform statistical analysis.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'metadata' && (
                                <div className="metadata-tab p-1 fade-in">
                                    <div className="attributes-table bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5 text-slate-500 uppercase text-[10px] tracking-widest">
                                                <tr>
                                                    <th className="p-4 text-left">Property Descriptor</th>
                                                    <th className="p-4 text-left">Internal Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {selectedVariable?.attributes && Object.entries(selectedVariable.attributes).map(([k, v]) => (
                                                    <tr key={k} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-4 font-bold text-orange-500/80 font-mono text-xs">{k}</td>
                                                        <td className="p-4 font-mono text-xs text-slate-300">{String(v)}</td>
                                                    </tr>
                                                ))}
                                                {(!selectedVariable?.attributes || Object.keys(selectedVariable.attributes).length === 0) && (
                                                    <tr>
                                                        <td colSpan="2" className="p-12 text-center text-slate-500 font-mono text-xs opacity-50">
                                                            No complex attributes or metadata detected in this node.
                                                        </td>
                                                    </tr>
                                                )}
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
