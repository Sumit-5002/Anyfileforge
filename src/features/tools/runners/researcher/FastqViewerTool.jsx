import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseFASTQStream } from '../../../../services/researcher/fastqService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Activity, BarChart3, Binary, Dna, FileText, Trash2, File as FileIcon, Loader2, Database, Zap } from 'lucide-react';
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
        setResults(prev => [...prev, {
            id: `fastq-${Date.now()}`,
            name: fileName,
            data: blob,
            type: 'data'
        }]);
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
                <div className="fastq-sidebar p-2 flex flex-col gap-10">
                    <div className="section">
                        <div className="section-title text-[10px] uppercase font-black tracking-widest text-slate-500 mb-4">Sample_Registry</div>
                        <div className="flex flex-col gap-2">
                             {files.map(f => (
                                <div key={f.file.name} 
                                     className={`p-4 rounded-[20px] cursor-pointer border transition-all flex items-center justify-between group ${currentFile === f.file.name ? 'bg-primary-500/10 border-primary-500/30' : 'bg-white/5 border-white/5'}`}
                                     onClick={() => setCurrentFile(f.file.name)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Dna size={16} className={currentFile === f.file.name ? 'text-primary-400' : 'text-slate-500'} />
                                        <span className="text-[11px] font-bold text-white truncate max-w-[150px]">{f.file.name}</span>
                                    </div>
                                    <button className="p-2 text-red-500/40 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="p-6 bg-primary-500/5 border border-primary-500/10 rounded-[30px] animate-pulse">
                            <div className="flex items-center gap-2 mb-4">
                                <Loader2 size={16} className="text-primary-400 animate-spin" />
                                <span className="text-[10px] font-black uppercase text-primary-400">DECIPHERING_GENOME {progress}%</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {activeStats && (
                        <div className="section mt-auto">
                            <div className="section-title text-[10px] uppercase font-black tracking-widest text-slate-500 mb-6">Pipeline_Export</div>
                            <div className="flex flex-col gap-3">
                                <button 
                                    className="w-full py-5 bg-gradient-to-r from-primary-600 to-indigo-600 border-none rounded-[24px] text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                    onClick={() => handleExport('raw_csv')}
                                >
                                    <Database size={16}/> COMMIT_BULK_DATASET
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="py-4 bg-white/5 border border-white/5 rounded-[20px] text-[9px] font-black uppercase text-slate-400 hover:text-white" onClick={() => handleExport('fasta')}>
                                        To_FASTA
                                    </button>
                                    <button className="py-4 bg-white/5 border border-white/5 rounded-[20px] text-[9px] font-black uppercase text-slate-400 hover:text-white" onClick={() => handleExport('csv')}>
                                        QC_Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="fastq-main h-full p-4 flex flex-col gap-6">
                {!currentFile ? (
                    <div className="empty-state h-full flex items-center justify-center flex-col opacity-20 p-20 text-center uppercase">
                         <Binary size={80} className="mb-6 stroke-1 text-slate-500"/>
                         <p className="text-2xl font-black italic tracking-tighter mb-2">Awaiting_Sequences</p>
                         <p className="text-[9px] font-black tracking-[3px] text-slate-500">Mount .fastq / .fq datasets for Phred analysis.</p>
                    </div>
                ) : !activeStats ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6 opacity-40">
                         <Zap size={64} className="text-primary-500 animate-pulse"/>
                         <p className="text-[10px] font-black uppercase tracking-widest">Hydrating sequencing buffer [{progress}%]</p>
                    </div>
                ) : (
                    <div className="dataset-panel h-full flex flex-col gap-8 animate-in fade-in">
                        <div className="flex items-center justify-between px-4">
                             <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-white/5 rounded-[20px]">
                                <button className={`px-6 py-3 rounded-[16px] text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'quality' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('quality')}><Activity size={14}/> Mean_Phred</button>
                                <button className={`px-6 py-3 rounded-[16px] text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'reads' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('reads')}><FileText size={14}/> Read_Matrix</button>
                                <button className={`px-6 py-3 rounded-[16px] text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'length' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setActiveTab('length')}><BarChart3 size={14}/> Distr</button>
                             </div>
                             <div className="hidden lg:flex items-center gap-4">
                                 <div className="flex flex-col items-end">
                                     <span className="text-[9px] font-black uppercase text-slate-600 tracking-tighter">Library_Id</span>
                                     <span className="text-xs font-mono font-black text-white">{currentFile}</span>
                                 </div>
                                 <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                             </div>
                        </div>

                        <div className="flex-grow min-h-0 bg-black/40 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                             {activeTab === 'quality' && (
                                <div className="p-10 h-full">
                                    <Line 
                                        data={{
                                            labels: activeStats.meanQualities.map((_, i) => i + 1),
                                            datasets: [{
                                                label: 'Mean Phred Score',
                                                data: activeStats.meanQualities,
                                                borderColor: '#8b5cf6',
                                                backgroundColor: 'rgba(139, 92, 246, 0.05)',
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
                                                y: { suggestedMax: 42, grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: 'rgba(255,255,255,0.2)' } },
                                                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.2)' } }
                                            }
                                        }}
                                    />
                                </div>
                             )}

                             {activeTab === 'reads' && (
                                <div className="h-full flex flex-col p-4">
                                     <div className="flex-grow overflow-auto no-scrollbar rounded-[30px] border border-white/5">
                                         <table className="w-full text-left font-mono text-[9px] border-separate border-spacing-0">
                                             <thead className="bg-slate-900 sticky top-0 z-10">
                                                 <tr>
                                                     <th className="p-4 px-8 text-slate-600 font-black uppercase border-b border-white/5">id_identifier</th>
                                                     <th className="p-4 px-8 text-slate-600 font-black uppercase border-b border-white/5">chemical_sequence</th>
                                                     <th className="p-4 px-8 text-slate-600 font-black uppercase border-b border-white/5">score_buffer</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-white/[0.03]">
                                                 {activeStats.reads.slice(0, 50).map((r, i) => (
                                                     <tr key={i} className="hover:bg-primary-500/5 transition-colors group">
                                                         <td className="p-4 px-8 text-primary-400 font-bold">{r.id.substring(0, 20)}...</td>
                                                         <td className="p-4 px-8 text-slate-300 tracking-[1px] break-all max-w-lg">{r.seq}</td>
                                                         <td className="p-4 px-8 text-slate-600 break-all">{r.qual}</td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                     <div className="p-6 text-center">
                                         <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest italic leading-relaxed">
                                             Buffer snapshot: Displaying 50/{activeStats.totalSequences.toLocaleString()} regions. <br/> Use "COMMIT_BULK_DATASET" for full spectral export.
                                         </p>
                                     </div>
                                </div>
                             )}

                             {activeTab === 'length' && (
                                <div className="p-10 h-full">
                                    <Bar 
                                        data={{
                                            labels: activeStats.lengthData.map(d => d.length),
                                            datasets: [{
                                                label: 'Count',
                                                data: activeStats.lengthData.map(d => d.count),
                                                backgroundColor: '#3b82f6',
                                                borderRadius: 20
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
                             )}
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};

export default FastqViewerTool;
