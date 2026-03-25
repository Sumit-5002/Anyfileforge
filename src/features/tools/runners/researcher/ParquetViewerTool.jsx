import React, { useState, useEffect, useMemo } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseParquet, fetchParquetData, queryParquetData } from '../../../../services/researcher/parquetService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Table, Info, Database, BarChart2, FileTerminal, Calculator, FileJson, FileSpreadsheet, AlertCircle, Share2, Layers, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ParquetViewerTool = ({ tool }) => {
    const { files, addFiles, removeFile } = useFileList();
    const [pqData, setPqData] = useState(null);
    const [allRows, setAllRows] = useState(null);
    const [error, setError] = useState('');
    const [results, setResults] = useState([]);
    
    const [activeTab, setActiveTab] = useState('sql'); // sql, chart, schema
    const [sqlQuery, setSqlQuery] = useState('SELECT * FROM data LIMIT 100');
    const [queryResult, setQueryResult] = useState([]);
    const [queryError, setQueryError] = useState('');
    const [chartDataState, setChartDataState] = useState(null);

    const columnStats = useMemo(() => {
        if (!allRows || allRows.length === 0) return {};
        const stats = {};
        const keys = Object.keys(allRows[0]);
        keys.forEach(k => {
            const vals = allRows.map(r => r[k]).filter(v => v !== null && v !== undefined);
            const numVals = vals.filter(v => typeof v === 'number');
            stats[k] = {
                nullCount: allRows.length - vals.length,
                uniqueCount: new Set(vals).size,
                min: numVals.length > 0 ? Math.min(...numVals) : 'N/A',
                max: numVals.length > 0 ? Math.max(...numVals) : 'N/A'
            };
        });
        return stats;
    }, [allRows]);

    useEffect(() => {
        let cancelled = false;
        if (files.length > 0) {
            const load = async () => {
                try {
                    setError('');
                    const data = await parseParquet(files[0].file);
                    if (cancelled) return;
                    setPqData(data);
                    const rows = await fetchParquetData(data.arrayBuffer);
                    if (cancelled) return;
                    setAllRows(rows);
                    setQueryResult(rows.slice(0, 100));
                    generateChart(rows.slice(0, 100));
                } catch (err) {
                    if (!cancelled) setError(err.message);
                }
            };
            load();
        } else {
            setPqData(null);
            setAllRows(null);
            setError('');
            setQueryResult([]);
            setResults([]);
        }
        return () => { cancelled = true; };
    }, [files]);

    const handleRunQuery = () => {
        if (!allRows) return;
        try {
            setQueryError('');
            const parsedQuery = sqlQuery.replace(/data/ig, '?');
            const res = queryParquetData(allRows, parsedQuery);
            const resArray = Array.isArray(res) ? res : [res];
            setQueryResult(resArray);
            generateChart(resArray);
        } catch(err) {
            setQueryError(err.message);
        }
    };

    const generateChart = (dataArr) => {
        if (!dataArr || dataArr.length === 0) {
            setChartDataState(null);
            return;
        }
        let xKey = null, yKey = null;
        const firstObj = dataArr[0];
        for (const [key, value] of Object.entries(firstObj)) {
            if (typeof value === 'number' && !yKey) yKey = key;
            if ((typeof value === 'string' || value instanceof Date) && !xKey) xKey = key;
        }
        if (!xKey) xKey = Object.keys(firstObj)[0];
        if (!yKey) yKey = Object.keys(firstObj).find(k => typeof firstObj[k] === 'number') || Object.keys(firstObj)[1];

        if (xKey && yKey) {
            setChartDataState({
                labels: dataArr.slice(0, 50).map(d => String(d[xKey]).substring(0, 20)),
                datasets: [{
                    label: yKey,
                    data: dataArr.slice(0, 50).map(d => d[yKey] || 0),
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            });
        }
    };

    const handleExport = (format, source) => {
        const dataToExport = source === 'full' ? allRows : queryResult;
        if (!dataToExport || dataToExport.length === 0) return;

        let blob;
        let fileName = `${source}_export_${Date.now()}.${format}`;

        if (format === 'csv') {
            const keys = Object.keys(dataToExport[0]);
            const content = [keys.join(','), ...dataToExport.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
            blob = new Blob([content], { type: 'text/csv' });
        } else if (format === 'json') {
            const content = JSON.stringify(dataToExport, null, 2);
            blob = new Blob([content], { type: 'application/json' });
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Data");
            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        }

        setResults(prev => [...prev, {
            id: `pq-${Date.now()}`,
            name: fileName,
            data: blob,
            type: 'data'
        }]);
    };

    return (
        <ToolWorkspace
            tool={tool || { name: 'Parquet Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".parquet"
            results={results}
            onReset={() => { files.forEach(f => removeFile(f.id)); setPqData(null); setAllRows(null); setResults([]); }}
            layout="research"
            sidebarTitle="PARQUET_ENGINE"
            sidebar={
                <div className="pq-sidebar p-2 flex flex-col gap-10">
                    <div className="section">
                        <div className="section-title text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Navigation_Map</div>
                        <div className="flex flex-col gap-2">
                             <button className={`p-4 rounded-2xl flex items-center gap-4 transition-all border ${activeTab === 'sql' ? 'bg-primary-500 border-primary-400 text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`} onClick={() => setActiveTab('sql')}>
                                <FileTerminal size={18} />
                                <span className="text-[11px] font-black uppercase">SQL_VOYAGER</span>
                             </button>
                             <button className={`p-4 rounded-2xl flex items-center gap-4 transition-all border ${activeTab === 'chart' ? 'bg-primary-500 border-primary-400 text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`} onClick={() => setActiveTab('chart')}>
                                <BarChart2 size={18} />
                                <span className="text-[11px] font-black uppercase">DENSITY_PLOTS</span>
                             </button>
                             <button className={`p-4 rounded-2xl flex items-center gap-4 transition-all border ${activeTab === 'schema' ? 'bg-primary-500 border-primary-400 text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`} onClick={() => setActiveTab('schema')}>
                                <Info size={18} />
                                <span className="text-[11px] font-black uppercase">STRUCT_COLUMNS</span>
                             </button>
                        </div>
                    </div>

                    {pqData && (
                        <div className="section mt-auto">
                            <div className="section-title text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Buffered_Export</div>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group transition-all" onClick={() => handleExport('xlsx', 'query')}>
                                    <FileSpreadsheet size={20} className="text-emerald-400"/>
                                    <span className="text-[8px] font-black uppercase">EXCEL_Q</span>
                                </button>
                                <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group transition-all" onClick={() => handleExport('csv', 'full')}>
                                    <Database size={20} className="text-primary-400"/>
                                    <span className="text-[8px] font-black uppercase">FULL_CSV</span>
                                </button>
                                <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group transition-all" onClick={() => handleExport('json', 'query')}>
                                    <FileJson size={20} className="text-amber-400"/>
                                    <span className="text-[8px] font-black uppercase">JSON_Q</span>
                                </button>
                                <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group transition-all" onClick={() => handleExport('xlsx', 'full')}>
                                    <Layers size={20} className="text-indigo-400"/>
                                    <span className="text-[8px] font-black uppercase">XLSX_F</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="pq-container h-full p-4 flex flex-col">
                {!pqData ? (
                    <div className="empty-state h-full flex items-center justify-center flex-col opacity-20 p-20 text-center uppercase">
                         <Database size={80} className="mb-6 stroke-1 text-slate-500"/>
                         <p className="text-2xl font-black italic tracking-tighter mb-2">Registry_Null</p>
                         <p className="text-[9px] font-black tracking-[3px] text-slate-500">Mount .parquet volumes for columnar inspection.</p>
                         {error && <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center gap-3 font-mono text-[10px] tracking-widest">ERROR: {error}</div>}
                    </div>
                ) : (
                    <div className="dataset-panel h-full flex flex-col gap-6 animate-in fade-in">
                        {activeTab === 'sql' && (
                            <div className="flex flex-col h-full gap-6">
                                <div className="bg-slate-900/60 p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group">
                                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] rounded-full"></div>
                                     <textarea 
                                        className="w-full bg-transparent text-primary-300 font-mono text-sm border-0 focus:ring-0 p-0 leading-relaxed outline-none min-h-[100px] no-scrollbar"
                                        value={sqlQuery}
                                        onChange={(e) => setSqlQuery(e.target.value)}
                                        spellCheck={false}
                                        placeholder="SELECT * FROM data..."
                                     />
                                     <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                                         <button className="btn-primary-gradient px-8 py-4 rounded-full flex items-center gap-3 text-[11px] font-black uppercase italic shadow-2xl active:scale-95 transition-all" onClick={handleRunQuery}>
                                             <Zap size={16}/> COMMIT_ANALYSIS
                                         </button>
                                         <div className="flex items-center gap-3 px-6 py-2 bg-black/40 border border-white/5 rounded-full">
                                             <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                             <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                                 SNAPSHOT: {queryResult.length}/{allRows?.length} RECORDS
                                             </span>
                                         </div>
                                     </div>
                                </div>
                                
                                <div className="flex-grow min-h-0 bg-black/40 rounded-[40px] border border-white/5 shadow-inner overflow-hidden flex flex-col">
                                     <div className="overflow-auto no-scrollbar flex-grow">
                                         {queryResult.length > 0 ? (
                                             <table className="w-full text-left font-mono text-[10px] border-separate border-spacing-0">
                                                 <thead className="bg-slate-950 sticky top-0 z-10 border-b border-white/5">
                                                     <tr>
                                                         {Object.keys(queryResult[0]).map(k => (
                                                             <th key={k} className="p-4 px-8 text-primary-500/60 font-black uppercase tracking-widest border-b border-white/5">{k}</th>
                                                         ))}
                                                     </tr>
                                                 </thead>
                                                 <tbody className="divide-y divide-white/[0.03]">
                                                     {queryResult.slice(0, 100).map((row, i) => (
                                                         <tr key={i} className="hover:bg-primary-500/5 transition-colors">
                                                             {Object.keys(queryResult[0]).map(k => (
                                                                 <td key={k} className="p-4 px-8 text-slate-300 leading-relaxed min-w-[150px]">{String(row[k] ?? 'NULL')}</td>
                                                             ))}
                                                         </tr>
                                                     ))}
                                                 </tbody>
                                             </table>
                                         ) : (
                                             <div className="h-full flex flex-center opacity-30 p-20 text-center font-black uppercase tracking-widest text-[10px]">Registry Empty</div>
                                         )}
                                     </div>
                                     {queryResult.length > 100 && <div className="p-4 text-center bg-slate-950/50 border-t border-white/5 text-[9px] font-black uppercase text-slate-600 tracking-[3px]">DISPLAY_RESTRICTED_100_FLUID</div>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'chart' && (
                            <div className="flex flex-col h-full gap-8">
                                <div className="flex items-center justify-between px-4">
                                     <div className="flex items-center gap-3">
                                         <BarChart2 size={24} className="text-primary-500"/>
                                         <span className="text-[11px] font-black uppercase tracking-widest text-white">Spectral_Probability</span>
                                     </div>
                                     <div className="text-[10px] font-black uppercase text-slate-500 bg-white/5 px-4 py-2 rounded-full">Top 50 Variances</div>
                                </div>
                                <div className="flex-grow bg-black/40 rounded-[40px] p-12 border border-white/5 shadow-2xl overflow-hidden">
                                     {chartDataState ? (
                                         <Bar 
                                            data={chartDataState} 
                                            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.2)' } }, y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: 'rgba(255,255,255,0.2)' } } } }} 
                                         />
                                     ) : (
                                         <div className="h-full flex flex-col items-center justify-center opacity-20">
                                             <AlertCircle size={48} className="mb-4 text-slate-500" />
                                             <p className="text-[10px] font-black uppercase tracking-widest">No dimensional data identified.</p>
                                         </div>
                                     )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'schema' && (
                            <div className="h-full overflow-auto no-scrollbar pr-4 pb-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                                    {pqData.metadata.schema.filter(c => c.name !== 'schema').map((col, idx) => (
                                        <div key={idx} className="bg-slate-900/60 p-8 rounded-[32px] border border-white/10 hover:border-primary-500/30 transition-all relative group overflow-hidden">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-1">Atom_Name</span>
                                                    <span className="text-sm font-mono font-black text-white italic tracking-tighter">{col.name}</span>
                                                </div>
                                                <div className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase text-primary-400 border border-white/5">{col.type || 'STRUCT'}</div>
                                            </div>
                                            {columnStats[col.name] && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                                                        <div className="text-[8px] font-black uppercase text-slate-600 mb-0.5">Nullity</div>
                                                        <div className="text-xs font-mono font-bold text-slate-400">{columnStats[col.name].nullCount}</div>
                                                    </div>
                                                    <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                                                        <div className="text-[8px] font-black uppercase text-slate-600 mb-0.5">Cardinality</div>
                                                        <div className="text-xs font-mono font-bold text-slate-400">{columnStats[col.name].uniqueCount}</div>
                                                    </div>
                                                    <div className="bg-black/40 p-3 rounded-2xl border border-white/5 col-span-2">
                                                        <div className="text-[8px] font-black uppercase text-slate-600 mb-0.5">Variance_Range</div>
                                                        <div className="text-[10px] font-mono font-bold text-primary-400/80 truncate">[{columnStats[col.name].min} → {columnStats[col.name].max}]</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};

export default ParquetViewerTool;
