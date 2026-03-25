import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseFASTQStream } from '../../../../services/researcher/fastqService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Activity, BarChart3, Binary, Dna, FileText, Trash2, Loader2, Database, Zap } from 'lucide-react';
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
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './FastqViewerTool.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const FastqViewerTool = ({ tool }) => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedStats, setLoadedStats] = useState({});
    const [currentFile, setCurrentFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('quality');
    const [results, setResults] = useState([]);

    useEffect(() => {
        const processNewFiles = async () => {
            const nextLoaded = { ...loadedStats };
            let lastAdded = null;
            for (const f of files) {
                if (!nextLoaded[f.file.name]) {
                    setIsProcessing(true);
                    setError('');
                    try {
                        const stats = await parseFASTQStream(f.file, (p) => setProgress(Math.round(p * 100)));
                        nextLoaded[f.file.name] = stats;
                        lastAdded = f.file.name;
                    } catch (err) {
                        setError(`Failed to parse ${f.file.name}: ${err.message}`);
                    } finally {
                        setIsProcessing(false);
                    }
                }
            }
            const currentNames = files.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => {
                if (!currentNames.includes(name)) delete nextLoaded[name];
            });
            setLoadedStats(nextLoaded);
            if (lastAdded) setCurrentFile(lastAdded);
            else if (currentFile && !currentNames.includes(currentFile)) setCurrentFile(currentNames[0] || null);
        };
        processNewFiles();
    }, [files]);

    const activeStats = currentFile ? loadedStats[currentFile] : null;

    const handleExport = (format) => {
        if (!activeStats) return;
        let content = "";
        let fileName = `${currentFile.split('.')[0]}_qc.${format === 'raw_csv' ? 'csv' : format}`;

        if (format === 'csv') {
            content = "Metric,Value\n";
            content += `Total Sequences,${activeStats.totalSequences}\n`;
            content += `Total Bases,${activeStats.totalBases}\n`;
            content += `GC Content (%),${activeStats.gcContent.toFixed(4)}\n`;
        } else if (format === 'raw_csv') {
            content = "identifier,sequence,quality,length\n";
            activeStats.reads.forEach(r => {
                content += `"${r.id}","${r.seq}","${r.qual}",${r.len}\n`;
            });
            fileName = `${currentFile.split('.')[0]}_dataset.csv`;
        } else if (format === 'fasta') {
            activeStats.reads.forEach(r => {
                content += `>${r.id.substring(1)}\n${r.seq}\n`;
            });
            fileName = `${currentFile.split('.')[0]}.fasta`;
        } else {
            content = "=== FASTQ GENOMIC REPORT ===\n\n";
            content += `Sequences: ${activeStats.totalSequences.toLocaleString()}\n`;
            content += `Bases:     ${activeStats.totalBases.toLocaleString()}\n`;
            content += `GC (%):    ${activeStats.gcContent.toFixed(4)}%\n`;
        }

        const blob = new Blob([content], { type: format === 'raw_csv' ? 'text/csv' : 'text/plain' });
        setResults(prev => [...prev, { id: `fastq-${Date.now()}`, name: fileName, data: blob, type: 'data' }]);
    };

    return (
        <ToolWorkspace
            tool={tool || { name: 'FASTQ QC Analyzer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".fastq,.fq"
            multiple={true}
            layout="research"
            results={results}
            onReset={() => { files.forEach(f => removeFile(f.id)); setLoadedStats({}); setCurrentFile(null); setResults([]); }}
            sidebarTitle="FASTQ_TERMINAL"
            sidebar={
                <div className="fq-sidebar">
                    {/* Sample Registry */}
                    <div className="fq-section">
                        <div className="fq-section-title">Sample_Registry</div>
                        <div className="fq-file-list">
                            {files.map(f => (
                                <div
                                    key={f.file.name}
                                    className={`fq-file-item ${currentFile === f.file.name ? 'active' : ''}`}
                                    onClick={() => setCurrentFile(f.file.name)}
                                >
                                    <div className="fq-file-item-left">
                                        <Dna size={15} className={`fq-dna-icon ${currentFile === f.file.name ? 'active' : ''}`} />
                                        <span className="fq-file-name" title={f.file.name}>{f.file.name}</span>
                                    </div>
                                    <button
                                        className="fq-remove-btn"
                                        onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                                        aria-label="Remove file"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Processing */}
                    {isProcessing && (
                        <div className="fq-processing">
                            <div className="fq-processing-header">
                                <Loader2 size={15} className="fq-spinner" />
                                <span className="fq-processing-label">DECIPHERING_GENOME {progress}%</span>
                            </div>
                            <div className="fq-progress-track">
                                <div className="fq-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Pipeline Export */}
                    {activeStats && (
                        <div className="fq-section fq-export-section">
                            <div className="fq-section-title">Pipeline_Export</div>
                            <button className="fq-btn-commit" onClick={() => handleExport('raw_csv')}>
                                <Database size={15} />
                                COMMIT_BULK_DATASET
                            </button>
                            <div className="fq-export-grid">
                                <button className="fq-btn-fasta" onClick={() => handleExport('fasta')}>
                                    To_FASTA
                                </button>
                                <button className="fq-btn-qcreport" onClick={() => handleExport('csv')}>
                                    QC_Report
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="fq-main">
                {!currentFile ? (
                    <div className="fq-empty-state">
                        <Binary size={72} className="fq-empty-icon" />
                        <p className="fq-empty-title">Awaiting_Sequences</p>
                        <p className="fq-empty-sub">Mount .fastq / .fq datasets for Phred analysis.</p>
                    </div>
                ) : !activeStats ? (
                    <div className="fq-loading-state">
                        <Zap size={56} className="fq-loading-icon" />
                        <p className="fq-loading-label">Hydrating sequencing buffer [{progress}%]</p>
                    </div>
                ) : (
                    <div className="fq-dataset-panel">
                        {/* Tab bar */}
                        <div className="fq-toolbar">
                            <div className="fq-tabs">
                                <button
                                    className={`fq-tab fq-tab-phred ${activeTab === 'quality' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('quality')}
                                >
                                    <Activity size={13} />
                                    Mean_Phred
                                </button>
                                <button
                                    className={`fq-tab fq-tab-reads ${activeTab === 'reads' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('reads')}
                                >
                                    <FileText size={13} />
                                    Read_Matrix
                                </button>
                                <button
                                    className={`fq-tab fq-tab-distr ${activeTab === 'length' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('length')}
                                >
                                    <BarChart3 size={13} />
                                    Distr
                                </button>
                            </div>
                            <div className="fq-library-id">
                                <span className="fq-library-label">Library_Id</span>
                                <span className="fq-library-value" title={currentFile}>{currentFile}</span>
                                <span className="fq-library-dot" />
                            </div>
                        </div>

                        {/* Content area */}
                        <div className="fq-content-area">
                            {activeTab === 'quality' && (
                                <div className="fq-chart-wrap">
                                    <Line
                                        data={{
                                            labels: activeStats.meanQualities.map((_, i) => i + 1),
                                            datasets: [{
                                                label: 'Mean Phred Score',
                                                data: activeStats.meanQualities,
                                                borderColor: '#8b5cf6',
                                                backgroundColor: 'rgba(139, 92, 246, 0.07)',
                                                fill: true,
                                                tension: 0.3,
                                                pointRadius: 0,
                                                borderWidth: 2
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                y: { suggestedMax: 42, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.25)' } },
                                                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.25)' } }
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {activeTab === 'reads' && (
                                <div className="fq-table-wrap">
                                    <div className="fq-table-scroll">
                                        <table className="fq-table">
                                            <thead>
                                                <tr>
                                                    <th>id_identifier</th>
                                                    <th>chemical_sequence</th>
                                                    <th>score_buffer</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeStats.reads.slice(0, 50).map((r, i) => (
                                                    <tr key={i}>
                                                        <td className="fq-td-id">{r.id.substring(0, 20)}...</td>
                                                        <td className="fq-td-seq">{r.seq}</td>
                                                        <td className="fq-td-qual">{r.qual}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="fq-table-footer">
                                        Buffer snapshot: Displaying 50/{activeStats.totalSequences.toLocaleString()} regions.
                                        Use "COMMIT_BULK_DATASET" for full spectral export.
                                    </div>
                                </div>
                            )}

                            {activeTab === 'length' && (
                                <div className="fq-chart-wrap">
                                    <Bar
                                        data={{
                                            labels: activeStats.lengthData.map(d => d.length),
                                            datasets: [{
                                                label: 'Count',
                                                data: activeStats.lengthData.map(d => d.count),
                                                backgroundColor: '#3b82f6',
                                                borderRadius: 8
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.25)' } },
                                                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.25)' } }
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};

export default FastqViewerTool;
