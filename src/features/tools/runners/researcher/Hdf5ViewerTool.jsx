import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseHdf5 } from '../../../../services/researcher/hdf5Service';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Database, Folder, ChevronDown, ChevronRight, Layers, Table as TableIcon, Activity, Grid3X3 } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
import './Hdf5ViewerTool.css';

// Recursive Tree Node for HDF5 Structure
const Hdf5Node = ({ name, hdfFile, path, onSelectNode, activePath }) => {
    const [expanded, setExpanded] = useState(false);
    
    let isGroup = false;
    let internalNode = null;
    let childKeys = [];

    try {
        internalNode = hdfFile.get(path);
        if (internalNode && internalNode.keys && typeof internalNode.keys !== 'undefined') {
            isGroup = true;
            childKeys = internalNode.keys;
        }
    } catch(e) {
        return null; // Silent catch for broken paths
    }
    
    // Automatically open root groups to make it easier for users
    useEffect(() => {
        if (path.split('/').length <= 2) {
            setExpanded(true);
        }
    }, [path]);

    const handleSelect = (e) => {
        e.stopPropagation();
        onSelectNode(path, internalNode, isGroup);
    };

    const isActive = activePath === path;

    return (
        <div className="hdf5-tree-node">
            <div 
                className={`node-label ${isGroup ? 'is-group' : 'is-dataset'} ${isActive ? 'active-node' : ''}`} 
                onClick={isGroup ? () => setExpanded(!expanded) : handleSelect}
            >
                <span className="node-icon" onClick={(e) => { e.stopPropagation(); if (isGroup) setExpanded(!expanded); }}>
                    {isGroup ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{width: 14, display: 'inline-block'}}/>}
                </span>
                <span className="type-icon" onClick={handleSelect} style={{ marginTop: '2px', display: 'flex' }}>
                    {isGroup ? <Folder size={14} color="#3b82f6" /> : <Database size={14} color="#10b981" />}
                </span>
                <span className="node-name" onClick={handleSelect}>{name}</span>
            </div>
            
            {isGroup && expanded && childKeys.length > 0 && (
                <div className="node-children">
                    {childKeys.map(childKey => {
                        const childPath = path === '/' ? `/${childKey}` : `${path}/${childKey}`;
                        return (
                            <Hdf5Node 
                                key={childPath} 
                                name={childKey} 
                                hdfFile={hdfFile} 
                                path={childPath} 
                                onSelectNode={onSelectNode}
                                activePath={activePath}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};


const Hdf5ViewerTool = () => {
    const { files, addFiles } = useFileList();
    const [hdf5File, setHdf5File] = useState(null);
    const [error, setError] = useState('');
    
    // Selected Node State
    const [selectedPath, setSelectedPath] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedIsGroup, setSelectedIsGroup] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'attributes', 'data'
    const [displayType, setDisplayType] = useState('matrix'); // 'matrix', 'line', 'heatmap'
    const [cellWidth, setCellWidth] = useState(120);
    const [slices, setSlices] = useState({}); // { dimIndex: value }

    useEffect(() => {
        if (files.length > 0) {
            loadFile(files[0].file);
        } else {
            setHdf5File(null);
            clearSelection();
            setError('');
        }
    }, [files]);

    const clearSelection = () => {
        setSelectedPath(null);
        setSelectedNode(null);
        setSelectedIsGroup(false);
        setPreviewData(null);
    };

    const loadFile = async (fileObj) => {
        try {
            setError('');
            clearSelection();
            const f = await parseHdf5(fileObj);
            setHdf5File(f);
            
            // Auto select root if data exists
            if (f && f.keys && f.keys.length > 0) {
                // We'll leave it blank initially so they see the tree.
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSelectNode = (path, node, isGroup) => {
        setSelectedPath(path);
        setSelectedNode(node);
        setSelectedIsGroup(isGroup);

        if (!isGroup && node.value) {
            try {
                const data = node.value; 
                // Increased limit to 1 million for mesh data (e.g., 100x100x100)
                const LIMIT = 1000000;
                if (data && data.length > LIMIT) {
                    setPreviewData(Array.from(data.slice(0, LIMIT)));
                } else if (data && data.length <= LIMIT) {
                    setPreviewData(Array.from(data));
                } else {
                    setPreviewData("No readable array format.");
                }
            } catch(e) {
                setPreviewData(`Unable to parse dataset: ${e.message}`);
            }
        } else {
            setPreviewData(null);
        }
        
        // Reset slices for new node
        if (!isGroup && node.shape && node.shape.length > 2) {
            const initialSlices = {};
            for (let i = 2; i < node.shape.length; i++) {
                initialSlices[i] = 0;
            }
            setSlices(initialSlices);
        } else {
            setSlices({});
        }

        // Reset tab to overview on node change if the current tab doesn't apply
        if (isGroup && activeTab === 'data') {
            setActiveTab('overview');
        }
    };

    const handleSliceChange = (dimIdx, val) => {
        setSlices(prev => ({ ...prev, [dimIdx]: val }));
    };
    
    // Helper to extract attributes properly from jsfive maps
    const getAttributes = (node) => {
        if (!node || !node.attrs) return [];
        let attrs = [];
        try {
            for (let k in node.attrs) {
                // Ensure we don't grab internal functions
                if (typeof node.attrs[k] !== 'function') {
                    let val = node.attrs[k];
                    // If it's a typed array format it
                    if (val && val.length !== undefined && typeof val !== 'string') {
                        val = Array.from(val).join(', ');
                    }
                    attrs.push({ key: k, value: String(val) });
                }
            }
        } catch(e) {}
        return attrs;
    };

    const handleExportAttributes = () => {
        if (!selectedNode) return;
        const attrs = getAttributes(selectedNode);
        if (attrs.length === 0) {
            alert("No attributes to export for this node.");
            return;
        }
        
        let content = `HDF5 Attributes: ${selectedPath}\n`;
        content += "=".repeat(content.length) + "\n\n";
        attrs.forEach(a => content += `${a.key}: ${a.value}\n`);
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedPath.replace(/\//g, '_')}_attrs.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ToolWorkspace
            tool={{ name: 'HDF5 Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".h5,.hdf5"
            dropzoneLabel="Drop your .h5 / .hdf5 file here"
            dropzoneHint="Supports openPMD, NeXus, and general HDF5 datasets"
            onReset={() => {
                setHdf5File(null);
                clearSelection();
            }}
            sidebar={
                <div className="sidebar-info">
                    {hdf5File && (
                        <div className="hdf5-tree-container">
                            <div className="mb-2 text-xs text-muted" style={{ fontWeight: 600 }}>FILE STRUCTURE</div>
                            {hdf5File.keys.map(rootKey => (
                                <Hdf5Node 
                                    key={`/${rootKey}`} 
                                    name={rootKey} 
                                    hdfFile={hdf5File} 
                                    path={`/${rootKey}`} 
                                    onSelectNode={handleSelectNode}
                                    activePath={selectedPath}
                                />
                            ))}
                        </div>
                    )}
                    
                    {selectedNode && (
                        <div className="export-actions mt-4">
                            <h4>Export</h4>
                            <button className="btn-secondary w-full" onClick={handleExportAttributes} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Download size={16} /> Export Attributes (.txt)
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <div className="hdf5-main" style={{ minHeight: '500px' }}>
                {!hdf5File ? (
                    <div className="empty-state">
                        <div className="text-center">
                            <Database size={64} className="text-secondary mb-3 mx-auto" style={{ opacity: 0.5 }} />
                            <p>Upload an .h5 dataset (like openPMD) to explore its attributes and dimensions locally.</p>
                        </div>
                    </div>
                ) : !selectedNode ? (
                    <div className="empty-state">
                        <p>Select a Group or Dataset from the sidebar to inspect its metadata.</p>
                    </div>
                ) : (
                    <div className="dataset-panel fade-in">
                        <div className="dataset-header">
                                <div className="d-flex flex-column gap-3 w-full">
                                    <div className="d-flex align-items-center justify-content-between w-full">
                                        <div className="breadcrumb-nav d-flex align-items-center gap-2">
                                            {selectedPath.split('/').filter(Boolean).map((part, i, arr) => (
                                                <React.Fragment key={i}>
                                                    <span className="breadcrumb-part">{part}</span>
                                                    {i < arr.length - 1 && <span className="opacity-30">/</span>}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <span style={{ 
                                            background: selectedIsGroup ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', 
                                            color: selectedIsGroup ? 'var(--primary-400)' : 'var(--success-400)',
                                            border: `1px solid ${selectedIsGroup ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {selectedIsGroup ? 'HDF5 Group' : 'HDF5 Dataset'}
                                        </span>
                                    </div>
                                    <h2 className="m-0 font-mono text-primary fs-large" style={{ display: 'none' }}>{selectedPath}</h2>
                                </div>
                        </div>

                        <div className="custom-tabs d-flex gap-1 mb-6 p-1 bg-black/20 rounded-lg w-fit">
                            <button 
                                className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                Overview
                            </button>
                            <button 
                                className={`tab-pill ${activeTab === 'attributes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('attributes')}
                            >
                                Attributes ({Object.keys(getAttributes(selectedNode)).length})
                            </button>
                            {!selectedIsGroup && (
                                <button 
                                    className={`tab-pill ${activeTab === 'data' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('data')}
                                >
                                    Data Preview
                                </button>
                            )}
                        </div>

                        <div className="tab-content mt-6">
                            {activeTab === 'overview' && (
                                <div className="fade-in">
                                    <div className="metadata-grid">
                                        {!selectedIsGroup && selectedNode && (
                                            <>
                                                <div className="metadata-item">
                                                    <span className="meta-label">Shape / Dimensions</span>
                                                    <span className="meta-value">
                                                        {selectedNode.shape ? `[${selectedNode.shape.join(', ')}]` : 'Scalar'}
                                                    </span>
                                                </div>
                                                <div className="metadata-item">
                                                    <span className="meta-label">Data Type</span>
                                                    <span className="meta-value">{selectedNode.dtype || 'Unknown'}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className="metadata-item">
                                            <span className="meta-label">Attributes Count</span>
                                            <span className="meta-value">{selectedNode.attrs ? Object.keys(selectedNode.attrs).length : 0}</span>
                                        </div>
                                    </div>
                                    
                                    {selectedIsGroup && (
                                        <div className="empty-state mt-8 p-12 text-center" style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                            <Layers size={48} className="opacity-25 mb-4 mx-auto" />
                                            <p className="text-secondary">Explore the nested structure of this group in the file sidebar.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'attributes' && (
                                <div className="fade-in">
                                    {getAttributes(selectedNode).length > 0 ? (
                                        <div className="obj-attrs">
                                            <div className="attrs-list">
                                                {getAttributes(selectedNode).map((attr, i) => (
                                                    <div key={i} className="attr-item">
                                                        <div className="attr-key">{attr.key}</div>
                                                        <div className="attr-val">{attr.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted">No attributes found for this node.</div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'data' && !selectedIsGroup && (
                                <div className="fade-in">
                                    <div className="d-flex justify-content-between align-items-center mb-6">
                                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
                                            Visual Data Inspection
                                        </h3>
                                        <div className="display-toggle d-flex gap-2">
                                            <button 
                                                className={`btn-icon-toggle ${displayType === 'matrix' ? 'active' : ''}`}
                                                onClick={() => setDisplayType('matrix')}
                                                title="Matrix View"
                                            >
                                                <TableIcon size={16} /> <span>Matrix</span>
                                            </button>
                                            <button 
                                                className={`btn-icon-toggle ${displayType === 'line' ? 'active' : ''}`}
                                                onClick={() => setDisplayType('line')}
                                                title="Line View"
                                            >
                                                <Activity size={16} /> <span>Line</span>
                                            </button>
                                            <button 
                                                className={`btn-icon-toggle ${displayType === 'heatmap' ? 'active' : ''}`}
                                                onClick={() => setDisplayType('heatmap')}
                                                title="Heatmap View"
                                            >
                                                <Grid3X3 size={16} /> <span>Heatmap</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Slicing Controls for >2D */}
                                    {selectedNode.shape && selectedNode.shape.length > 2 && (
                                        <div className="view-controls mb-4 p-4 bg-glass border-glass rounded-lg">
                                            <div className="text-xs text-secondary uppercase font-bold mb-3">Slicing Dimensions (D2+)</div>
                                            <div className="d-flex flex-column gap-3">
                                                {selectedNode.shape.slice(2).map((dimSize, idx) => {
                                                    const dimIdx = idx + 2;
                                                    return (
                                                        <div key={dimIdx} className="d-flex align-items-center gap-4">
                                                            <span className="text-xs font-mono w-8">D{dimIdx}</span>
                                                            <input 
                                                                type="range" 
                                                                min="0" 
                                                                max={dimSize - 1} 
                                                                value={slices[dimIdx] || 0} 
                                                                onChange={(e) => handleSliceChange(dimIdx, Number(e.target.value))}
                                                                className="flex-grow h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                            />
                                                            <span className="text-xs font-mono w-12 text-right">{slices[dimIdx] || 0} / {dimSize - 1}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Matrix Controls */}
                                    {displayType === 'matrix' && (
                                        <div className="view-controls mb-4 p-3 d-flex align-items-center gap-4 bg-glass border-glass rounded-lg">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="text-secondary text-xs uppercase font-bold">Cell Width</span>
                                                <input 
                                                    type="range" 
                                                    min="60" 
                                                    max="250" 
                                                    value={cellWidth} 
                                                    onChange={(e) => setCellWidth(Number(e.target.value))}
                                                    className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <span className="text-xs font-mono">{cellWidth}px</span>
                                            </div>
                                        </div>
                                    )}

                                    {displayType === 'matrix' ? (
                                        <div className="matrix-view-container fade-in">
                                            <div className="data-table-container scroll-premium" style={{ maxHeight: '500px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.8rem' }}>
                                                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                                        <tr style={{ background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(10px)' }}>
                                                            <th style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', textAlign: 'center', width: '60px' }}>n</th>
                                                            {selectedNode.shape && selectedNode.shape.length > 1 ? (
                                                                // If 2D, columns are second dimension
                                                                Array.from({ length: Math.min(selectedNode.shape[1] || 1, 50) }).map((_, i) => (
                                                                    <th key={i} style={{ padding: '10px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', textAlign: 'center', minWidth: `${cellWidth}px` }}>
                                                                        D1: {i}
                                                                    </th>
                                                                ))
                                                            ) : (
                                                                <th style={{ padding: '10px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', textAlign: 'left', minWidth: `${cellWidth}px` }}>Value</th>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Array.isArray(previewData) ? (
                                                            selectedNode.shape && selectedNode.shape.length > 1 ? (
                                                                // 2D Matrix Rendering
                                                                Array.from({ length: Math.min(selectedNode.shape[0], 100) }).map((_, rowIdx) => (
                                                                    <tr key={rowIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                                        <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', color: 'var(--primary-400)', fontWeight: 600 }}>D0: {rowIdx}</td>
                                                                        {Array.from({ length: Math.min(selectedNode.shape[1], 50) }).map((_, colIdx) => {
                                                                            // Calculate offset for >2D
                                                                            let offset = 0;
                                                                            if (selectedNode.shape.length > 2) {
                                                                                let multiplier = 1;
                                                                                // For index calculation: d0*D1*D2... + d1*D2*... + d2*...
                                                                                // But jsfive might be row-major.
                                                                                // Standard C-order: index = (d0 * shape[1] + d1) * shape[2] + d2...
                                                                                // Actually, let's just do a simple 3D slice for now: index = (d0 * shape[1] + d1) * (product of later dims) + (offset from slices)
                                                                                let laterDimsProduct = 1;
                                                                                for (let i = 2; i < selectedNode.shape.length; i++) laterDimsProduct *= selectedNode.shape[i];
                                                                                
                                                                                let sliceOffset = 0;
                                                                                let subMultiplier = 1;
                                                                                for (let i = selectedNode.shape.length - 1; i >= 2; i--) {
                                                                                    sliceOffset += (slices[i] || 0) * subMultiplier;
                                                                                    subMultiplier *= selectedNode.shape[i];
                                                                                }
                                                                                
                                                                                offset = (rowIdx * selectedNode.shape[1] + colIdx) * laterDimsProduct + sliceOffset;
                                                                            } else {
                                                                                offset = rowIdx * selectedNode.shape[1] + colIdx;
                                                                            }
                                                                            
                                                                            const val = previewData[offset] ?? 'N/A';
                                                                            return (
                                                                                <td key={colIdx} style={{ padding: '8px 15px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', color: typeof val === 'number' ? 'var(--text-primary)' : 'var(--text-primary)', width: `${cellWidth}px` }}>
                                                                                    {typeof val === 'number' ? (val.toExponential ? val.toExponential(3) : val) : String(val)}
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                // 1D List Rendering
                                                                previewData.map((val, i) => (
                                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                                        <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', color: 'var(--primary-400)' }}>D0: {i}</td>
                                                                        <td style={{ padding: '8px 15px', color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', width: `${cellWidth}px` }}>
                                                                            {typeof val === 'number' ? (val.toExponential ? val.toExponential(4) : val) : String(val)}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="2" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{String(previewData)}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="mt-4 text-xs text-muted">
                                                Showing {selectedNode.shape && selectedNode.shape.length > 1 ? `top 100x50 grid` : `first ${previewData?.length || 0} values`}.
                                            </div>
                                        </div>
                                    ) : displayType === 'line' ? (
                                        <div className="line-view-container fade-in" style={{ height: '400px', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <Line 
                                                data={{
                                                    labels: Array.from({ length: Math.min(selectedNode.shape[0], 1000) }).map((_, i) => i),
                                                    datasets: [{
                                                        label: 'Dataset Values (Current Slice)',
                                                        data: (() => {
                                                            if (!previewData) return [];
                                                            // If 3D+, get the first row of the current slice
                                                            let offset = 0;
                                                            if (selectedNode.shape.length > 2) {
                                                                let laterDimsProduct = 1;
                                                                for (let i = 2; i < selectedNode.shape.length; i++) laterDimsProduct *= selectedNode.shape[i];
                                                                
                                                                let sliceOffset = 0;
                                                                let subMultiplier = 1;
                                                                for (let i = selectedNode.shape.length - 1; i >= 2; i--) {
                                                                    sliceOffset += (slices[i] || 0) * subMultiplier;
                                                                    subMultiplier *= selectedNode.shape[i];
                                                                }
                                                                offset = sliceOffset; 
                                                            }
                                                            return previewData.slice(offset, offset + 1000);
                                                        })(),
                                                        borderColor: '#60a5fa',
                                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                        borderWidth: 2,
                                                        pointRadius: 0,
                                                        tension: 0.1,
                                                        fill: true
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: { legend: { display: false } },
                                                    scales: {
                                                        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.3)' } },
                                                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.3)' } }
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        // Heatmap Rendering
                                        <div className="heatmap-view-container fade-in" style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            {selectedNode.shape && selectedNode.shape.length > 1 ? (
                                                <div 
                                                    className="heatmap-grid" 
                                                    style={{ 
                                                        display: 'grid', 
                                                        gridTemplateColumns: `repeat(${Math.min(selectedNode.shape[1], 50)}, 1fr)`,
                                                        gap: '1px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        padding: '4px',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    {Array.from({ length: Math.min(selectedNode.shape[0], 50) }).map((_, rowIdx) => (
                                                        Array.from({ length: Math.min(selectedNode.shape[1], 50) }).map((_, colIdx) => {
                                                            const val = previewData[rowIdx * selectedNode.shape[1] + colIdx];
                                                            // Simple normalization for color
                                                            const max = Math.max(...(previewData?.slice(0, 2500) || [1]));
                                                            const min = Math.min(...(previewData?.slice(0, 2500) || [0]));
                                                            const normalized = max === min ? 0.5 : (val - min) / (max - min);
                                                            // Map to Viridis-like colors (blue to yellow)
                                                            const hue = 240 - (normalized * 180); // 240 (blue) to 60 (yellow)
                                                            return (
                                                                <div 
                                                                    key={`${rowIdx}-${colIdx}`} 
                                                                    title={`Value: ${val}\nCoord: [${rowIdx}, ${colIdx}]`}
                                                                    style={{ 
                                                                        aspectRatio: '1/1', 
                                                                        background: `hsl(${hue}, 80%, 50%)`,
                                                                        borderRadius: '1px'
                                                                    }}
                                                                />
                                                            );
                                                        })
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center text-muted">Heatmap requires a 2D dataset.</div>
                                            )}
                                            <div className="mt-4 d-flex justify-content-between text-xs text-muted">
                                                <span>Min: {Math.min(...(previewData?.slice(0, 2500) || [0])).toExponential(2)}</span>
                                                <span>Color Map: Spectrum</span>
                                                <span>Max: {Math.max(...(previewData?.slice(0, 2500) || [0])).toExponential(2)}</span>
                                            </div>
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
