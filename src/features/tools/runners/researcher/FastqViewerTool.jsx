import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseFASTQStream } from '../../../../services/researcher/fastqService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Activity, BarChart3, Binary, Dna, FileText, Trash2, File as FileIcon, Loader2 } from 'lucide-react';
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

import './Hdf5ViewerTool.css'; // Reuse premium researcher base styles

const FastqViewerTool = () => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedStats, setLoadedStats] = useState({}); // { fileName: statsData }
    const [currentFile, setCurrentFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('quality'); // 'quality', 'length', 'base'

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
                        setProgress(0);
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
        let content = format === 'csv' ? "Metric,Value\n" : "=== FASTQ QC REPORT ===\n\n";
        
        const metrics = [
            ["Total Sequences", activeStats.totalSequences.toLocaleString()],
            ["Total Bases", activeStats.totalBases.toLocaleString()],
            ["GC Content (%)", activeStats.gcContent.toFixed(2) + "%"]
        ];

        metrics.forEach(([k, v]) => {
            content += format === 'csv' ? `${k},${v}\n` : `${k}: ${v}\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${currentFile}_qc.${format}`; a.click();
    };

    return (
        <ToolWorkspace
            tool={{ name: 'FASTQ QC Analyzer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".fastq,.fq"
            multiple={true}
            layout="research"
            onReset={() => { setLoadedStats({}); setCurrentFile(null); }}
            sidebar={
                <div className="sidebar-info researcher-tool-container h-full d-flex flex-column gap-6">
                    <div className="opened-files shadow-sm">
                        <div className="text-muted text-xs uppercase mb-3 font-bold tracking-wider">Sequencing Libraries</div>
                        <div className="d-flex flex-column gap-2">
                            {files.map(f => (
                                <div key={f.file.name} 
                                     className={`file-tab d-flex align-items-center justify-content-between p-2 rounded-lg cursor-pointer transition-all ${currentFile === f.file.name ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/5'}`}
                                     style={{ border: '1px solid currentColor' }}
                                     onClick={() => setCurrentFile(f.file.name)}
                                >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <Dna size={14} className={currentFile === f.file.name ? 'text-primary' : 'text-muted'} />
                                        <span className="text-xs truncate font-medium">{f.file.name}</span>
                                    </div>
                                    <button className="p-1 hover:text-danger opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl animation-pulse">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <Loader2 size={16} className="spinning text-primary" />
                                <span className="text-xs font-bold text-primary">ANALYZING DNA {progress}%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {activeStats && (
                        <div className="quick-stats-card p-4 bg-black/20 border border-white/5 rounded-xl">
                            <h5 className="text-xs uppercase font-bold text-muted mb-4">Library Summary</h5>
                            <div className="d-flex flex-column gap-3">
                                <div className="d-flex justify-content-between text-sm"><span className="text-muted">Sequences:</span><span className="font-mono">{activeStats.totalSequences.toLocaleString()}</span></div>
                                <div className="d-flex justify-content-between text-sm"><span className="text-muted">Bases:</span><span className="font-mono">{activeStats.totalBases.toLocaleString()}</span></div>
                                <div className="d-flex justify-content-between text-sm"><span className="text-muted">GC Content:</span><span className="font-mono text-primary font-bold">{activeStats.gcContent.toFixed(2)}%</span></div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5 d-flex gap-2">
                                <button className="btn-secondary flex-1 py-2 text-xs" onClick={() => handleExport('csv')}><Download size={12}/> CSV</button>
                                <button className="btn-secondary flex-1 py-2 text-xs" onClick={() => handleExport('txt')}><Download size={12}/> TXT</button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="fastq-main researcher-tool-container h-full">
                {!currentFile ? (
                    <div className="empty-state text-center p-12">
                        <Binary size={64} className="opacity-10 mx-auto mb-4" />
                        <h3>Bioinformatics Sequence QC</h3>
                        <p className="text-muted">Drop FASTQ files to perform phred quality analysis and GC content distribution.</p>
                        {error && <div className="mt-4 p-3 bg-danger/10 text-danger rounded-lg text-sm">{error}</div>}
                    </div>
                ) : !activeStats ? (
                    <div className="empty-state text-center p-12">
                        <Loader2 size={48} className="spinning opacity-10 mx-auto mb-4" />
                        <p>Processing genomic data... {progress}%</p>
                    </div>
                ) : (
                    <div className="dataset-panel fade-in h-full d-flex flex-column">
                        <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="breadcrumb-nav d-flex align-items-center gap-2">
                                    <span className="breadcrumb-part truncate" style={{maxWidth:180}}>{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="breadcrumb-part">GENOME_QC</span>
                                </div>
                                <div className="badge-pill bg-primary/10 text-primary border border-primary/20 uppercase font-bold text-xs" style={{ padding: '4px 12px', borderRadius: '20px' }}>
                                    Illumina / Sanger
                                </div>
                            </div>
                        </div>

                        <div className="custom-tabs d-flex gap-1 mb-6 p-1 bg-black/20 rounded-lg w-fit">
                            <button className={`tab-pill ${activeTab === 'quality' ? 'active' : ''}`} onClick={() => setActiveTab('quality')}><Activity size={14}/> Per-Base Quality</button>
                            <button className={`tab-pill ${activeTab === 'length' ? 'active' : ''}`} onClick={() => setActiveTab('length')}><BarChart3 size={14}/> Length Dist.</button>
                        </div>

                        <div className="tab-content flex-grow">
                            {activeTab === 'quality' && (
                                <div className="chart-container h-full bg-black/20 p-6 rounded-2xl border border-white/5 shadow-2xl" style={{ height: '450px' }}>
                                    <Line 
                                        data={{
                                            labels: activeStats.meanQualities.map((_, i) => i + 1),
                                            datasets: [{
                                                label: 'Mean Phred Quality Score',
                                                data: activeStats.meanQualities,
                                                borderColor: '#3b82f6',
                                                backgroundColor: (context) => {
                                                    const ctx = context.chart.ctx;
                                                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                                                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                                                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                                                    return gradient;
                                                },
                                                fill: true,
                                                tension: 0.4,
                                                pointRadius: (ctx) => ctx.dataIndex % 5 === 0 ? 3 : 0,
                                                borderWidth: 3
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                    padding: 12,
                                                    titleFont: { size: 14, family: 'JetBrains Mono' },
                                                    bodyFont: { size: 13, family: 'Inter' },
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                    borderWidth: 1
                                                }
                                            },
                                            scales: {
                                                y: { 
                                                    beginAtZero: true, 
                                                    suggestedMax: 40, 
                                                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                                    ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
                                                    title: { display: true, text: 'PHRED QUALITY SCORE (Q)', color: 'rgba(255,255,255,0.6)', font: { size: 10, weight: 'bold' } }
                                                },
                                                x: { 
                                                    grid: { display: false }, 
                                                    ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
                                                    title: { display: true, text: 'POSITION IN READ (BP)', color: 'rgba(255,255,255,0.6)', font: { size: 10, weight: 'bold' } }
                                                }
                                            }
                                        }}
                                    />
                                    <div className="mt-4 d-flex gap-4">
                                        <div className="d-flex align-items-center gap-2"><div className="w-3 h-3 rounded-sm bg-success-500"></div><span className="text-xs text-muted">Q30+ (Excellent)</span></div>
                                        <div className="d-flex align-items-center gap-2"><div className="w-3 h-3 rounded-sm bg-warning-500"></div><span className="text-xs text-muted">Q20-Q30 (Acceptable)</span></div>
                                        <div className="d-flex align-items-center gap-2"><div className="w-3 h-3 rounded-sm bg-danger-500"></div><span className="text-xs text-muted">{'< Q20 (Poor)'}</span></div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'length' && (
                                <div className="chart-container h-full bg-black/20 p-6 rounded-2xl border border-white/5" style={{ height: '450px' }}>
                                    <Bar 
                                        data={{
                                            labels: activeStats.lengthData.map(d => d.length),
                                            datasets: [{
                                                label: 'Sequence Count',
                                                data: activeStats.lengthData.map(d => d.count),
                                                backgroundColor: '#10b981',
                                                borderRadius: 4,
                                                hoverBackgroundColor: '#34d399'
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)' } },
                                                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)' } }
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
