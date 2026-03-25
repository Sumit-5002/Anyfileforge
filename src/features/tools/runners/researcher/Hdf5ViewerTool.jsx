import React, { useState, useEffect, useMemo } from 'react';
import {
    Download, FileText, ChevronRight, Database,
    Activity, Info, Trash2, Layers, Loader2, Maximize2,
    FileJson, FileSpreadsheet as CSVIcon, Search, Boxes, Network,
    Calculator
} from 'lucide-react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ToolWorkspace from '../common/ToolWorkspace';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import './Hdf5ViewerTool.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Detect if this node is a navigable Group (has children) */
const isGroup = (node) =>
    node != null &&
    !('value' in node) &&          // datasets have .value; groups don't
    (typeof node.keys === 'function' || Array.isArray(node.keys) || !!node._links);

/** Detect if this node is a Dataset (has a value / dtype) */
const isDataset = (node) =>
    node != null &&
    ('value' in node || node.dtype != null);

/** Extract child key names from a group node */
const getKeys = (node) => {
    try {
        const raw = typeof node.keys === 'function' ? node.keys() : node.keys;
        if (Array.isArray(raw)) return [...new Set(raw)].sort();
        if (raw && typeof raw === 'object') return Object.keys(raw).sort();
        if (node._links) return Object.keys(node._links).sort();
    } catch (_) { /* ignore */ }
    return [];
};

/** Retrieve a child by name from a group node */
const getChild = (node, key) => {
    try {
        if (typeof node.get === 'function') return node.get(key);
        if (node[key] !== undefined)        return node[key];
        if (node._links?.[key])             return node._links[key];
    } catch (_) { /* ignore */ }
    return null;
};

// ─── DatasetNode ──────────────────────────────────────────────────────────────

