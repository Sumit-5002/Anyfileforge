import React, { useState, useEffect, useMemo } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseNetCDF, getVariableData } from '../../../../services/researcher/netcdfService';
import ToolWorkspace from '../common/ToolWorkspace';
import { 
    Download, Activity, Info,
    Trash2, Loader2,
    Wind, Waves, CloudRain, Droplets, FileJson, FileSpreadsheet as CSVIcon,
    Sigma, Calculator, Terminal, Code2, Search, TableProperties, PanelsTopLeft
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './NetCdfViewerTool.css'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const NetCdfViewerTool = ({ tool, onFilesAdded }) => {
    const { files: fileEntries, addFiles, removeFile } = useFileList();
    const [ncData, setNcData] = useState({}); // { fileName: parsedData }
    const [currentFile, setCurrentFile] = useState(null);
    const [selectedVar, setSelectedVar] = useState(null);
    const [varData, setVarData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [varQuery, setVarQuery] = useState('');
    const [showVarSearch, setShowVarSearch] = useState(false);

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
    const totalVariableCount = activeNc?.variables?.length || 0;
    const shouldShowSearchToggle = totalVariableCount > 8;
    const visibleVariables = useMemo(() => {
        if (!activeNc?.variables) return [];
        const q = varQuery.trim().toLowerCase();
        if (!q) return activeNc.variables;
        return activeNc.variables.filter((v) => {
            const shortName = String(v.name || '').split('/').pop().toLowerCase();
            const fullName = String(v.name || '').toLowerCase();
            const type = String(v.type || '').toLowerCase();
            return shortName.includes(q) || fullName.includes(q) || type.includes(q);
        });
    }, [activeNc, varQuery]);

    useEffect(() => {
        // Auto-enable search only for larger variable collections.
        setShowVarSearch(totalVariableCount > 12);
        setVarQuery('');
    }, [currentFile, totalVariableCount]);

    const handleSelectVar = (variable) => {
        setSelectedVar(variable);
        const data = getVariableData(activeNc.reader, variable.name, activeNc.isHdf5);
        setVarData(data);
        setActiveTab('overview');
    };

    const stats = useMemo(() => {
        if (!varData || typeof varData[0] !== 'number') return null;
        const data = varData;
        const n = data.length;
        if (n === 0) return null;
        
        let sum = 0, min = data[0], max = data[0];
        for (let i = 0; i < n; i++) {
            const v = data[i];
            sum += v;
            if (v < min) min = v;
            if (v > max) max = v;
        }
        const mean = sum / n;
        
        let sqSum = 0;
        for (let i = 0; i < n; i++) sqSum += Math.pow(data[i] - mean, 2);
        const stdDev = Math.sqrt(sqSum / n);

        return { mean, stdDev, min, max, count: n };
    }, [varData]);

    const previewData = useMemo(() => {
        if (!varData) return [];
        return Array.from(varData).slice(0, 5000);
    }, [varData]);

    const chartData = useMemo(() => {
        if (!varData || !selectedVar || (selectedVar.dimensions && selectedVar.dimensions.length > 1)) return null;
        let pData = Array.from(varData);
        if (pData.length > 1000) pData = pData.slice(0, 1000);
        return {
            labels: pData.map((_, i) => i + 1),
            datasets: [{
                label: selectedVar.name,
                data: pData.map(v => typeof v === 'number' ? v : 0),
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.12)',
                fill: true,
                tension: 0.1,
                pointRadius: 0
            }]
        };
    }, [varData, selectedVar]);

    const exportVariable = (format) => {
        if (!varData || !selectedVar) return;
        const data = Array.from(varData);
        let content = '';
        const shortName = selectedVar.name.split('/').pop();
        let fileName = `${shortName}.${format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'py'}`;
        
        if (format === 'csv') {
            const header = `index,${shortName}`;
            const rows = data.map((v, i) => `${i},${typeof v === 'number' ? v : `"${v}"`}`);
            content = [header, ...rows].join('\n');
        } else if (format === 'json') {
            content = JSON.stringify({
                name: selectedVar.name,
                dimensions: selectedVar.dimensions,
                type: selectedVar.type,
                attributes: selectedVar.attributes,
                data: data
            }, null, 2);
        } else if (format === 'python') {
            content = `import netCDF4\nimport numpy as np\n\n# Load variable from NetCDF file\nnc = netCDF4.Dataset('${currentFile}', 'r')\nvar = nc.variables['${shortName}']\ndata = var[:]\n\nprint(f"Shape: {data.shape}")\nprint(f"Attributes: {var.__dict__}")`;
            fileName = `extract_${shortName}.py`;
        } else if (format === 'ncdump') {
            content = `ncdump -v ${shortName} ${currentFile}`;
            fileName = `ncdump_command.sh`;
        }

        const blob = new Blob([content], { type: format === 'python' ? 'text/plain' : (format === 'csv' ? 'text/csv' : 'application/json') });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportAllToCsv = () => {
        if (!activeNc || !activeNc.variables) return;
        
        // Find all variables that share the same length as the selected one (or just the first one)
        const varsToExport = activeNc.variables.filter(v => v.dimensions && v.dimensions.length > 0);
        if (varsToExport.length === 0) return;

        // Header
        const headers = ['index', ...varsToExport.map(v => v.name.split('/').pop())];
        let csvRows = [headers.join(',')];

        // This is a naive join by index
        // We assume they share dimensions or at least are 1D
        const maxLen = 10000; // Limit for memory safety
        const firstVarData = getVariableData(activeNc.reader, varsToExport[0].name, activeNc.isHdf5);
        const len = Math.min(firstVarData?.length || 0, maxLen);

        const allData = varsToExport.map(v => getVariableData(activeNc.reader, v.name, activeNc.isHdf5));

        for (let i = 0; i < len; i++) {
            const row = [i, ...allData.map(data => (data && data[i] !== undefined) ? data[i] : '')];
            csvRows.push(row.join(','));
        }

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const outName = `${currentFile.split('.')[0]}_all_vars.csv`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    const selectedVarShort = selectedVar ? selectedVar.name.split('/').pop() : '';
    const selectedVarDimsText = selectedVar?.dimensions?.length ? `[${selectedVar.dimensions.join(', ')}]` : '[]';

    const handleFilesSelected = (newFiles) => {
        addFiles(newFiles);
        if (typeof onFilesAdded === 'function') {
            onFilesAdded(newFiles);
        }
    };

    return (
        <ToolWorkspace
            tool={tool}
            files={fileEntries.map(f => f.file)}
            results={results}
            onFilesSelected={handleFilesSelected}
            accept=".nc,.netcdf"
            multiple={true}
            layout="research"
            sidebarTitle="Oceanic Explorer"
            onReset={() => {
                fileEntries.forEach(f => removeFile(f.id));
                setNcData({});
                setCurrentFile(null);
                setSelectedVar(null);
                setVarData(null);
                setResults([]);
            }}
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
                                    <div className="ocean-var-main flex items-center gap-2 overflow-hidden">
                                        <Droplets size={14} className={currentFile === f.file.name ? 'text-sky-300' : 'text-slate-500'} />
                                        <span className="ocean-var-name text-xs font-bold font-mono truncate" title={f.file.name}>{f.file.name}</span>
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
                        <div className="ocean-section ocean-vars-section flex-grow overflow-hidden flex flex-col">
                            <div className="ocean-var-toolbar">
                                <div className="ocean-title"><CloudRain size={14}/> DIMENSION VARS</div>
                                <div className="ocean-var-toolbar-actions">
                                    <span className="ocean-var-count">{visibleVariables.length}</span>
                                    {shouldShowSearchToggle && (
                                        <button
                                            type="button"
                                            className={`btn-var-search-toggle ${showVarSearch ? 'active' : ''}`}
                                            onClick={() => {
                                                setShowVarSearch((prev) => {
                                                    if (prev) setVarQuery('');
                                                    return !prev;
                                                });
                                            }}
                                        >
                                            <Search size={12} />
                                            Find
                                        </button>
                                    )}
                                </div>
                            </div>
                            {showVarSearch && (
                                <div className="ocean-var-search">
                                    <Search size={13} />
                                    <input
                                        type="text"
                                        value={varQuery}
                                        onChange={(e) => setVarQuery(e.target.value)}
                                        placeholder="Search variable..."
                                        aria-label="Search variables"
                                        autoComplete="off"
                                        spellCheck={false}
                                    />
                                </div>
                            )}
                            <div className="ocean-var-manager flex-grow overflow-auto scroll-premium pr-1">
                                <div className="nc-var-list-head">
                                    <span>Name</span>
                                    <span>Type</span>
                                </div>
                                {visibleVariables.map((v, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`nc-var-item ${selectedVar?.name === v.name ? 'active' : ''}`}
                                        onClick={() => handleSelectVar(v)}
                                        title={v.name}
                                    >
                                        <div className="nc-var-item-main">
                                            <span className="nc-var-item-name">{v.name.split('/').pop()}</span>
                                            <span className="nc-var-item-dims">[{(v.dimensions || []).join(', ')}]</span>
                                        </div>
                                        <span className="nc-var-item-type">{v.type || 'float'}</span>
                                    </button>
                                ))}
                                {visibleVariables.length === 0 && (
                                    <div className="ocean-var-empty">No variables matched your search.</div>
                                )}
                            </div>
                        </div>
                    )}

                        <div className="ocean-section ocean-export-section">
                            <div className="ocean-title"><Download size={14}/> EXPORT</div>
                            <div className="ocean-export-grid">
                                <button onClick={() => exportVariable('csv')} className="ocean-export-btn" title="CSV Export">
                                    <CSVIcon size={14} />
                                    <span>VAR.CSV</span>
                                </button>
                                <button onClick={() => exportVariable('json')} className="ocean-export-btn" title="JSON Export">
                                    <FileJson size={14} />
                                    <span>VAR.JSON</span>
                                </button>
                                <button onClick={() => exportAllToCsv()} className="ocean-export-btn ocean-export-primary" title="Export All Variables to CSV">
                                    <TableProperties size={14} />
                                    <span>ALL VARS</span>
                                </button>
                                <button onClick={() => exportVariable('python')} className="ocean-export-btn" title="Python Script">
                                    <Code2 size={14} />
                                    <span>SCRIPT</span>
                                </button>
                            </div>
                        </div>
                </div>
            }
        >
             <div className="netcdf-viewer-container h-full p-4 pb-8 overflow-hidden">
                {!currentFile ? (
                    <div className="empty-state text-center p-12">
                        <Waves size={64} className="opacity-10 mx-auto mb-6 text-sky-400"/>
                        <h2 className="mb-2 font-mono">NetCDF Oceanic <span className="text-sky-400">Voyager</span></h2>
                        <p className="text-muted text-sm max-w-sm mx-auto">Visualize global climate models, oceanographic readings, and multi-dimensional atmospheric datasets locally.</p>
                    </div>
                ) : !selectedVar ? (
                    <div className="empty-state text-center p-12">
                        <CloudRain size={48} className="opacity-10 mx-auto mb-4 text-sky-400"/>
                        <p className="font-mono text-sm">Workspace <b>{currentFile}</b> is active. Select a netCDF variable to begin inspection.</p>
                    </div>
                ) : (
                    <div className="nc-dataset-panel h-full flex flex-col fade-in overflow-hidden gap-2">
                        <div className="nc-dataset-header flex-shrink-0">
                            <div className="pan-toolbar">
                                <div className="pan-toolbar-left">
                                    <PanelsTopLeft size={14} />
                                    <span>Panoply Style Browser</span>
                                </div>
                                <span className="badge-pill bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-[10px]">NC-{activeNc.isHdf5 ? '4' : '3'}</span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="nc-breadcrumb">
                                    <span className="nc-breadcrumb-part font-mono text-xs" title={currentFile}>{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="nc-breadcrumb-part nc-breadcrumb-active font-mono text-xs" title={selectedVar.name}>{selectedVar.name}</span>
                                </div>
                            </div>
                            
                            <div className="nc-tabs">
                                <button className={`nc-tab-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><Activity size={14}/> Graph</button>
                                <button className={`nc-tab-pill ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}><Sigma size={14}/> Analytics</button>
                                <button className={`nc-tab-pill ${activeTab === 'metadata' ? 'active' : ''}`} onClick={() => setActiveTab('metadata')}><Info size={14}/> Attributes</button>
                            </div>
                        </div>

                        <div className="nc-tab-content flex-grow overflow-y-auto scroll-premium pr-2 pb-6">
                            {activeTab === 'overview' && (
                                <div className="nc-overview-tab flex flex-col gap-6 p-1">
                                    <div className="nc-visual-grid">
                                        <div className="nc-plot-panel">
                                            {chartData ? (
                                                <div className="ocean-chart-box shadow-premium">
                                                    <div className="h-64 nc-chart-frame">
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
                                                <div className="nc-plot-empty">
                                                    <Wind size={32} className="opacity-20 mx-auto mb-3" />
                                                    <p className="text-xs opacity-70 font-mono text-sky-200">Multidimensional variable detected.</p>
                                                    <p className="text-[10px] opacity-45 font-mono text-sky-200">Use table preview and attributes tab.</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="nc-overview-grid">
                                            <div className="nc-overview-card">
                                                <div className="nc-card-label">Variable</div>
                                                <div className="nc-card-value font-mono text-sky-400" title={selectedVarShort}>{selectedVarShort}</div>
                                            </div>
                                            <div className="nc-overview-card">
                                                <div className="nc-card-label">Dimensions</div>
                                                <div className="nc-card-value font-mono" title={selectedVarDimsText}>{selectedVarDimsText}</div>
                                            </div>
                                            <div className="nc-overview-card">
                                                <div className="nc-card-label">Data Points</div>
                                                <div className="nc-card-value font-mono text-slate-400">{varData?.length.toLocaleString() || 'N/A'}</div>
                                            </div>
                                            <div className="nc-overview-card">
                                                <div className="nc-card-label">Data Type</div>
                                                <div className="nc-card-value font-mono text-slate-300">{selectedVar.type || 'unknown'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="nc-data-preview mt-4">
                                         <div className="nc-card-label mb-3 ml-2 text-sky-400/60 font-bold uppercase tracking-widest flex items-center gap-2"><TableProperties size={12}/> Byte-Grid Stream</div>
                                         <div className="nc-table-container bg-sky-950/50 rounded-xl overflow-hidden border border-sky-900/30">
                                            <table className="w-full text-[11px] font-mono">
                                                <thead className="bg-sky-400/5 text-sky-600 uppercase tracking-tighter border-b border-sky-400/10">
                                                    <tr><th className="p-3 text-left">pos</th><th className="p-3 text-left">measurement</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-sky-400/5">
                                                    {previewData.slice(0, 50).map((v, i) => (
                                                        <tr key={i} className="hover:bg-sky-400/5 transition-colors"><td className="p-2 px-3 text-sky-900/40">{i}</td><td className="p-2 px-3 text-sky-300 font-bold">{typeof v === 'number' ? v.toFixed(6) : String(v)}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {varData && varData.length > 50 && <div className="p-3 text-center text-[10px] opacity-30 border-t border-sky-400/10 font-mono">Displaying restricted slice of {varData.length} records.</div>}
                                         </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analysis' && (
                                <div className="nc-analysis-tab p-1 fade-in">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-6 flex items-center gap-2">
                                        <Calculator size={14}/> Climatological Synthesis
                                    </h3>
                                    
                                    {stats ? (
                                        <div className="nc-stats-grid grid grid-cols-2 gap-4">
                                            <div className="nc-stat-box bg-sky-950/40 p-6 rounded-2xl border border-sky-900/40">
                                                <div className="nc-card-label text-sky-600">Sample Mean</div>
                                                <div className="text-2xl font-mono text-sky-300">{stats.mean.toFixed(8)}</div>
                                            </div>
                                            <div className="nc-stat-box bg-sky-950/40 p-6 rounded-2xl border border-sky-900/40">
                                                <div className="nc-card-label text-sky-600">Standard Deviation</div>
                                                <div className="text-2xl font-mono text-sky-300">{stats.stdDev.toFixed(8)}</div>
                                            </div>
                                            <div className="nc-stat-box bg-sky-950/40 p-6 rounded-2xl border border-sky-900/40">
                                                <div className="nc-card-label text-sky-600">Lower Bound</div>
                                                <div className="text-2xl font-mono text-slate-400">{stats.min.toFixed(4)}</div>
                                            </div>
                                            <div className="nc-stat-box bg-sky-950/40 p-6 rounded-2xl border border-sky-900/40">
                                                <div className="nc-card-label text-sky-600">Upper Bound</div>
                                                <div className="text-2xl font-mono text-slate-400">{stats.max.toFixed(4)}</div>
                                            </div>
                                            <div className="nc-stat-box bg-sky-950/40 p-6 rounded-2xl border border-sky-900/40 col-span-2">
                                                <div className="nc-card-label text-sky-600">Sample Population</div>
                                                <div className="text-2xl font-mono text-sky-500/20">{stats.count.toLocaleString()} data points</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center opacity-40 font-mono">
                                             <Sigma size={48} className="mx-auto mb-4 opacity-10"/>
                                             <p>Climatological synthesis only available for numeric datasets.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'metadata' && (
                                <div className="nc-metadata-tab flex flex-col gap-6 p-1">
                                    <div className="nc-attributes-table bg-sky-950/80 border border-sky-900 rounded-xl overflow-hidden">
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
