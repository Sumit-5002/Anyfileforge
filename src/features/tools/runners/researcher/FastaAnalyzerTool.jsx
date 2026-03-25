import React, { useState, useEffect } from 'react';
import { Download, Activity, BarChart3, Database, FileText, Share2, Search, Check, Copy, FileStack, Zap, Settings2 } from 'lucide-react';
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
import './FastaAnalyzerTool.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FastaAnalyzerTool = ({ tool, onFilesAdded }) => {
    const { files, addFiles, removeFile } = useFileList();
    const [stats, setStats] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState([]);

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
        }
    };

    const handleExportData = (format) => {
        if (!stats) return;
        let content = "";
        let fileName = `fasta_analytics.${format}`;
        
        if (format === 'csv') {
            content = "Metric,Value\n";
            content += `Total Sequences,${stats.totalSequences}\n`;
            content += `Total Bases,${stats.totalBases}\n`;
            content += `GC Content (%),${stats.gcContent.toFixed(4)}\n`;
            content += `N50,${stats.n50}\n`;
            content += `L50,${stats.l50}\n`;
            content += "\nLength,Count\n";
            stats.lengthData.forEach(d => content += `${d.length},${d.count}\n`);
        } else if (format === 'txt') {
            content += "=== FASTA GENOMIC ANALYSIS ===\n\n";
            content += `Total Sequences: ${stats.totalSequences.toLocaleString()}\n`;
            content += `Total Bases:     ${stats.totalBases.toLocaleString()}\n`;
            content += `GC Content:      ${stats.gcContent.toFixed(4)}%\n`;
            content += `N50 Assembly:    ${stats.n50.toLocaleString()} bp\n`;
            content += `L50 Contigs:     ${stats.l50.toLocaleString()}\n`;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        setResults(prev => [...prev, {
            id: `fasta-${Date.now()}`,
            name: fileName,
            data: blob,
            type: 'data'
        }]);
    };

    return (
        <ToolWorkspace
            tool={tool || { name: 'FASTA Analyzer' }}
            files={files.map((f) => f.file)}
            onFilesSelected={(newFiles) => { addFiles(newFiles); if (onFilesAdded) onFilesAdded(newFiles); }}
            accept=".fasta,.fa,.fna"
            multiple={false}
            layout="research"
            results={results}
            onReset={() => { files.forEach(f => removeFile(f.id)); setStats(null); setResults([]); }}
            sidebarTitle="FASTA_COMMAND"
            sidebar={
                <div className="fasta-sidebar p-2 flex flex-col gap-10">
                    {files[0] && (
                        <div className="section">
                            <div className="section-title text-[10px] uppercase font-black tracking-widest text-slate-500 mb-4">Atomic_Unit</div>
                            <div className="p-5 bg-white/5 border border-white/10 rounded-[24px] flex items-center justify-between group hover:border-primary-500/30 transition-all">
                                <div className="flex items-center gap-4 overflow-hidden">
                                     <div className="p-2.5 bg-primary-500/10 rounded-xl"><Activity size={18} className="text-primary-400"/></div>
                                     <span className="text-xs font-mono font-bold text-white truncate max-w-[120px]">{files[0].file.name}</span>
                                </div>
                                <button className="p-2 text-red-500/40 hover:text-red-500 transition-colors" onClick={() => removeFile(files[0].id)}>×</button>
                            </div>
                        </div>
                    )}

                    {stats && (
                        <div className="section flex-grow">
                            <div className="section-title text-[10px] uppercase font-black tracking-widest text-slate-500 mb-4">Metrics_Matrix</div>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="p-5 bg-black/40 rounded-[24px] border border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">GC_INTENSITY</div>
                                    <div className="text-2xl font-black italic tracking-tighter text-primary-400">{stats.gcContent.toFixed(2)}%</div>
                                </div>
                                <div className="p-5 bg-black/40 rounded-[24px] border border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">N50_ASSEMBLY</div>
                                    <div className="text-xl font-mono font-black text-emerald-400">{stats.n50.toLocaleString()}</div>
                                </div>
                                <div className="p-5 bg-black/40 rounded-[24px] border border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">L50_COUNT</div>
                                    <div className="text-xl font-mono font-black text-amber-400">{stats.l50.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="section-title text-[10px] uppercase font-black tracking-widest text-slate-500 mt-10 mb-4">Export_Signal</div>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase" onClick={() => handleExportData('csv')}><Download size={14}/> CSV_REPORT</button>
                                <button className="btn-secondary w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase" onClick={() => handleExportData('txt')}><Download size={14}/> TXT_REPORT</button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="fasta-main h-full p-4">
                {!stats && isProcessing && (
                    <div className="h-full flex flex-col items-center justify-center gap-6 opacity-40">
                         <Zap size={64} className="text-primary-500 animate-pulse"/>
                         <div className="text-center">
                            <p className="text-xl font-black italic tracking-tighter uppercase mb-2">Analyzing_Polymers</p>
                            <p className="text-[10px] font-black uppercase tracking-widest">Hydrating genome snapshot [{progress}%]</p>
                         </div>
                    </div>
                )}

                {stats && (
                    <div className="visualization-container h-full flex flex-col gap-8 animate-in fade-in">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <BarChart3 size={20} className="text-slate-500"/>
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Distribution_Function</span>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                <span className="text-[9px] font-black uppercase text-slate-400">Sample_Population: {stats.totalSequences.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="chart-wrapper flex-grow bg-black/40 p-10 rounded-[40px] border border-white/5 shadow-inner">
                            <Bar
                                data={{
                                    labels: stats.lengthData.slice(0, 50).map(d => d.length),
                                    datasets: [{
                                        label: 'Sequence Length Distribution',
                                        data: stats.lengthData.slice(0, 50).map(d => d.count),
                                        backgroundColor: '#3b82f6',
                                        borderRadius: 8,
                                        hoverBackgroundColor: '#60a5fa'
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: 'rgba(255,255,255,0.2)' } },
                                        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.2)' } }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {!stats && !isProcessing && (
                    <div className="empty-state h-full flex items-center justify-center flex-col opacity-20 p-20 text-center">
                         <Settings2 size={80} className="mb-6 stroke-1 text-slate-500"/>
                         <p className="text-2xl font-black italic tracking-tighter uppercase mb-2">Awaiting_Input</p>
                         <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-500">Mount .fasta volume for structural analysis.</p>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};

export default FastaAnalyzerTool;
