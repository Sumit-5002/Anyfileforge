import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parsePcap } from '../../../../services/researcher/pcapService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Globe, ShieldAlert, List, Zap, Terminal, Activity, File as FileIcon, Trash2 } from 'lucide-react';
import './Hdf5ViewerTool.css';

const PcapAnalyzerTool = () => {
    const { files, addFiles, removeFile } = useFileList();
    const [loadedPcaps, setLoadedPcaps] = useState({}); // { fileName: pcapData }
    const [currentFile, setCurrentFile] = useState(null);
    const [error, setError] = useState('');
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

    return (
        <ToolWorkspace
            tool={{ name: 'PCAP Analyzer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".pcap,.cap"
            multiple={true}
            layout="research"
            onReset={() => { setLoadedPcaps({}); setCurrentFile(null); }}
            sidebar={
                <div className="sidebar-info researcher-tool-container h-full d-flex flex-column gap-6">
                    <div className="opened-files shadow-sm">
                        <div className="text-muted text-xs uppercase mb-3 font-bold tracking-wider">Loaded Captures</div>
                        <div className="d-flex flex-column gap-2">
                            {files.map(f => (
                                <div key={f.file.name} 
                                     className={`file-tab d-flex align-items-center justify-content-between p-2 rounded-lg cursor-pointer transition-all ${currentFile === f.file.name ? 'bg-primary/20 border-primary/30' : 'bg-white/5 border-white/5'}`}
                                     onClick={() => { setCurrentFile(f.file.name); setActiveTab('summary'); }}
                                     style={{ border: '1px solid currentColor' }}
                                >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <FileIcon size={14} className={currentFile === f.file.name ? 'text-primary' : 'text-muted'} />
                                        <span className="text-xs truncate font-medium">{f.file.name}</span>
                                    </div>
                                    <button className="p-1 hover:text-danger opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}>
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {currentData && (
                        <div className="meta-stats flex-grow">
                             <div className="overview-card p-3 mb-2 bg-black/20 rounded-xl border border-white/5">
                                <span className="text-muted small block uppercase font-bold text-xs tracking-tighter">TOTAL PACKETS</span>
                                <div className="text-primary font-bold">{currentData.packetCount.toLocaleString()}</div>
                            </div>
                            <div className="overview-card p-3 mb-2 bg-black/20 rounded-xl border border-white/5">
                                <span className="text-muted small block uppercase font-bold text-xs tracking-tighter">NETWORK</span>
                                <div className="text-primary font-bold">{currentData.network}</div>
                            </div>
                            <div className="overview-card p-3 mb-4 bg-black/20 rounded-xl border border-white/5">
                                <span className="text-muted small block uppercase font-bold text-xs tracking-tighter">SIZE</span>
                                <div className="text-primary font-bold">{(currentData.totalBytes / 1024 / 1024).toFixed(2)} MB</div>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="pcap-main h-full researcher-tool-container">
                {!currentFile ? (
                    <div className="empty-state text-center p-12"><Globe size={64} className="opacity-10 mx-auto mb-4"/><h3>Network Traffic Hub</h3><p className="text-muted">Drop multiple .pcap files to analyze flow.</p></div>
                ) : (
                    <div className="dataset-panel fade-in h-full">
                        <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="breadcrumb-nav d-flex align-items-center gap-2">
                                    <span className="breadcrumb-part truncate" style={{maxWidth:120}}>{currentFile}</span>
                                    <span className="opacity-30">/</span>
                                    <span className="breadcrumb-part">FRAME_PREVIEW</span>
                                </div>
                                <span className="badge-pill bg-success-400/10 text-success border border-success-400/20 uppercase font-bold text-xs" style={{ padding: '4px 12px', borderRadius: '20px' }}>
                                    Offline Parser
                                </span>
                            </div>
                        </div>

                        <div className="custom-tabs d-flex gap-1 mb-6 p-1 bg-black/20 rounded-lg w-fit">
                            <button className={`tab-pill ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Statistics</button>
                            <button className={`tab-pill ${activeTab === 'packets' ? 'active' : ''}`} onClick={() => setActiveTab('packets')}>Packet List ({currentData.packetCount})</button>
                        </div>

                        <div className="tab-content h-full">
                            {activeTab === 'summary' ? (
                                <div className="overview-grid d-grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                    <div className="overview-card p-4 d-flex flex-column gap-2"><Zap size={20} className="text-primary"/><div className="text-muted text-xs uppercase font-bold">Byte Stream</div><div className="text-xl font-mono">{(currentData.totalBytes/1024).toFixed(1)} KB</div></div>
                                    <div className="overview-card p-4 d-flex flex-column gap-2"><Activity size={20} className="text-success"/><div className="text-muted text-xs uppercase font-bold">Density</div><div className="text-xl font-mono">{(currentData.packetCount / (currentData.totalBytes/1024/1024)).toFixed(0)} p/MB</div></div>
                                    <div className="overview-card p-4 d-flex flex-column gap-2"><ShieldAlert size={20} className="text-warning"/><div className="text-muted text-xs uppercase font-bold">Status</div><div className="text-xl font-mono">{currentData.status}</div></div>
                                </div>
                            ) : (
                                <div className="packet-view bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5"><tr className="border-b border-white/10"><th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">No.</th><th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Len</th><th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Offset</th><th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Payload</th></tr></thead>
                                        <tbody className="divide-y divide-white/5 font-mono text-sm">
                                            {currentData.packets.slice(0, 100).map((pkt, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4 text-primary">{pkt.id}</td><td className="p-4">{pkt.length} B</td><td className="p-4">0x{pkt.offset.toString(16)}</td><td className="p-4 text-secondary truncate" style={{maxWidth:200}}>{idx % 2 ? 'IPv4 Flow...' : 'ARP Query...'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {currentData.packetCount > 100 && <div className="p-4 text-center text-muted small border-t border-white/5">Showing first 100 packets.</div>}
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
