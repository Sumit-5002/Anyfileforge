import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import FileDropzone from '../../../../components/tools/shared/FileDropzone';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseFASTQStream } from '../../../../services/researcher/fastqService';
import './FastqViewerTool.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FastqViewerTool = () => {
    const { files, addFiles } = useFileList();
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
            const result = await parseFASTQStream(fileObj, (fraction) => {
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

    const handleExportData = (format) => {
        if (!stats) return;
        
        let content = "";
        
        if (format === 'csv') {
            content = "Metric,Value\n";
            content += `Total Sequences,${stats.totalSequences}\n`;
            content += `Total Bases,${stats.totalBases}\n`;
            content += `GC Content (%),${stats.gcContent.toFixed(2)}\n`;
            content += "\nBase Position,Mean Quality (Phred)\n";
            stats.meanQualities.forEach((q, i) => {
                content += `${i + 1},${q.toFixed(2)}\n`;
            });
            content += "\nSequence Length,Count\n";
            stats.lengthData.forEach(d => {
                content += `${d.length},${d.count}\n`;
            });
        } else if (format === 'txt') {
            content += "=== FASTQ QC REPORT ===\n\n";
            content += `Total Sequences:  ${stats.totalSequences.toLocaleString()}\n`;
            content += `Total Bases:      ${stats.totalBases.toLocaleString()}\n`;
            content += `Overall GC (%):   ${stats.gcContent.toFixed(2)}%\n\n`;
            content += "--- Mean Quality Scores ---\n";
            stats.meanQualities.forEach((q, i) => {
                content += `Position ${String(i+1).padStart(3, ' ')}:  Phred ${q.toFixed(2)}\n`;
            });
        }

        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `fastq_qc_report.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getQualityChartData = () => {
        if (!stats) return null;
        return {
            labels: stats.meanQualities.map((_, i) => i + 1),
            datasets: [
                {
                    label: 'Mean Quality Score (Phred)',
                    data: stats.meanQualities,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    tension: 0.2,
                    pointRadius: 1
                }
            ]
        };
    };

    const getLengthChartData = () => {
        if (!stats) return null;
        return {
            labels: stats.lengthData.map(d => d.length),
            datasets: [
                {
                    label: 'Sequence Count by Length',
                    data: stats.lengthData.map(d => d.count),
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                }
            ]
        };
    };

    return (
        <div className="custom-tool-wrapper fade-in" style={{ height: '100%' }}>
            <div className="fastq-workspace">
                <div className="fastq-sidebar">
                    <h3>Input File</h3>
                    <FileDropzone
                        onFilesDrop={addFiles}
                        accept=".fastq,.fq"
                        multiple={false}
                        maxSize={1024 * 1024 * 1024} // 1GB
                    />

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

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
                
                <div className="fastq-main">
                    {!stats && !isProcessing && (
                        <div className="empty-state">
                            <p>Upload a .fastq or .fq file to generate QC reports.</p>
                        </div>
                    )}
                    
                    {stats && !isProcessing && (
                        <div className="visualization-container">
                            <div className="chart-wrapper">
                                <Line 
                                    data={getQualityChartData()}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { title: { display: true, text: 'Per-Base Sequence Quality' } },
                                        scales: {
                                            y: { beginAtZero: false, suggestedMin: 0, suggestedMax: 40 }
                                        }
                                    }}
                                />
                            </div>
                            <div className="chart-wrapper">
                                <Bar 
                                    data={getLengthChartData()}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { title: { display: true, text: 'Sequence Length Distribution' } }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FastqViewerTool;
