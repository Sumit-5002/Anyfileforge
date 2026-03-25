import React, { useState, useEffect, useMemo } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseParquet, fetchParquetData, queryParquetData } from '../../../../services/researcher/parquetService';
import ToolWorkspace from '../common/ToolWorkspace';
import { BarChart2, FileTerminal, Info, Database, FileJson, FileSpreadsheet, Layers, Zap, AlertCircle } from 'lucide-react';
import './ParquetViewerTool.css';
import * as XLSX from 'xlsx';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ParquetViewerTool = ({ tool }) => {
    const { files, addFiles, removeFile } = useFileList();
    const [pqData, setPqData] = useState(null);
    const [allRows, setAllRows] = useState(null);
    const [error, setError] = useState('');
    const [results] = useState([]);

    const [activeTab, setActiveTab] = useState('sql');
    const [sqlQuery, setSqlQuery] = useState('SELECT * FROM data LIMIT 100');
    const [queryResult, setQueryResult] = useState([]);
    const [queryError, setQueryError] = useState('');
    const [chartDataState, setChartDataState] = useState(null);
    const [displayLimit, setDisplayLimit] = useState(100);

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
                max: numVals.length > 0 ? Math.max(...numVals) : 'N/A',
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
                    generateChart(rows.slice(0, 10));
                } catch (err) {
                    if (!cancelled) setError(err.message);
                }
            };
            load();
        } else {
            setPqData(null); setAllRows(null); setError(''); setQueryResult([]);
        }
        return () => { cancelled = true; };
    }, [files]);

    const handleRunQuery = () => {
        if (!allRows) return;
        try {
            setQueryError('');
            const res = queryParquetData(allRows, sqlQuery.replace(/data/ig, '?'));
            const arr = Array.isArray(res) ? res : [res];
            setQueryResult(arr);
            generateChart(arr);
        } catch (err) {
            setQueryError(err.message);
        }
    };

    const generateChart = (dataArr) => {
        if (!dataArr?.length) { setChartDataState(null); return; }
        const first = dataArr[0];
        const xKey = Object.keys(first).find(k => typeof first[k] === 'string') || Object.keys(first)[0];
        const yKey = Object.keys(first).find(k => typeof first[k] === 'number');
        if (!yKey) { setChartDataState(null); return; }
        setChartDataState({
            labels: dataArr.slice(0, 50).map(d => String(d[xKey]).substring(0, 20)),
            datasets: [{
                label: yKey,
                data: dataArr.slice(0, 50).map(d => d[yKey] || 0),
                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                borderColor: 'rgb(129, 140, 248)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: 'rgba(129, 140, 248, 0.9)',
            }],
        });
    };

    const handleExport = (format, source) => {
        const dataToExport = source === 'full' ? allRows : queryResult;
        if (!dataToExport?.length) return;
        let blob;
        const fileName = `parquet_${source}_${Date.now()}.${format}`;
        if (format === 'csv') {
            const keys = Object.keys(dataToExport[0]);
            const content = [keys.join(','), ...dataToExport.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
            blob = new Blob([content], { type: 'text/csv' });
        } else if (format === 'json') {
            blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const TABS = [
        { id: 'sql', icon: <FileTerminal size={18} />, label: 'SQL Voyager', sub: 'Query Engine' },
        { id: 'chart', icon: <BarChart2 size={18} />, label: 'Density Plots', sub: 'Visualization' },
        { id: 'schema', icon: <Info size={18} />, label: 'Struct Columns', sub: 'Schema Inspector' },
    ];

    const EXPORTS = [
        { fmt: 'xlsx', src: 'query', icon: <FileSpreadsheet size={22} className="text-emerald-400" />, label: 'Excel', sub: 'Query set' },
        { fmt: 'csv', src: 'full', icon: <Database size={22} className="text-blue-400" />, label: 'CSV', sub: 'Full data' },
        { fmt: 'json', src: 'query', icon: <FileJson size={22} className="text-amber-400" />, label: 'JSON', sub: 'Query set' },
        { fmt: 'xlsx', src: 'full', icon: <Layers size={22} className="text-indigo-400" />, label: 'Excel', sub: 'Full data' },
    ];

    return (
        <ToolWorkspace
            tool={tool || { name: 'Parquet Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".parquet"
            results={results}
            onReset={() => { files.forEach(f => removeFile(f.id)); setPqData(null); setAllRows(null); }}
            layout="research"
            sidebarTitle="PARQUET_ENGINE"
            sidebar={
                <div className="pq-sidebar">
                    {/* Navigation */}
                    <div>
                        <div className="pq-sidebar-label">View Mode</div>
                        <div className="pq-nav-list">
                            {TABS.map(t => (
                                <button
                                    key={t.id}
                                    className={`pq-nav-btn ${activeTab === t.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(t.id)}
                                >
                                    <span className="pq-nav-icon">{t.icon}</span>
                                    <span className="pq-nav-text">
                                        <span className="pq-nav-title">{t.label}</span>
                                        <span className="pq-nav-sub">{t.sub}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Buffered Export */}
                    {pqData && (
                        <div className="pq-export-section">
                            <div className="pq-sidebar-label">Buffered Export</div>
                            <div className="pq-export-grid">
                                {EXPORTS.map((x, i) => (
                                    <button key={i} className="pq-export-btn" onClick={() => handleExport(x.fmt, x.src)}>
                                        {x.icon}
                                        <div className="pq-export-text">
                                            <div className="pq-export-title">{x.label}</div>
                                            <div className="pq-export-sub">{x.sub}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="pq-container h-full flex flex-col">
                {!pqData ? (
                    /* Empty State */
                    <div className="pq-empty">
                        <Database size={72} strokeWidth={1} className="text-slate-600" />
                        <div>
                            <p className="pq-empty-title">Registry Null</p>
                            <p className="pq-empty-sub">Mount a .parquet volume for columnar inspection</p>
                        </div>
                        {error && (
                            <div className="pq-error-badge">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col gap-5">

                        {/* SQL TAB */}
                        {activeTab === 'sql' && (
                            <div className="flex flex-col h-full gap-5">
                                <div className="pq-sql-editor">
                                    <textarea
                                        className="pq-sql-textarea"
                                        value={sqlQuery}
                                        onChange={e => setSqlQuery(e.target.value)}
                                        spellCheck={false}
                                        rows={3}
                                        placeholder="SELECT * FROM data LIMIT 50"
                                    />
                                    <div className="pq-sql-footer">
                                        <button className="pq-run-btn" onClick={handleRunQuery}>
                                            <Zap size={15} /> Run Query
                                        </button>
                                        <div className="pq-stats-bar">
                                            <span>Limit</span>
                                            <select value={displayLimit} onChange={e => setDisplayLimit(Number(e.target.value))}>
                                                {[10, 50, 100, 500, 1000].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                            <div className="pq-stats-sep" />
                                            <span>Showing {Math.min(queryResult.length, displayLimit)} of {allRows?.length?.toLocaleString()} rows</span>
                                        </div>
                                    </div>
                                    {queryError && (
                                        <div className="pq-error-badge" style={{ marginTop: 12 }}>
                                            <AlertCircle size={14} /> {queryError}
                                        </div>
                                    )}
                                </div>

                                <div className="pq-table-container flex-grow">
                                    <div className="pq-table-scroll">
                                        {queryResult.length > 0 ? (
                                            <table className="pq-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: 48, textAlign: 'center', color: '#334155' }}>#</th>
                                                        {Object.keys(queryResult[0]).map(k => <th key={k}>{k}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {queryResult.slice(0, displayLimit).map((row, i) => (
                                                        <tr key={i}>
                                                            <td style={{ textAlign: 'center', color: '#334155', fontSize: 9 }}>{i + 1}</td>
                                                            {Object.keys(queryResult[0]).map(k => (
                                                                <td key={k}>{String(row[k] ?? 'NULL')}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="pq-table-empty">No results — run a query above</div>
                                        )}
                                    </div>
                                    {queryResult.length > displayLimit && (
                                        <div className="pq-table-footer">
                                            {queryResult.length - displayLimit} more rows hidden · increase limit to view
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CHART TAB */}
                        {activeTab === 'chart' && (
                            <div className="flex flex-col h-full gap-5">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <BarChart2 size={22} className="text-primary-500" />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 900, color: 'white' }}>Column Distribution</div>
                                            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>First numeric column · up to 50 rows</div>
                                        </div>
                                    </div>
                                    <span className="pq-schema-type-badge">Bar Chart</span>
                                </div>

                                <div className="pq-chart-wrapper">
                                    {chartDataState ? (
                                        <Bar
                                            data={chartDataState}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false },
                                                    tooltip: {
                                                        backgroundColor: 'rgba(2, 6, 23, 0.95)',
                                                        borderColor: 'rgba(99,102,241,0.3)',
                                                        borderWidth: 1,
                                                        titleColor: '#a5b4fc',
                                                        bodyColor: '#e2e8f0',
                                                        padding: 12,
                                                        cornerRadius: 10,
                                                    },
                                                },
                                                scales: {
                                                    x: {
                                                        grid: { display: false },
                                                        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10, weight: '700' } },
                                                        border: { color: 'rgba(255,255,255,0.06)' },
                                                    },
                                                    y: {
                                                        grid: { color: 'rgba(255,255,255,0.04)', lineWidth: 1 },
                                                        ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 10, weight: '700' } },
                                                        border: { color: 'rgba(255,255,255,0.06)', dash: [4, 4] },
                                                    },
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2, gap: 12 }}>
                                            <AlertCircle size={40} className="text-slate-500" />
                                            <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>No numeric dimension detected</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SCHEMA TAB */}
                        {activeTab === 'schema' && (
                            <div className="h-full overflow-auto no-scrollbar">
                                <div className="pq-schema-grid">
                                    {pqData.metadata.schema.filter(c => c.name !== 'schema').map((col, idx) => (
                                        <div key={idx} className="pq-schema-card">
                                            <div className="pq-schema-card-header">
                                                <div>
                                                    <div style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, color: '#475569', marginBottom: 4 }}>Column</div>
                                                    <div className="pq-schema-col-name">{col.name}</div>
                                                </div>
                                                <span className="pq-schema-type-badge">{col.type || 'STRUCT'}</span>
                                            </div>
                                            {columnStats[col.name] && (
                                                <div className="pq-schema-stats">
                                                    <div className="pq-schema-stat">
                                                        <div className="pq-schema-stat-label">Null count</div>
                                                        <div className="pq-schema-stat-value">{columnStats[col.name].nullCount}</div>
                                                    </div>
                                                    <div className="pq-schema-stat">
                                                        <div className="pq-schema-stat-label">Cardinality</div>
                                                        <div className="pq-schema-stat-value">{columnStats[col.name].uniqueCount}</div>
                                                    </div>
                                                    <div className="pq-schema-stat full">
                                                        <div className="pq-schema-stat-label">Value range</div>
                                                        <div className="pq-schema-stat-value">{columnStats[col.name].min} → {columnStats[col.name].max}</div>
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