const DatasetNode = ({ name, node, path, onSelect, selectedPaths, level = 0 }) => {
    const isGrp = isGroup(node);
    const isDst = isDataset(node);
    const keys = isGrp ? getKeys(node) : [];

    const [expanded, setExpanded] = useState(level < 1);
    const selected = selectedPaths.includes(path);

    return (
        <div>
            {/* Row */}
            <div
                onClick={() => {
                    if (isGrp) setExpanded(v => !v);
                    if (isDst) onSelect(path, node, name);
                }}
                style={{
                    paddingLeft: `${level * 16 + 12}px`,
                    paddingTop: 7,
                    paddingBottom: 7,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    borderRadius: 8,
                    transition: 'background 0.15s',
                    background: selected ? 'rgba(139,92,246,0.15)' : 'transparent',
                    border: selected ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
            >
                {/* Chevron */}
                <div style={{ width: 14, opacity: isGrp ? 1 : 0, transition: 'transform 0.2s', transform: expanded && isGrp ? 'rotate(90deg)' : 'none' }}>
                    <ChevronRight size={13} />
                </div>

                {/* Icon */}
                {isGrp
                    ? <Boxes  size={13} color="#a78bfa" style={{ flexShrink: 0 }} />
                    : <Network size={13} color="#60a5fa" style={{ flexShrink: 0 }} />
                }

                {/* Label */}
                <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>
                    {name}
                </span>
            </div>

            {/* Children */}
            {isGrp && expanded && keys.length > 0 && (
                <div>
                    {keys.map(key => {
                        const child = getChild(node, key);
                        if (!child) return null;
                        const childPath = path === '/' ? `/${key}` : `${path}/${key}`;
                        return (
                            <DatasetNode
                                key={childPath}
                                name={key}
                                node={child}
                                path={childPath}
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

// ─── Main Tool ────────────────────────────────────────────────────────────────

const Hdf5ViewerTool = ({ tool }) => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedFiles, setLoadedFiles] = useState({});
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedPaths, setSelectedPaths] = useState([]);
    const [selectedDatasets, setSelectedDatasets] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parseError, setParseError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const load = async () => {
            const next = { ...loadedFiles };
            let lastAdded = null;
            setParseError(null);

            for (const f of files) {
                if (next[f.file.name]) continue;
                setIsProcessing(true);
                try {
                    const buffer = await f.file.arrayBuffer();
                    // jsfive exposes the File class as a named export
                    const { File: H5File } = await import('jsfive');
                    const h5 = new H5File(buffer, f.file.name);
                    next[f.file.name] = h5;
                    lastAdded = f.file.name;
                } catch (err) {
                    console.error('[HDF5] parse error:', err);
                    setParseError(`${f.file.name}: ${err.message}`);
                } finally {
                    setIsProcessing(false);
                }
            }

            // Prune removed files
            const names = files.map(f => f.file.name);
            Object.keys(next).forEach(n => { if (!names.includes(n)) delete next[n]; });

            setLoadedFiles(next);
            if (lastAdded) {
                setCurrentFile(lastAdded);
                setSelectedPaths([]);
                setSelectedDatasets([]);
            }
        };
        load();
    }, [files]); // eslint-disable-line react-hooks/exhaustive-deps

    const activeH5 = currentFile ? loadedFiles[currentFile] : null;

    const handleSelectNode = (path, node, name) => {
        if (!node) return;

        const rawValue = node.value;
        let data = [];

        if (rawValue == null) {
            data = [];
        } else if (Array.isArray(rawValue)) {
            data = rawValue;
        } else if (rawValue?.buffer) {          // TypedArray
            data = Array.from(rawValue);
        } else {
            data = [rawValue];
        }

        const ds = {
            name: name || path.split('/').pop(),
            path,
            shape: node.shape || [],
            dtype: node.dtype || 'unknown',
            data,
            attributes: node.attrs || {},
        };

        const isMulti = window.event && (window.event.ctrlKey || window.event.metaKey || window.event.shiftKey);
        if (isMulti) {
            setSelectedPaths(p => p.includes(path) ? p.filter(x => x !== path) : [...p, path]);
            setSelectedDatasets(p => p.some(d => d.path === path) ? p.filter(d => d.path !== path) : [...p, ds]);
        } else {
            setSelectedPaths([path]);
            setSelectedDatasets([ds]);
        }
        setActiveTab('overview');
    };

    const previewData = useMemo(() =>
        selectedDatasets.length > 0 ? selectedDatasets[0].data.slice(0, 1000) : [],
    [selectedDatasets]);

    const chartData = useMemo(() => {
        if (!selectedDatasets.length) return null;
        const colors = ['#8b5cf6', '#3b82f6', '#f97316', '#10b981', '#ef4444'];
        const maxPts = Math.max(...selectedDatasets.map(d => Math.min(d.data.length, 1000)));
        return {
            labels: Array.from({ length: maxPts }, (_, i) => i + 1),
            datasets: selectedDatasets.map((ds, i) => ({
                label: ds.name,
                data: ds.data.slice(0, 1000).map(v => typeof v === 'number' ? v : 0),
                borderColor: colors[i % colors.length],
                backgroundColor: `${colors[i % colors.length]}22`,
                fill: selectedDatasets.length === 1,
                tension: 0.1,
                pointRadius: 0,
            })),
        };
    }, [selectedDatasets]);

    const stats = useMemo(() => {
        if (!selectedDatasets.length) return null;
        const data = selectedDatasets[0].data.filter(v => typeof v === 'number');
        if (!data.length) return null;
        let sum = 0, min = data[0], max = data[0];
        data.forEach(v => { sum += v; if (v < min) min = v; if (v > max) max = v; });
        return { mean: sum / data.length, min, max, count: data.length };
    }, [selectedDatasets]);

    const triggerDownload = (blob, name) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = name; a.click();
        URL.revokeObjectURL(url);
    };

    const handleExport = (fmt) => {
        if (!selectedDatasets.length) return;
        const ds = selectedDatasets[0];
        if (fmt === 'csv') {
            triggerDownload(new Blob([ds.data.join('\n')], { type: 'text/csv' }), `${ds.name}.csv`);
        } else {
            triggerDownload(new Blob([JSON.stringify(ds, null, 2)], { type: 'application/json' }), `${ds.name}.json`);
        }
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
                    {/* File List */}
                    <div className="explorer-section">
                        <div className="section-header"><Layers size={13}/> LOADED ARCHIVES</div>
                        <div className="file-tabs-list">
                            {files.map(f => (
                                <div
                                    key={f.file.name}
                                    className={`file-item-tab ${currentFile === f.file.name ? 'active' : ''}`}
                                    onClick={() => { setCurrentFile(f.file.name); setSelectedPaths([]); setSelectedDatasets([]); }}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Database size={13} className={currentFile === f.file.name ? 'text-primary-400' : 'text-slate-500'} />
                                        <span className="file-name font-mono text-[11px] font-bold">{f.file.name}</span>
                                    </div>
                                    <button className="btn-remove-ocean" style={{ opacity: 0.6 }} onClick={e => { e.stopPropagation(); removeFile(f.id); }}>
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* States */}
                    {isProcessing && (
                        <div className="ocean-loading-badge" style={{ borderColor: 'rgba(139,92,246,.4)', color: '#a78bfa' }}>
                            <Loader2 size={14} className="spinning"/>
                            <span className="text-[10px] uppercase font-bold">Parsing Binary...</span>
                        </div>
                    )}
                    {parseError && (
                        <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '8px 12px', fontSize: 10, color: '#f87171', fontWeight: 700 }}>
                            ⚠ {parseError}
                        </div>
                    )}

                    {/* Tree Browser */}
                    {activeH5 && (
                        <div className="explorer-section flex-grow overflow-hidden flex flex-col">
                            <div className="section-header flex justify-between">
                                <span><Search size={13}/> BROWSER</span>
                                <span style={{ fontSize: 9, opacity: .4 }}>Ctrl+Click = Multi-select</span>
                            </div>
                            <div className="tree-explorer flex-grow overflow-auto scroll-premium pr-1">
                                <DatasetNode
                                    name="/"
                                    node={activeH5.root ?? activeH5}
                                    path="/"
                                    onSelect={handleSelectNode}
                                    selectedPaths={selectedPaths}
                                    level={0}
                                />
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            {/* ─── Main Canvas ─── */}
            <div className="researcher-tool-container h-full p-4 pb-8 overflow-hidden">
                {!currentFile ? (
                    <div className="empty-state text-center p-12">
                        <Database size={64} className="opacity-10 mx-auto mb-6 text-primary-500"/>
                        <h2 className="mb-2 font-mono">HDF5 Scientific <span className="text-secondary-400">Voyager</span></h2>
                        <p className="text-muted text-sm max-w-sm mx-auto">Explore high-dimensional hierarchical data structures with system-level speed and precision.</p>
                    </div>
                ) : selectedDatasets.length === 0 ? (
                    <div className="empty-state text-center p-12">
                        <Maximize2 size={48} className="opacity-10 mx-auto mb-4 text-primary-400"/>
                        <p className="font-mono text-sm opacity-60">Archive <b>{currentFile}</b> mounted.<br/>Select a dataset from the explorer.</p>
                    </div>
                ) : (
                    <div className="dataset-panel h-full flex flex-col fade-in overflow-hidden gap-2">
                        {/* Header */}
                        <div className="dataset-header mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="breadcrumb-nav bg-white/5 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 overflow-hidden max-w-[65%]">
                                    <Database size={11} className="text-slate-500 flex-shrink-0"/>
                                    <span className="font-mono text-[10px] text-slate-400 truncate">{currentFile}</span>
                                    <ChevronRight size={10} className="text-slate-600"/>
                                    <span className="font-mono text-[10px] text-primary-400 font-bold truncate">{selectedDatasets[0].path}</span>
                                    {selectedDatasets.length > 1 && <span className="bg-secondary-500/20 text-secondary-400 text-[9px] px-2 py-0.5 rounded-full font-bold">+{selectedDatasets.length - 1}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleExport('csv')} className="btn btn-secondary p-2.5 rounded-xl hover:bg-secondary-500/10 hover:text-secondary-400 transition-all border-white/5" title="Export CSV"><CSVIcon size={15}/></button>
                                    <button onClick={() => handleExport('json')} className="btn btn-secondary p-2.5 rounded-xl hover:bg-secondary-500/10 hover:text-secondary-400 transition-all border-white/5" title="Export JSON"><FileJson size={15}/></button>
                                    <div className="bg-primary/10 text-primary border border-primary/20 font-bold tracking-widest px-3 py-1.5 rounded-full text-[9px] uppercase ml-1">HDF-5</div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="custom-tabs">
                                <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Activity size={13}/> Plot</button>
                                <button className={`tab-pill ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}><Calculator size={13}/> Stats</button>
                                <button className={`tab-pill ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}><Info size={13}/> Meta</button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="tab-content flex-grow overflow-y-auto scroll-premium pr-2 pb-6">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="overview-tab flex flex-col gap-6 p-1">
                                    <div className="overview-grid">
                                        {selectedDatasets.slice(0, 2).map((ds, idx) => (
                                            <div key={idx} className="overview-card">
                                                <div className="card-label">{idx === 0 ? 'Primary' : 'Secondary'} Dataset</div>
                                                <div className="card-value font-mono text-primary-400">{ds.name}</div>
                                                <div className="card-label mt-1">Shape: [{ds.shape.join(',')}] · {ds.dtype}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {chartData && (
                                        <div className="chart-wrapper bg-black/20 p-6 rounded-2xl border border-white/5">
                                            <div className="h-64">
                                                <Line data={chartData} options={{
                                                    responsive: true, maintainAspectRatio: false,
                                                    plugins: { legend: { display: selectedDatasets.length > 1, labels: { color: 'rgba(255,255,255,0.4)', boxWidth: 10 } } },
                                                    scales: {
                                                        x: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: 'rgba(255,255,255,0.3)' } },
                                                        y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: 'rgba(255,255,255,0.3)' } },
                                                    }
                                                }} />
                                            </div>
                                        </div>
                                    )}
                                    {/* Data Table */}
                                    <div className="data-preview mt-2">
                                        <div className="card-label mb-2 ml-1 text-primary-400 font-bold uppercase tracking-widest text-[9px]">Buffer Preview (first 50 rows)</div>
                                        <div className="table-container bg-black/40 rounded-xl overflow-hidden border border-white/5">
                                            <table className="w-full text-[11px] font-mono">
                                                <thead className="bg-white/5 text-muted border-b border-white/10">
                                                    <tr>
                                                        <th className="p-3 text-left">pos</th>
                                                        {selectedDatasets.map(ds => <th key={ds.path} className="p-3 text-left">{ds.name}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {previewData.slice(0, 50).map((_, i) => (
                                                        <tr key={i} className="hover:bg-white/5">
                                                            <td className="p-2 px-3 text-muted">{i}</td>
                                                            {selectedDatasets.map(ds => (
                                                                <td key={ds.path} className="p-2 px-3 text-primary-300">
                                                                    {ds.data[i] !== undefined
                                                                        ? (typeof ds.data[i] === 'number' ? ds.data[i].toFixed(4) : String(ds.data[i]))
                                                                        : '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stats Tab */}
                            {activeTab === 'analysis' && (
                                <div className="analysis-tab p-1 fade-in">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-6 flex items-center gap-2"><Calculator size={14}/> Mathematical Synthesis</h3>
                                    {stats ? (
                                        <div className="stats-grid grid grid-cols-2 gap-4">
                                            {[['Mean', stats.mean.toFixed(6)], ['Max', stats.max.toFixed(4)], ['Min', stats.min.toFixed(4)], ['Count', stats.count.toLocaleString()]].map(([label, value]) => (
                                                <div key={label} className="stat-box bg-black/40 p-5 rounded-2xl border border-white/5">
                                                    <div className="card-label">{label}</div>
                                                    <div className="text-xl font-mono text-primary-300">{value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center opacity-40 font-mono">Select a numeric dataset to compute statistics.</div>
                                    )}
                                </div>
                            )}

                            {/* Metadata Tab */}
                            {activeTab === 'metadata' && (
                                <div className="metadata-tab p-1 fade-in">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-4 flex items-center gap-2"><Info size={14}/> Dataset Attributes</h3>
                                    {Object.keys(selectedDatasets[0].attributes).length === 0 ? (
                                        <div className="p-12 text-center opacity-40 font-mono">No attributes attached.</div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {Object.entries(selectedDatasets[0].attributes).map(([k, v]) => (
                                                <div key={k} className="flex gap-3 bg-black/30 p-3 rounded-lg border border-white/5">
                                                    <span className="font-mono text-[10px] font-bold text-primary-400 w-32 flex-shrink-0">{k}</span>
                                                    <span className="font-mono text-[10px] text-slate-300 break-all">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
