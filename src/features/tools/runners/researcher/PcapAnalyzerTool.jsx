import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parsePcap } from '../../../../services/researcher/pcapService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Globe, ShieldAlert, List, Zap, Terminal, Activity } from 'lucide-react';
import './Hdf5ViewerTool.css'; // Shared premium researcher styles

const PcapAnalyzerTool = () => {
    const { files, addFiles } = useFileList();
    const [pcapData, setPcapData] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        if (files.length > 0) {
            loadFile(files[0].file);
        } else {
            setPcapData(null);
            setError('');
        }
    }, [files]);

    const loadFile = async (fileObj) => {
        try {
            setError('');
            const data = await parsePcap(fileObj);
            setPcapData(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleExportSummary = () => {
        if (!pcapData) return;
        const content = `PCAP Analysis Summary\n====================\nPackets: ${pcapData.packetCount}\nNetwork: ${pcapData.network}\nSize: ${(pcapData.totalBytes / 1024 / 1024).toFixed(2)} MB\n`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'pcap_analysis_report.txt'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ToolWorkspace
            tool={{ name: 'PCAP Analyzer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".pcap,.cap"
            onReset={() => { setPcapData(null); setError(''); }}
            sidebar={
                <div className="sidebar-info h-full d-flex flex-column">
                    <div className="text-secondary text-xs uppercase mb-4 font-bold letter-spacing-1">Capture Stats</div>
                    {pcapData && (
                        <div className="meta-stats flex-grow">
                             <div className="overview-card p-3 mb-2">
                                <span className="text-muted small block">Total Packets</span>
                                <div className="text-primary font-bold">{pcapData.packetCount.toLocaleString()}</div>
                            </div>
                            <div className="overview-card p-3 mb-2">
                                <span className="text-muted small block">Network Type</span>
                                <div className="text-primary font-bold">{pcapData.network}</div>
                            </div>
                            
                            <div className="export-actions mt-auto pt-6 border-t border-white/5">
                                <button className="btn-secondary w-full d-flex align-items-center justify-content-center gap-2" onClick={handleExportSummary}>
                                    <Download size={14} /> Download Report (.txt)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="pcap-main h-full">
                {!pcapData ? (
                    <div className="empty-state text-center p-12">
                        <Globe size={64} style={{ opacity: 0.1, margin: '0 auto 16px' }} />
                        <h3>Network Capture Analyzer</h3>
                        <p className="text-muted max-w-sm mx-auto">Analyze .pcap and .cap traffic files directly in your browser without sending data to servers.</p>
                        {error && <div className="error-badge mt-4 text-danger bg-danger/10 p-2 rounded">{error}</div>}
                    </div>
                ) : (
                    <div className="dataset-panel fade-in h-full">
                         <div className="dataset-header mb-6">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="breadcrumb-nav d-flex align-items-center gap-2">
                                    <span className="breadcrumb-part">CAPTURE_FILE</span>
                                    <span className="opacity-30">/</span>
                                    <span className="breadcrumb-part">FRAME_PREVIEW</span>
                                </div>
                                <div className="badge-pill bg-success-400/10 text-success border border-success-400/20 uppercase font-bold text-xs" style={{ padding: '4px 12px', borderRadius: '20px' }}>
                                    Live Analysis
                                </div>
                            </div>
                        </div>

                        <div className="custom-tabs d-flex gap-1 mb-6 p-1 bg-black/20 rounded-lg w-fit">
                            <button className={`tab-pill ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Statistics</button>
                            <button className={`tab-pill ${activeTab === 'packets' ? 'active' : ''}`} onClick={() => setActiveTab('packets')}>Packet List</button>
                        </div>

                        <div className="tab-content h-full">
                            {activeTab === 'summary' && (
                                <div className="overview-grid d-grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                    <div className="dataset-panel p-4 flex flex-column gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <Zap size={20} className="text-primary" />
                                        <div className="text-muted text-xs uppercase font-bold">Byte Stream</div>
                                        <div className="text-xl font-mono">{(pcapData.totalBytes / 1024).toFixed(1)} KB</div>
                                    </div>
                                    <div className="dataset-panel p-4 flex flex-column gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <Activity size={20} className="text-success" />
                                        <div className="text-muted text-xs uppercase font-bold">Packet Density</div>
                                        <div className="text-xl font-mono">{(pcapData.packetCount / (pcapData.totalBytes / 1024 / 1024)).toFixed(0)} pkt/MB</div>
                                    </div>
                                    <div className="dataset-panel p-4 flex flex-column gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <ShieldAlert size={20} className="text-warning" />
                                        <div className="text-muted text-xs uppercase font-bold">Verified Traffic</div>
                                        <div className="text-xl font-mono">{pcapData.status}</div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'packets' && (
                                <div className="packet-view bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/10 bg-white/5">
                                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">No.</th>
                                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Length</th>
                                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Offset</th>
                                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted">Payload</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 font-mono">
                                            {pcapData.packets.map((pkt, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4 text-primary text-sm">{pkt.id}</td>
                                                    <td className="p-4 text-sm">{pkt.length} B</td>
                                                    <td className="p-4 text-sm">0x{pkt.offset.toString(16)}</td>
                                                    <td className="p-4 text-sm text-secondary">--- RAW DATA ---</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
