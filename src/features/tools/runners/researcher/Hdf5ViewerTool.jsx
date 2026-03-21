import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseHdf5 } from '../../../../services/researcher/hdf5Service';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Database, Folder, ChevronDown, ChevronRight, Layers, Table as TableIcon, Activity, Grid3X3, File as FileIcon, Trash2 } from 'lucide-react';
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
    } catch(e) { return null; }
    
    useEffect(() => {
        if (path.split('/').length <= 2) setExpanded(true);
    }, [path]);

    const handleSelect = (e) => {
        e.stopPropagation();
        onSelectNode(path, internalNode, isGroup);
    };

    return (
        <div className="hdf5-tree-node">
            <div className={`node-label ${activePath === path ? 'active-node' : ''}`} onClick={isGroup ? () => setExpanded(!expanded) : handleSelect}>
                <span className="node-icon">
                    {isGroup ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{width: 14}}/>}
                </span>
                <span className="type-icon" onClick={handleSelect}>
                    {isGroup ? <Folder size={14} color="#3b82f6" /> : <Database size={14} color="#10b981" />}
                </span>
                <span className="node-name" onClick={handleSelect}>{name}</span>
            </div>
            {isGroup && expanded && childKeys.length > 0 && (
                <div className="node-children">
                    {childKeys.map(key => <Hdf5Node key={path+'/'+key} name={key} hdfFile={hdfFile} path={path === '/' ? `/${key}` : `${path}/${key}`} onSelectNode={onSelectNode} activePath={activePath} />)}
                </div>
            )}
        </div>
    );
};

