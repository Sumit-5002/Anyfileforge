import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
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
import ToolWorkspace from '../common/ToolWorkspace';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseNetCDF, getVariableData } from '../../../../services/researcher/netcdfService';
import { Layers, FileText, Info } from 'lucide-react';
import './NetCdfViewerTool.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const NetCdfViewerTool = () => {
    const { files, addFiles } = useFileList();
    const [ncData, setNcData] = useState(null);
    const [selectedVar, setSelectedVar] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (files.length > 0) {
            loadFile(files[0].file);
        } else {
            setNcData(null);
            setSelectedVar(null);
            setChartData(null);
            setError('');
        }
    }, [files]);

    const loadFile = async (fileObj) => {
        try {
            setError('');
            const arrayBuffer = await fileObj.arrayBuffer();
            const parsed = parseNetCDF(arrayBuffer);
            setNcData(parsed);
            
            // Automatically select the first 1D numeric variable to show something
            const defaultVar = parsed.variables.find(v => v.dimensions.length === 1 && v.size > 0);
            if (defaultVar) {
                handleSelectVar(defaultVar.name, parsed);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSelectVar = (varName, dataOverrides = null) => {
        try {
            const dataToUse = dataOverrides || ncData;
            if (!dataToUse || !dataToUse.reader) return;
            
            setSelectedVar(varName);
            const variableInfo = dataToUse.variables.find(v => v.name === varName);
            const rawData = getVariableData(dataToUse.reader, varName);
            
            // Basic plotting implementation for 1D arrays
            if (variableInfo.dimensions.length === 1) {
                // If it's too large, downsample it for browser performance
                let displayData = Array.from(rawData);
                const MAX_POINTS = 1000;
                
                if (displayData.length > MAX_POINTS) {
                    const step = Math.ceil(displayData.length / MAX_POINTS);
                    displayData = displayData.filter((_, i) => i % step === 0);
                }

                setChartData({
                    labels: displayData.map((_, i) => i + 1),
                    datasets: [
                        {
                            label: varName,
                            data: displayData,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',
                            tension: 0.1
                        }
                    ]
                });
            } else {
                // Not supported fallback
                setChartData(null);
            }
        } catch (err) {
            setError('Could not plot variable. ' + err.message);
            setChartData(null);
        }
    };

    const handleExportData = (format) => {
        if (!selectedVar || !chartData) return;
        
        const dataLength = chartData.labels.length;
        let content = "";
        
        if (format === 'csv') {
            content = "Index,Value\n";
            for (let i = 0; i < dataLength; i++) {
                content += `${chartData.labels[i]},${chartData.datasets[0].data[i]}\n`;
            }
        } else if (format === 'txt') {
            content = `Variable: ${selectedVar}\n------------------------\n`;
            for (let i = 0; i < dataLength; i++) {
                content += `[${chartData.labels[i]}] = ${chartData.datasets[0].data[i]}\n`;
            }
        }

        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedVar}_export.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <ToolWorkspace
            tool={{ name: 'NetCDF Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".nc"
            dropzoneLabel="Drop your .nc file here"
            dropzoneHint="NetCDF visualization with 100% browser privacy"
            onReset={() => { setNcData(null); setSelectedVar(null); setChartData(null); setError(''); }}
            sidebar={
                <div className="sidebar-info">
                    {ncData && (
                        <>
                            <div className="nc-stats">
                                <h4 style={{ color: 'var(--primary-500)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>File Info</h4>
                                <div className="stat-item d-flex justify-content-between mb-2">
                                    <span>Variables:</span>
                                    <strong>{ncData.variables.length}</strong>
                                </div>
                                <div className="stat-item d-flex justify-content-between mb-2">
                                    <span>Dimensions:</span>
                                    <strong>{ncData.dimensions.length}</strong>
                                </div>
                            </div>

                            <div className="nc-variables-list mt-6">
                                <h4 style={{ color: 'var(--primary-500)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>Variables</h4>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {ncData.variables.map(v => (
                                        <li 
                                            key={v.name}
                                            className={selectedVar === v.name ? 'active' : ''}
                                            onClick={() => handleSelectVar(v.name)}
                                            style={{ 
                                                padding: '10px', 
                                                borderRadius: '8px', 
                                                cursor: 'pointer',
                                                background: selectedVar === v.name ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                border: selectedVar === v.name ? '1px solid var(--primary-500)' : '1px solid transparent',
                                                marginBottom: '8px'
                                            }}
                                        >
                                            <div className="var-name" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v.name}</div>
                                            <div className="var-meta" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {v.dimensions.join(' x ') || 'scalar'} | {v.type}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {selectedVar && chartData && (
                                <div className="export-actions mt-6">
                                    <h4 style={{ color: 'var(--primary-500)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>Export</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <button className="btn-secondary" onClick={() => handleExportData('csv')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                            <Download size={14} /> .CSV
                                        </button>
                                        <button className="btn-secondary" onClick={() => handleExportData('txt')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                            <Download size={14} /> .TXT
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {error && <div className="error-message mt-4" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
                </div>
            }
        >
            <div className="netcdf-main" style={{ minHeight: '500px' }}>
                {!ncData ? (
                    <div className="empty-state text-center p-8">
                        <Layers size={64} style={{ opacity: 0.1, margin: '0 auto 16px' }} />
                        <p className="text-muted">Upload a .nc file to view its dimensions and variables.</p>
                    </div>
                ) : (
                    <div className="discovery-view fade-in">
                        {selectedVar ? (
                            <div className="variable-analysis">
                                <div className="panel-header d-flex align-items-center gap-3 mb-6">
                                    <FileText className="text-primary" />
                                    <h2 style={{ margin: 0 }}>{selectedVar}</h2>
                                </div>
                                
                                {chartData ? (
                                    <div className="chart-wrapper mb-8" style={{ height: '350px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <Line 
                                            data={chartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: { display: false },
                                                    title: { display: false }
                                                },
                                                scales: {
                                                    y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                                                    x: { grid: { display: false } }
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="unsupported-var alert alert-info mb-6">
                                        Selected variable cannot be plotted. Currently optimized for 1-dimensional numeric arrays.
                                    </div>
                                ) }
                                
                                <div className="data-preview mt-8">
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Data Values <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>(First 500)</span></h3>
                                    <div className="data-table-container" style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.04)' }}>
                                                <tr>
                                                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Index</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {chartData?.datasets[0].data.slice(0, 500).map((v, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{i}</td>
                                                        <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary-400)' }}>{v}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-selection p-12 text-center">
                                <Info size={48} className="text-secondary opacity-25 mb-4 mx-auto" />
                                <p>Select a variable from the sidebar to inspect its values and metadata.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};

export default NetCdfViewerTool;
