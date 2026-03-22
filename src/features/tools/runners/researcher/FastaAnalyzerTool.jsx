import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseFASTAStream } from '../../../../services/researcher/fastaService';
import ToolWorkspace from '../common/ToolWorkspace';
import './FastaAnalyzerTool.css'; // Will reuse similar classes

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FastaAnalyzerTool = ({ tool, onFilesAdded }) => {
    const { files, addFiles, removeFile } = useFileList();
    const [stats, setStats] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (files.length > 0) {
            processFile(files[0].file);
        } else {
            setStats(null);
            setProgress(0);
            setError('');
        }
    }, [files]);

    const processFile = async (fileObj) => {
        setIsProcessing(true);
        setError('');
        setProgress(0);
        
        try {
            const result = await parseFASTAStream(fileObj, (fraction) => {
                setProgress(Math.round(fraction * 100));
            });
            setStats(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
            setProgress(100);
        }
    };

    const handleFilesSelected = (newFiles) => {
        addFiles(newFiles);
        if (typeof onFilesAdded === 'function') onFilesAdded(newFiles);
    };

    const handleExportData = (format) => {
        if (!stats) return;
        
        let content = "";
        
        if (format === 'csv') {
            content = "Metric,Value\n";
            content += `Total Sequences,${stats.totalSequences}\n`;
            content += `Total Bases,${stats.totalBases}\n`;
            content += `GC Content (%),${stats.gcContent.toFixed(2)}\n`;
            content += "\nSequence Length,Count\n";
            stats.lengthData.forEach(d => {
                content += `${d.length},${d.count}\n`;
            });
        } else if (format === 'txt') {
            content += "=== FASTA ANALYSIS REPORT ===\n\n";
            content += `Total Sequences:  ${stats.totalSequences.toLocaleString()}\n`;
            content += `Total Bases:      ${stats.totalBases.toLocaleString()}\n`;
            content += `Overall GC (%):   ${stats.gcContent.toFixed(2)}%\n\n`;
            content += "--- Sequence Length Distribution ---\n";
            stats.lengthData.forEach(d => {
                content += `Length ${String(d.length).padStart(6, ' ')}:  Count ${d.count.toLocaleString()}\n`;
            });
        }

        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `fasta_analysis_report.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getLengthChartData = () => {
        if (!stats) return null;
        
        // If there are too many unique lengths, we should bin them to avoid crashing Chart.js
        let displayData = [...stats.lengthData];
        if (displayData.length > 100) {
            // Very simple downsampling by showing top 100 lengths (simplistic binning)
            displayData = displayData.sort((a,b) => b.count - a.count).slice(0, 100).sort((a,b) => a.length - b.length);
        }

        return {
            labels: displayData.map(d => d.length),
            datasets: [
                {
                    label: 'Sequence Count by Length',
                    data: displayData.map(d => d.count),
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }
            ]
        };
    };

    return (
        <ToolWorkspace
            tool={tool || { name: 'FASTA Analyzer' }}
            files={files.map((f) => f.file)}
            onFilesSelected={handleFilesSelected}
            accept=".fasta,.fa,.fna"
            multiple={false}
            layout="research"
            sidebarTitle="FASTA Analyzer"
            sidebar={
                <div className="fasta-sidebar">
                    {files[0] && (
                        <div className="stat-card d-flex align-items-center justify-content-between">
                            <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                                <span className="stat-label">Loaded File</span>
                                <span className="stat-value" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {files[0].file.name}
                                </span>
                            </div>
                            <button className="btn-remove-ocean" onClick={() => removeFile(files[0].id)} aria-label="Remove file">
                                ×
                            </button>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    {isProcessing && (
                        <div className="processing-indicator">
                            <p>Processing: {progress}%</p>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {stats && !isProcessing && (
                        <div className="stats-panel">
                            <h4>Overview Statistics</h4>
                            <div className="stat-card">
                                <span className="stat-label">Total Sequences</span>
                                <span className="stat-value">{stats.totalSequences.toLocaleString()}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Total Bases</span>
                                <span className="stat-value">{stats.totalBases.toLocaleString()}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">GC Content</span>
                                <span className="stat-value">{stats.gcContent.toFixed(2)}%</span>
                            </div>
                            <div className="export-actions" style={{ marginTop: '20px' }}>
                                <h4>Export Report</h4>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button className="btn-secondary w-full" onClick={() => handleExportData('csv')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                        <Download size={16} /> .CSV
                                    </button>
                                    <button className="btn-secondary w-full" onClick={() => handleExportData('txt')} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                        <Download size={16} /> .TXT
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="fasta-main" style={{ height: '100%' }}>
                {!stats && !isProcessing && (
                    <div className="empty-state">
                        <p>Upload a .fasta, .fa, or .fna file to generate analysis.</p>
                    </div>
                )}
                {stats && !isProcessing && (
                    <div className="visualization-container">
                        <div className="chart-wrapper">
                            <Bar
                                data={getLengthChartData()}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { title: { display: true, text: 'Sequence Length Distribution' } },
                                    scales: {
                                        y: { beginAtZero: true, title: { display: true, text: 'Count' } },
                                        x: { title: { display: true, text: 'Sequence Length (bp)' } }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};

export default FastaAnalyzerTool;