const Hdf5ViewerTool = () => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedFiles, setLoadedFiles] = useState({}); // { fileName: h5Instance }
    const [currentFile, setCurrentFile] = useState(null); // fileName
    const [selectedPath, setSelectedPath] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedIsGroup, setSelectedIsGroup] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [displayType, setDisplayType] = useState('matrix');
    const [cellWidth, setCellWidth] = useState(120);
    const [slices, setSlices] = useState({});

    useEffect(() => {
        const loadNewFiles = async () => {
            const newLoaded = { ...loadedFiles };
            let lastAdded = null;
            for (const f of files) {
                if (!newLoaded[f.file.name]) {
                    try {
                        const h5 = await parseHdf5(f.file);
                        newLoaded[f.file.name] = h5;
                        lastAdded = f.file.name;
                    } catch (e) { console.error(e); }
                }
            }
            // Cleanup removed files
            const currentNames = files.map(f => f.file.name);
            Object.keys(newLoaded).forEach(name => {
                if (!currentNames.includes(name)) delete newLoaded[name];
            });
            setLoadedFiles(newLoaded);
            if (lastAdded) setCurrentFile(lastAdded);
            else if (!currentNames.includes(currentFile)) setCurrentFile(currentNames[0] || null);
        };
        loadNewFiles();
    }, [files]);

    const handleSelectNode = (path, node, isGroup) => {
        setSelectedPath(path);
        setSelectedNode(node);
        setSelectedIsGroup(isGroup);

        if (!isGroup && node.value) {
            const data = node.value;
            const LIMIT = 1000000;
            setPreviewData(Array.from(data.length > LIMIT ? data.slice(0, LIMIT) : data));
        } else setPreviewData(null);
        
        if (!isGroup && node.shape && node.shape.length > 2) {
            const initialSlices = {};
            for (let i = 2; i < node.shape.length; i++) initialSlices[i] = 0;
            setSlices(initialSlices);
        } else setSlices({});
        if (isGroup && activeTab === 'data') setActiveTab('overview');
    };

    const getAttributes = (node) => {
        if (!node || !node.attrs) return [];
        return Object.keys(node.attrs)
            .filter(k => typeof node.attrs[k] !== 'function')
            .map(k => ({ key: k, value: String(node.attrs[k].length !== undefined ? Array.from(node.attrs[k]).join(', ') : node.attrs[k]) }));
    };

    return (
        <ToolWorkspace
            tool={{ name: 'HDF5 Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".h5,.hdf5"
            multiple={true}
            layout="research"
            onReset={() => { setLoadedFiles({}); setCurrentFile(null); }}
            sidebar={
                <div className="sidebar-info researcher-tool-container h-full d-flex flex-column gap-4">
                    {/* Multi-file switcher */}
                    <div className="opened-files-section">
                        <div className="text-secondary text-xs uppercase mb-3 font-bold letter-spacing-1">Opened Files</div>
                        <div className="d-flex flex-column gap-2">
                            {files.map(f => (
                                <div key={f.file.name} 
                                     className={`file-tab d-flex align-items-center justify-content-between p-2 rounded-lg cursor-pointer transition-all ${currentFile === f.file.name ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/5'}`}
                                     style={{ border: '1px solid currentColor' }}
                                     onClick={() => setCurrentFile(f.file.name)}
                                >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <FileIcon size={14} className={currentFile === f.file.name ? 'text-primary' : 'text-muted'} />
                                        <span className="text-xs truncate font-medium">{f.file.name}</span>
                                    </div>
                                    <button className="p-1 hover:text-danger opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {currentFile && loadedFiles[currentFile] && (
                        <div className="hdf5-tree-container flex-grow overflow-auto p-2" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                            <div className="mb-2 text-xs text-muted font-bold">STRUCTURE: {currentFile}</div>
                            {loadedFiles[currentFile].keys.map(key => (
                                <Hdf5Node key={currentFile+key} name={key} hdfFile={loadedFiles[currentFile]} path={`/${key}`} onSelectNode={handleSelectNode} activePath={selectedPath} />
                            ))}
                        </div>
                    )}
                </div>
            }
        >
            <div className="hdf5-main researcher-tool-container h-full">
                {!currentFile ? (
                    <div className="empty-state text-center p-12">
                        <Database size={64} className="opacity-10 mx-auto mb-4" />
                        <h3>HDF5 Multi-Dataset Explorer</h3>
                        <p className="text-muted">Upload one or more .h5 files to analyze them simultaneously.</p>
                    </div>
                ) : !selectedNode ? (
                    <div className="empty-state text-center p-12">
                         <Folder size={48} className="opacity-10 mx-auto mb-4" />
                         <p>Select a group or dataset from <b>{currentFile}</b> to begin inspection.</p>
                    </div>
                ) : (
                    <div className="dataset-panel fade-in">
                        <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="breadcrumb-nav d-flex align-items-center gap-2">
                                    <span className="breadcrumb-part truncate" style={{maxWidth: '150px'}}>{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    {selectedPath.split('/').filter(Boolean).map((part, i, arr) => (
                                        <React.Fragment key={i}>
                                            <span className="breadcrumb-part">{part}</span>
                                            {i < arr.length - 1 && <span className="opacity-30">/</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <span className="badge-pill bg-primary/10 text-primary border border-primary/20">{selectedIsGroup ? 'Group' : 'Dataset'}</span>
                            </div>
                        </div>

                        <div className="custom-tabs mb-6">
                            <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                            <button className={`tab-pill ${activeTab === 'attributes' ? 'active' : ''}`} onClick={() => setActiveTab('attributes')}>Attributes ({getAttributes(selectedNode).length})</button>
                            {!selectedIsGroup && <button className={`tab-pill ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>Data Preview</button>}
                        </div>

                        <div className="tab-content">
                            {activeTab === 'overview' && (
                                <div className="overview-grid">
                                    <div className="overview-card"><div className="card-label">PATH</div><div className="card-value font-mono truncate">{selectedPath}</div></div>
                                    {!selectedIsGroup && selectedNode.shape && <div className="overview-card"><div className="card-label">SHAPE</div><div className="card-value font-mono">[{selectedNode.shape.join(', ')}]</div></div>}
                                    {!selectedIsGroup && selectedNode.dtype && <div className="overview-card"><div className="card-label">DTYPE</div><div className="card-value font-mono">{selectedNode.dtype}</div></div>}
                                </div>
                            )}
                            {activeTab === 'attributes' && (
                                <div className="attributes-view bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                    <table className="w-full text-left font-mono text-sm">
                                        <thead className="bg-white/5 uppercase text-xs text-muted"><tr><th className="p-3">Key</th><th className="p-3">Value</th></tr></thead>
                                        <tbody className="divide-y divide-white/5">
                                            {getAttributes(selectedNode).map((a, i) => <tr key={i}><td className="p-3 text-primary">{a.key}</td><td className="p-3">{a.value}</td></tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {activeTab === 'data' && !selectedIsGroup && (
                                <div className="data-view">
                                    <div className="d-flex justify-content-between align-items-center mb-6">
                                        <div className="display-toggle d-flex gap-2">
                                            {['matrix', 'line', 'heatmap'].map(t => (
                                                <button key={t} className={`btn-icon-toggle ${displayType === t ? 'active' : ''}`} onClick={() => setDisplayType(t)}>
                                                    {t === 'matrix' ? <TableIcon size={16}/> : t === 'line' ? <Activity size={16}/> : <Grid3X3 size={16}/>}
                                                    <span className="capitalize">{t}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {selectedNode.shape?.length > 2 && (
                                        <div className="view-controls mb-4 p-4 bg-glass border-glass rounded-lg">
                                            {selectedNode.shape.slice(2).map((size, idx) => (
                                                <div key={idx} className="d-flex align-items-center gap-4 mb-2">
                                                    <span className="text-xs font-mono w-8">D{idx+2}</span>
                                                    <input type="range" min="0" max={size-1} value={slices[idx+2]||0} onChange={(e)=>setSlices({...slices,[idx+2]:Number(e.target.value)})} className="flex-grow"/>
                                                    <span className="text-xs font-mono w-12 text-right">{slices[idx+2]||0}/{size-1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {displayType === 'matrix' ? (
                                        <div className="data-table-container scroll-premium" style={{ maxHeight: '500px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                            <table className="font-mono text-xs">
                                                <thead className="sticky top-0 z-10 bg-black/80">
                                                    <tr>
                                                        <th className="p-2 border-r border-b border-white/10 text-muted">n</th>
                                                        {Array.from({length: Math.min(selectedNode.shape[1]||1, 50)}).map((_, i) => <th key={i} className="p-2 border-b border-white/10" style={{minWidth: `${cellWidth}px`}}>D1: {i}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.from({length: Math.min(selectedNode.shape[0]||1, 100)}).map((_, rIdx) => (
                                                        <tr key={rIdx} className="border-b border-white/5">
                                                            <td className="p-2 border-r border-white/5 text-primary text-center">D0: {rIdx}</td>
                                                            {Array.from({length: Math.min(selectedNode.shape[1]||1, 50)}).map((_, cIdx) => {
                                                                let idx = rIdx; 
                                                                if (selectedNode.shape.length > 1) {
                                                                    let laterDims = 1;
                                                                    for(let i=2; i<selectedNode.shape.length; i++) laterDims *= selectedNode.shape[i];
                                                                    let sliceOff = 0; let subMul = 1;
                                                                    for(let i=selectedNode.shape.length-1; i>=2; i--) { sliceOff += (slices[i]||0)*subMul; subMul *= selectedNode.shape[i]; }
                                                                    idx = (rIdx * selectedNode.shape[1] + cIdx) * laterDims + sliceOff;
                                                                }
                                                                const val = previewData[idx];
                                                                return <td key={cIdx} className="p-2 text-center" style={{width: `${cellWidth}px`}}>{typeof val === 'number' ? (val.toPrecision ? val.toPrecision(4) : val) : String(val)}</td>;
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : displayType === 'line' ? (
                                        <div className="chart-wrapper h-80 bg-black/20 p-6 rounded-xl">
                                             <Line 
                                                data={{
                                                    labels: Array.from({ length: Math.min(selectedNode.shape[0], 1000) }).map((_, i) => i),
                                                    datasets: [{
                                                        label: currentFile,
                                                        data: previewData?.slice(0, 1000) || [],
                                                        borderColor: '#3b82f6',
                                                        pointRadius: 0,
                                                        tension: 0.1,
                                                        fill: true,
                                                        backgroundColor: 'rgba(59, 130, 246, 0.1)'
                                                    }]
                                                }}
                                                options={{ responsive: true, maintainAspectRatio: false }}
                                             />
                                        </div>
                                    ) : (
                                        <div className="heatmap-wrapped p-6 bg-black/20 rounded-xl">
                                            <div className="heatmap-grid d-grid gap-px" style={{ gridTemplateColumns: `repeat(${Math.min(selectedNode.shape[1]||1, 50)}, 1fr)` }}>
                                                {previewData?.slice(0, 2500).map((v, i) => {
                                                    const norm = (v - Math.min(...previewData.slice(0, 2500))) / (Math.max(...previewData.slice(0, 2500)) - Math.min(...previewData.slice(0, 2500)) || 1);
                                                    return <div key={i} className="aspect-square" style={{ background: `hsl(${240-norm*180}, 70%, 50%)` }} title={v}/>;
                                                })}
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
