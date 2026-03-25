import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parsePcap } from '../../../../services/researcher/pcapService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Globe, ShieldAlert, Zap, Activity, File as FileIcon, Search, Database, Download, Terminal, Network, ListFilter } from 'lucide-react';
import './PcapAnalyzerTool.css';

const csvEscape = (value) => {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
};

const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const payloadPreview = (hex = '', limit = 96) => {
    if (!hex) return '';
    if (hex.length <= limit) return hex;
    return `${hex.slice(0, limit)}...`;
};

const PcapAnalyzerTool = ({ onFilesAdded }) => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedPcaps, setLoadedPcaps] = useState({}); 
    const [currentFile, setCurrentFile] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        const loadPcapFiles = async () => {
            const nextLoaded = { ...loadedPcaps };
            let lastAdded = null;
            for (const f of files) {
                if (!nextLoaded[f.file.name]) {
                    try {
                        const data = await parsePcap(f.file);
                        nextLoaded[f.file.name] = data;
                        lastAdded = f.file.name;
                    } catch (e) { console.error(e); }
                }
            }
            const currentNames = files.map(f => f.file.name);
            Object.keys(nextLoaded).forEach(name => { if (!currentNames.includes(name)) delete nextLoaded[name]; });
            setLoadedPcaps(nextLoaded);
            if (lastAdded) setCurrentFile(lastAdded);
            else if (currentFile && !currentNames.includes(currentFile)) setCurrentFile(currentNames[0] || null);
        };
        loadPcapFiles();
    }, [files]);

    const currentData = currentFile ? loadedPcaps[currentFile] : null;

    const handleExport = (format) => {
        if (!currentData) return;
        let blob;
        let fileName = `${currentFile}_analysis.${format}`;

        if (format === 'csv') {
            const header = 'ID,Timestamp,Length,Protocol,Source,Destination,PayloadPreview\n';
            const rows = currentData.packets
                .map((p) => [
                    p.id,
                    p.timestamp,
                    p.length,
                    p.protocol || 'N/A',
                    p.source || 'N/A',
                    p.destination || 'N/A',
                    p.payloadHex?.substring(0, 50) || ''
                ].map(csvEscape).join(','))
                .join('\n');
            blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
        } else if (format === 'json') {
            blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json;charset=utf-8' });
        }

        if (!blob) return;
        downloadBlob(blob, fileName);

    };

    return (
        <ToolWorkspace
            tool={{ name: 'PCAP Analyzer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".pcap,.cap"
            multiple={true}
            layout="research"
            onReset={() => { files.forEach(f => removeFile(f.id)); setLoadedPcaps({}); setCurrentFile(null); }}
            sidebarTitle="WIRE_SENTRY"
            sidebar={
                <div className="pcap-sidebar h-full flex flex-col gap-8">
                    <div className="section">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Traffic_Archives</div>
                        <div className="flex flex-col gap-2">
                             {files.map(f => (
                                <button key={f.file.name} 
                                     className={`p-4 rounded-2xl flex items-center gap-4 transition-all border text-left overflow-hidden ${currentFile === f.file.name ? 'bg-primary-500 border-primary-400 text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                                     onClick={() => { setCurrentFile(f.file.name); setActiveTab('summary'); }}
                                >
                                    <FileIcon size={16} />
                                    <span className="text-[11px] font-black uppercase truncate">{f.file.name}</span>
                                </button>
                             ))}
                        </div>
                    </div>

                    {currentData && (
                    <div className="section mt-auto">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Extraction_Service</div>
                            <div className="pcap-export-grid">
                                <button className="pcap-export-btn" onClick={() => handleExport('csv')}>
                                    <Database size={20} className="text-primary-400 group-hover:scale-110 transition-transform"/>
                                    <span className="text-[8px] font-black uppercase">CSV_EXPORT</span>
                                </button>
                                <button className="pcap-export-btn" onClick={() => handleExport('json')}>
                                    <Terminal size={20} className="text-amber-400 group-hover:scale-110 transition-transform"/>
                                    <span className="text-[8px] font-black uppercase">JSON_DUMP</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="pcap-panel h-full flex flex-col">
                {!currentFile ? (
                   <div className="empty-state h-full flex items-center justify-center flex-col opacity-20 p-20 text-center uppercase">
                        <Globe size={80} className="mb-6 stroke-1 text-slate-500"/>
                        <p className="text-2xl font-black italic tracking-tighter mb-2">Ingress_Null</p>
                        <p className="text-[9px] font-black tracking-[3px] text-slate-500">Inject .pcap streams for forensic DPI.</p>
                   </div>
                ) : (
                    <div className="dataset-panel fade-in h-grow flex flex-col gap-6 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="pcap-tab-row">
                                <button className={`pcap-tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>METRICS</button>
                                <button className={`pcap-tab-btn ${activeTab === 'packets' ? 'active' : ''}`} onClick={() => setActiveTab('packets')}>PACKETS ({currentData.packetCount})</button>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-2 bg-black/40 border border-white/5 rounded-full">
                                <Network size={12} className="text-primary-500"/>
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{currentData.network} Stack</span>
                            </div>
                        </div>

                        <div className="flex-grow min-h-0">
                            {activeTab === 'summary' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-slate-900/60 p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
                                         <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[60px] rounded-full"></div>
                                         <div className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-widest flex items-center gap-2"><Zap size={14}/> THROUGHPUT</div>
                                         <div className="text-3xl font-mono text-primary-400 font-black">{(currentData.totalBytes/1024).toFixed(1)} <span className="text-sm opacity-40">KB</span></div>
                                    </div>
                                    <div className="bg-slate-900/60 p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
                                         <div className="absolute top-0 right-0 w-32 h-32 bg-success-500/10 blur-[60px] rounded-full"></div>
                                         <div className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-widest flex items-center gap-2"><Activity size={14}/> FREQUENCY</div>
                                         <div className="text-3xl font-mono text-emerald-400 font-black">{currentData.packetCount} <span className="text-sm opacity-40">PKTS</span></div>
                                    </div>
                                    <div className="bg-slate-900/60 p-8 rounded-[32px] border border-white/10 relative overflow-hidden group md:col-span-2 lg:col-span-1">
                                         <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full"></div>
                                         <div className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-widest flex items-center gap-2"><ShieldAlert size={14}/> STATUS</div>
                                         <div className="text-xl font-mono text-amber-500/80 font-black italic">{currentData.status}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full bg-black/40 rounded-[40px] border border-white/5 shadow-inner overflow-hidden flex flex-col">
                                    <div className="overflow-auto no-scrollbar flex-grow pcap-table-wrap">
                                        <table className="w-full text-left font-mono text-[10px] border-separate border-spacing-0 pcap-packet-table">
                                            <colgroup>
                                                <col className="pcap-col-seq" />
                                                <col className="pcap-col-time" />
                                                <col className="pcap-col-size" />
                                                <col className="pcap-col-payload" />
                                            </colgroup>
                                            <thead className="bg-slate-950 sticky top-0 z-10 border-b border-white/10">
                                                <tr>
                                                    <th className="p-4 px-6 text-primary-500/60 font-black uppercase tracking-widest border-b border-white/5 pcap-th">SEQ</th>
                                                    <th className="p-4 px-6 text-primary-500/60 font-black uppercase tracking-widest border-b border-white/5 pcap-th">TIMESTAMP</th>
                                                    <th className="p-4 px-6 text-primary-500/60 font-black uppercase tracking-widest border-b border-white/5 pcap-th">SIZE</th>
                                                    <th className="p-4 px-6 text-primary-500/60 font-black uppercase tracking-widest border-b border-white/5 pcap-th">PAYLOAD_STREAM</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {currentData.packets.slice(0, 500).map((pkt) => (
                                                    <tr key={pkt.id} className="hover:bg-primary-500/5 transition-colors group">
                                                        <td className="p-4 px-6 text-slate-500 font-bold pcap-td">{pkt.id}</td>
                                                        <td className="p-4 px-6 text-slate-400 pcap-td">{pkt.timestamp}</td>
                                                        <td className="p-4 px-6 text-white font-black pcap-td">{pkt.length} B</td>
                                                        <td className="p-4 px-6 text-slate-500 text-[9px] tracking-tight group-hover:text-primary-300 leading-normal pcap-td pcap-td-payload" title={pkt.payloadHex}>
                                                            {payloadPreview(pkt.payloadHex)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {currentData.packetCount > 500 && (
                                        <div className="p-4 text-center bg-slate-950/50 border-t border-white/5 text-[9px] font-black uppercase text-slate-600 tracking-[3px]">
                                            STREAM_OVERFLOW: VIEW TRUNCATED TO FIRST 500 CHUNKS
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};

export default PcapAnalyzerTool;
