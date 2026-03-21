import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseNetCDF, getVariableData } from '../../../../services/researcher/netcdfService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Layers, Activity, Info, File as FileIcon, Trash2, Loader2, Database, ChevronRight, ChevronDown } from 'lucide-react';
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

const VarNode = ({ name, node, path, onSelect, activeVar, isHdf5 }) => {
    const [expanded, setExpanded] = useState(path === '/');
    const isGroup = node.keys && typeof node.keys !== 'undefined';
    const isSelected = activeVar === path;

    return (
        <div className="nc-tree-node">
            <div className={`node-label ${isSelected ? 'active-node' : ''}`} onClick={isGroup ? () => setExpanded(!expanded) : () => onSelect(path, node)}>
                <span className="node-icon">
                    {isGroup ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{width:14}}/>}
                </span>
                <span className="type-icon">
                    {isGroup ? <Database size={14} color="#3b82f6" /> : <Activity size={14} color="#10b981" />}
                </span>
                <span className="node-name truncate">{name}</span>
            </div>
            {isGroup && expanded && node.keys.map(key => (
                <div key={path+key} className="node-children">
                    <VarNode name={key} node={node.get(key)} path={path === '/' ? `/${key}` : `${path}/${key}`} onSelect={onSelect} activeVar={activeVar} isHdf5={isHdf5} />
                </div>
            ))}
        </div>
    );
};

