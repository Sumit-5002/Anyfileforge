import React, { useState, useEffect, useMemo } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseNetCDF, getVariableData } from '../../../../services/researcher/netcdfService';
import ToolWorkspace from '../common/ToolWorkspace';
import { 
    Download, Layers, Activity, Info, File as FileIcon, 
    Trash2, Loader2, Database, ChevronRight, ChevronDown, 
    Wind, Waves, CloudRain, Droplets
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './NetCdfViewerTool.css'; // Unique specialized styles

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const NetCdfViewerTool = () => {
    const { files: fileEntries, addFiles, removeFile } = useFileList();
    const [ncData, setNcData] = useState({}); // { fileName: parsedData }
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedVar, setSelectedVar] = useState(null);
    const [varData, setVarData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const loadFiles = async () => {
            const nextLoaded = { ...ncData };
            let lastAdded = null;
            for (const f of fileEntries) {
                if (!nextLoaded[f.file.name]) {
                    setIsProcessing(true);
                    try {
                        const buffer = await f.file.arrayBuffer();
                        const parsed = await parseNetCDF(buffer);
                        nextLoaded[f.file.name] = parsed;
                        lastAdded = f.file.name;
                    } catch (e) {
                        console.error('NetCDF error:', e);
                    } finally {
                        setIsProcessing(false);
                    }
                }
            }
            const currentNames = fileEntries.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => { if (!currentNames.includes(name)) delete nextLoaded[name]; });
            setNcData(nextLoaded);
            if (lastAdded) { setCurrentFile(lastAdded); setSelectedVar(null); setVarData(null); }
            else if (currentFile && !currentNames.includes(currentFile)) { setCurrentFile(currentNames[0] || null); setSelectedVar(null); setVarData(null); }
        };
        loadFiles();
    }, [fileEntries]);

    const activeNc = currentFile ? ncData[currentFile] : null;

    const handleSelectVar = (variable) => {
        setSelectedVar(variable);
        const data = getVariableData(activeNc.reader, variable.name, activeNc.isHdf5);
        setVarData(data);
        setActiveTab('overview');
    };

    const chartData = useMemo(() => {
        if (!varData || !selectedVar || (selectedVar.dimensions && selectedVar.dimensions.length > 1)) return null;
        let pData = Array.from(varData);
        if (pData.length > 1000) pData = pData.slice(0, 1000);
        return {
            labels: pData.map((_, i) => i + 1),
            datasets: [{
                label: selectedVar.name,
                data: pData,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.12)',
                fill: true,
                tension: 0.1,
                pointRadius: 0
            }]
        };
    }, [varData, selectedVar]);

    return (
        <ToolWorkspace
            tool={{ name: 'NetCDF Viewer' }}
            files={fileEntries.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".nc,.netcdf"
            multiple={true}
            layout="research"
            sidebarTitle="Oceanic Explorer"
            sidebar={
                <div className="netcdf-ocean-explorer">
                    <div className="ocean-section">
                        <div className="ocean-title"><Waves size={14}/> ACTIVE SAMPLES</div>
                        <div className="ocean-file-list">
                            {fileEntries.map(f => (
                                <div key={f.file.name} 
                                     className={`ocean-var-card ${currentFile === f.file.name ? 'active' : ''}`}
                                     onClick={() => { setCurrentFile(f.file.name); setSelectedVar(null); setVarData(null); }}
                                >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <Droplets size={14} className={currentFile === f.file.name ? 'text-sky-300' : 'text-slate-500'} />
                                        <span className="text-xs font-bold font-mono truncate">{f.file.name}</span>
                                    </div>
                                    <button className="btn-remove-ocean" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isProcessing && (
                         <div className="ocean-loading-badge">
                            <Loader2 size={14} className="spinning text-sky-500"/>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Hydrating Sample...</span>
                        </div>
                    )}

                    {activeNc && (
                        <div className="ocean-section flex-grow overflow-hidden d-flex flex-column">
                            <div className="ocean-title"><CloudRain size={14}/> DIMENSION VARS</div>
                            <div className="ocean-var-manager flex-grow overflow-auto scroll-premium pr-1">
                                {activeNc.variables.map((v, i) => (
                                    <div key={i} 
                                         className={`ocean-var-card ${selectedVar?.name === v.name ? 'active' : ''}`}
                                         onClick={() => handleSelectVar(v)}
                                    >
                                        <div className="d-flex align-items-center gap-3 overflow-hidden">
                                            <Wind size={14} className="opacity-40" />
                                            <div className="d-flex flex-column overflow-hidden">
                                                <span className="text-[11px] font-bold font-mono truncate">{v.name.split('/').pop()}</span>
                                                <span className="text-[9px] opacity-40 uppercase tracking-tighter">{v.type || 'float'} [{v.dimensions.join(',')}]</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            }
        >
             <div className="netcdf-viewer-container h-full p-2">
                {!currentFile ? (
                    <div className="empty-state text-center p-12">
                        <Waves size={64} className="opacity-10 mx-auto mb-6 text-sky-400"/>
                        <h2 className="mb-2 font-mono">NetCDF Oceanic <span className="text-sky-400">Voyager</span></h2>
                        <p className="text-muted text-sm max-w-sm mx-auto">Visualize global climate models, oceanographic readings, and multi-dimensional atmospheric datasets locally.</p>
                    </div>
                ) : !selectedVar ? (
                    <div className="empty-state text-center p-12">
                        <CloudRain size={48} className="opacity-10 mx-auto mb-4 text-sky-400"/>
                        <p className="font-mono text-sm">Workspace <b>{currentFile}</b> is active. Select a netCDF variable to शुरू inspection.</p>
                    </div>
                ) : (
                    <div className="dataset-panel h-full d-flex flex-column fade-in">
                        <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <div className="breadcrumb-nav">
                                    <span className="breadcrumb-part font-mono text-xs">{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="breadcrumb-part font-mono text-xs text-sky-300">{selectedVar.name}</span>
                                </div>
                                <span className="badge-pill bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-[10px]">NC-{activeNc.isHdf5 ? '4' : '3'}</span>
                            </div>
                            
                            <div className="custom-tabs">
                                <button className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Activity size={14}/> Graph</button>
                                <button className={`tab-pill ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}><Info size={14}/> Attributes</button>
                            </div>
                        </div>

                        <div className="tab-content flex-grow overflow-auto scroll-premium">
                            {activeTab === 'overview' && (
                                <div className="overview-tab d-flex flex-column gap-6 p-1">
                                    <div className="overview-grid">
                                        <div className="overview-card">
                                            <div className="card-label">Variable</div>
                                            <div className="card-value font-mono text-sky-400">{selectedVar.name.split('/').pop()}</div>
                                        </div>
                                        <div className="overview-card">
                                            <div className="card-label">Dimensions</div>
                                            <div className="card-value font-mono">[{selectedVar.dimensions?.join(', ')}]</div>
                                        </div>
                                        <div className="overview-card">
                                            <div className="card-label">Data Points</div>
                                            <div className="card-value font-mono text-slate-400">{varData?.length || 'N/A'}</div>
                                        </div>
                                    </div>

                                    {chartData ? (
                                        <div className="ocean-chart-box shadow-premium">
                                            <div className="h-64">
                                                <Line data={chartData} options={{ 
                                                    responsive: true, 
                                                    maintainAspectRatio: false, 
                                                    plugins: { legend: { display: false } },
                                                    scales: { 
                                                        x: { grid: { color: 'rgba(14, 165, 233, 0.05)' }, ticks: { color: 'rgba(14, 165, 233, 0.4)' } },
                                                        y: { grid: { color: 'rgba(14, 165, 233, 0.05)' }, ticks: { color: 'rgba(14, 165, 233, 0.4)' } }
                                                    }
                                                }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-10 bg-sky-950/30 border border-sky-800/30 rounded-2xl text-center">
                                            <Wind size={32} className="opacity-20 mx-auto mb-3" />
                                            <p className="text-xs italic opacity-60 font-mono text-sky-200">
                                                Variable exceeds 1D visualization limits. High-dimensional array detection active.
                                            </p>
                                        </div>
                                    )}

                                    <div className="data-preview mt-4">
                                         <div className="card-label mb-3 ml-2">Oceanographic Byte-Grid</div>
                                         <div className="table-container bg-sky-950/50 rounded-xl overflow-hidden border border-sky-900/30">
                                            <table className="w-full text-[11px] font-mono">
                                                <thead className="bg-sky-400/5 text-sky-600 uppercase tracking-tighter border-b border-sky-400/10">
                                                    <tr><th className="p-3 text-left">pos</th><th className="p-3 text-left">value</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-sky-400/5">
                                                    {varData && Array.from(varData).slice(0, 50).map((v, i) => (
                                                        <tr key={i} className="hover:bg-sky-400/5 transition-colors"><td className="p-2 px-3 text-sky-900/40">{i}</td><td className="p-2 px-3 text-sky-300 font-bold">{String(v)}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {varData && varData.length > 50 && <div className="p-3 text-center text-[10px] opacity-30 border-t border-sky-400/10 font-mono">Slice view limited to top 50 points.</div>}
                                            {!varData && <div className="p-12 text-center opacity-30 italic">No numeric buffer available for this variable.</div>}
                                         </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'metadata' && (
                                <div className="metadata-tab d-flex flex-column gap-6 p-1">
                                    <div className="attributes-table bg-sky-950/80 border border-sky-900 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5 text-sky-700 uppercase text-[10px] tracking-wider"><tr><th className="p-3 text-left">Global Attribute</th><th className="p-3 text-left">Value</th></tr></thead>
                                            <tbody className="divide-y divide-white/5">
                                                {Object.entries(selectedVar.attributes || {}).map(([k, v]) => (
                                                    <tr key={k} className="hover:bg-white/5 transition-colors"><td className="p-3 font-bold text-sky-400 font-mono text-xs">{k}</td><td className="p-3 font-mono text-xs text-sky-200">{String(v)}</td></tr>
                                                ))}
                                                {Object.keys(selectedVar.attributes || {}).length === 0 && <tr><td colSpan="2" className="p-8 text-center text-sky-800 font-mono text-xs">No local metadata for this dimension.</td></tr>}
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

export default NetCdfViewerTool;