const NetCdfViewerTool = () => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedNc, setLoadedNc] = useState({}); // { fileName: ncData }
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedVar, setSelectedVar] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const loadNcFiles = async () => {
            const nextLoaded = { ...loadedNc };
            let lastAdded = null;
            for (const f of files) {
                if (!nextLoaded[f.file.name]) {
                    setIsProcessing(true);
                    setError('');
                    try {
                        const buffer = await f.file.arrayBuffer();
                        const data = await parseNetCDF(buffer);
                        nextLoaded[f.file.name] = data;
                        lastAdded = f.file.name;
                    } catch (err) {
                        setError(`Failed to parse ${f.file.name}: ${err.message}`);
                    } finally {
                        setIsProcessing(false);
                    }
                }
            }
            const currentNames = files.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => { if (!currentNames.includes(name)) delete nextLoaded[name]; });
            setLoadedNc(nextLoaded);
            if (lastAdded) setCurrentFile(lastAdded);
            else if (currentFile && !currentNames.includes(currentFile)) setCurrentFile(currentNames[0] || null);
        };
        loadNcFiles();
    }, [files]);

    const activeNc = currentFile ? loadedNc[currentFile] : null;

    const handleSelectVar3 = (name) => {
        if (!activeNc) return;
        const vInfo = activeNc.variables.find(v => v.name === name);
        updateView(name, vInfo);
    };

    const updateView = (name, node) => {
        setSelectedVar(name);
        setSelectedNode(node);
        try {
            const rawData = getVariableData(activeNc.reader, name, activeNc.isHdf5);
            const shape = node.dimensions || node.shape || [];
            
            if (shape.length === 1 || (shape.length > 1 && shape.slice(1).every(d => d <= 1))) {
                let displayData = Array.from(rawData);
                const MAX_POINTS = 1000;
                if (displayData.length > MAX_POINTS) {
                    const step = Math.ceil(displayData.length / MAX_POINTS);
                    displayData = displayData.filter((_, i) => i % step === 0);
                }
                setChartData({
                    labels: displayData.map((_, i) => i + 1),
                    datasets: [{ label: name, data: displayData, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.1, fill: true, pointRadius: 0 }]
                });
            } else { setChartData(null); }
        } catch (e) { setError(e.message); setChartData(null); }
    };

    return (
        <ToolWorkspace
            tool={{ name: 'NetCDF Explorer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".nc"
            multiple={true}
            layout="research"
            onReset={() => { setLoadedNc({}); setCurrentFile(null); setSelectedVar(null); setChartData(null); }}
            sidebar={
                <div className="sidebar-info researcher-tool-container h-full d-flex flex-column gap-6">
                    <div className="opened-files">
                        <div className="text-muted text-xs uppercase mb-3 font-bold tracking-wider">Opened Libraries</div>
                        <div className="d-flex flex-column gap-2">
                            {files.map(f => (
                                <div key={f.file.name} 
                                     className={`file-tab d-flex align-items-center justify-content-between p-2 rounded-lg cursor-pointer transition-all ${currentFile === f.file.name ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/5'}`}
                                     style={{ border: '1px solid currentColor' }}
                                     onClick={() => { setCurrentFile(f.file.name); setSelectedVar(null); setChartData(null); }}
                                >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <Layers size={14} className={currentFile === f.file.name ? 'text-primary' : 'text-muted'} />
                                        <span className="text-xs truncate font-medium">{f.file.name}</span>
                                    </div>
                                    <button className="p-1 hover:text-danger opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {activeNc && (
                        <div className="variable-list-container flex-grow overflow-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                             <div className="text-secondary text-xs uppercase mb-3 font-bold">Variables & Groups</div>
                             {activeNc.isHdf5 ? (
                                 <VarNode name={currentFile} node={activeNc.reader.root} path="/" onSelect={(p, n) => updateView(p, n)} activeVar={selectedVar} isHdf5={true} />
                             ) : (
                                 <div className="d-flex flex-column gap-1">
                                    {activeNc.variables.map(v => (
                                        <div key={v.name} className={`p-2 rounded-lg cursor-pointer transition-all border ${selectedVar === v.name ? 'bg-primary/10 border-primary/40' : 'bg-black/10 border-white/5'}`} onClick={() => handleSelectVar3(v.name)}>
                                            <div className="text-xs font-bold truncate text-primary-300">{v.name}</div>
                                            <div className="text-xs text-muted font-mono">{v.dimensions.join('×') || 'scalar'} | {v.type}</div>
                                        </div>
                                    ))}
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            }
        >
             <div className="netcdf-main researcher-tool-container h-full">
                {!currentFile ? (
                    <div className="empty-state text-center p-12"><Layers size={64} className="opacity-10 mx-auto mb-4"/><h3>NetCDF Scientific Hub</h3><p className="text-muted">Analyze NetCDF-3 and NetCDF-4 (HDF5) datasets.</p></div>
                ) : !selectedVar ? (
                    <div className="empty-state text-center p-12"><Info size={48} className="opacity-10 mx-auto mb-4"/><p>Select a variable or group from <b>{currentFile}</b> to explore dimensions.</p></div>
                ) : (
                    <div className="dataset-panel fade-in h-full flex-grow">
                        <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="breadcrumb-nav d-flex align-items-center gap-2">
                                    <span className="breadcrumb-part truncate" style={{maxWidth:120}}>{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="breadcrumb-part">{selectedVar}</span>
                                </div>
                                <span className="badge-pill bg-primary/10 text-primary border border-primary/20">{activeNc.isHdf5 ? 'NetCDF-4 (HDF5)' : 'NetCDF-3 (Legacy)'}</span>
                            </div>
                        </div>

                        <div className="custom-tabs d-flex gap-1 mb-6 p-1 bg-black/20 rounded-lg w-fit">
                            <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Activity size={14}/> Visualization</button>
                            <button className={`tab-pill ${activeTab === 'attributes' ? 'active' : ''}`} onClick={() => setActiveTab('attributes')}><Info size={14}/> Attributes</button>
                        </div>

                        <div className="tab-content">
                            {activeTab === 'overview' && (
                                <div className="analysis-view d-flex flex-column gap-6">
                                    {chartData ? (
                                        <div className="chart-container h-80 bg-black/20 p-6 rounded-2xl border border-white/5 shadow-xl">
                                            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                        </div>
                                    ) : (
                                        <div className="alert alert-info p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm d-flex align-items-center gap-3">
                                            <Info size={16} className="text-primary"/>
                                            <span>Variable is {selectedNode.shape?.length || selectedNode.dimensions?.length}-dimensional. Grid-based heatmap visualization coming soon.</span>
                                        </div>
                                    )}

                                    <div className="data-table-container scroll-premium max-h-80 overflow-auto bg-black/30 rounded-xl border border-white/5">
                                        <table className="w-full text-xs font-mono">
                                            <thead className="sticky top-0 bg-black/80 text-muted uppercase tracking-tighter border-b border-white/10">
                                                <tr><th className="p-3 text-left">POS</th><th className="p-3 text-left">VALUE</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {chartData?.datasets[0].data.slice(0, 100).map((v, i) => (
                                                    <tr key={i}><td className="p-2 px-3 text-muted">{i}</td><td className="p-2 px-3 text-primary-300 font-bold">{typeof v === 'number' ? v.toPrecision(5) : String(v)}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'attributes' && (
                                <div className="attributes-view bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                                     <table className="w-full text-left font-mono text-sm">
                                        <thead className="bg-white/5 text-xs text-muted"><tr><th className="p-3">Attribute</th><th className="p-3">Value</th></tr></thead>
                                        <tbody className="divide-y divide-white/5">
                                            {Object.entries(selectedNode.attributes || selectedNode.attrs || {}).map(([k, v]) => (
                                                <tr key={k}><td className="p-3 text-primary">{k}</td><td className="p-3 uppercase">{String(v)}</td></tr>
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

export default NetCdfViewerTool;
