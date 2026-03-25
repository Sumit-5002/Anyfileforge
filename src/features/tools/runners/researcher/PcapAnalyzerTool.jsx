import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parsePcap } from '../../../../services/researcher/pcapService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Globe, ShieldAlert, Zap, Activity, File as FileIcon, Database, Terminal, Network } from 'lucide-react';
import './PcapAnalyzerTool.css';

const csvEscape = (value) => {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
};

const downloadBlob = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const payloadPreview = (hex = '', limit = 96) => {
    if (!hex) return '';
    if (hex.length <= limit) return hex;
    return `${hex.slice(0, limit)}…`;
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
        const fileName = `${currentFile}_analysis.${format}`;
        if (format === 'csv') {
            const header = 'ID,Timestamp,Length,Protocol,Source,Destination,PayloadPreview\n';
            const rows = currentData.packets
                .map(p => [p.id, p.timestamp, p.length, p.protocol || 'N/A', p.source || 'N/A', p.destination || 'N/A', p.payloadHex?.substring(0, 50) || ''].map(csvEscape).join(','))
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
                <div className="pcap-sidebar">
                    {/* File list */}
                    <div>
                        <div className="pcap-sidebar-label">Traffic Archives</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {files.map(f => (
                                <button
                                    key={f.file.name}
                                    className={`pcap-file-tab ${currentFile === f.file.name ? 'active' : ''}`}
                                    onClick={() => { setCurrentFile(f.file.name); setActiveTab('summary'); }}
                                >
                                    <FileIcon size={14} style={{ flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Export */}
                    {currentData && (
                        <div className="pcap-export-section">
                            <div className="pcap-sidebar-label">Extraction Service</div>
                            <div className="pcap-export-grid">
                                <button className="pcap-export-btn" onClick={() => handleExport('csv')}>
                                    <Database size={22} className="text-blue-400" />
                                    <div className="pcap-export-label">CSV</div>
                                    <div className="pcap-export-sub">All packets</div>
                                </button>
                                <button className="pcap-export-btn" onClick={() => handleExport('json')}>
                                    <Terminal size={22} className="text-amber-400" />
                                    <div className="pcap-export-label">JSON</div>
                                    <div className="pcap-export-sub">Full dump</div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="pcap-panel">
                {!currentFile ? (
                    /* Empty state */
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2, padding: 80, textAlign: 'center', textTransform: 'uppercase' }}>
                        <Globe size={80} strokeWidth={1} style={{ marginBottom: 24, color: '#64748b' }} />
                        <p style={{ fontSize: '1.5rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-1px', margin: '0 0 8px' }}>Ingress Null</p>
                        <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: '#475569', margin: 0 }}>Inject .pcap streams for forensic packet inspection</p>
                    </div>
                ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div className="pcap-tab-row">
                                <button className={`pcap-tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                                    Metrics
                                </button>
                                <button className={`pcap-tab-btn ${activeTab === 'packets' ? 'active' : ''}`} onClick={() => setActiveTab('packets')}>
                                    Packets ({currentData.packetCount})
                                </button>
                            </div>
                            <div className="pcap-network-badge">
                                <Network size={12} style={{ color: '#6366f1' }} />
                                {currentData.network} Stack
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
                            {activeTab === 'summary' ? (
                                /* Metric cards */
                                <div className="pcap-metric-grid">
                                    <div className="pcap-metric-card">
                                        <div className="pcap-metric-glow" style={{ background: 'rgba(99,102,241,0.15)' }} />
                                        <div className="pcap-metric-label">
                                            <Zap size={13} /> Throughput
                                        </div>
                                        <div className="pcap-metric-value" style={{ color: '#818cf8' }}>
                                            {(currentData.totalBytes / 1024).toFixed(1)}
                                            <span className="pcap-metric-unit">KB</span>
                                        </div>
                                    </div>
                                    <div className="pcap-metric-card">
                                        <div className="pcap-metric-glow" style={{ background: 'rgba(52,211,153,0.12)' }} />
                                        <div className="pcap-metric-label">
                                            <Activity size={13} /> Frequency
                                        </div>
                                        <div className="pcap-metric-value" style={{ color: '#34d399' }}>
                                            {currentData.packetCount}
                                            <span className="pcap-metric-unit">PKTS</span>
                                        </div>
                                    </div>
                                    <div className="pcap-metric-card">
                                        <div className="pcap-metric-glow" style={{ background: 'rgba(251,191,36,0.1)' }} />
                                        <div className="pcap-metric-label">
                                            <ShieldAlert size={13} /> Status
                                        </div>
                                        <div className="pcap-metric-value" style={{ color: '#fbbf24', fontSize: '1.2rem' }}>
                                            {currentData.status}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Packet table */
                                <div className="pcap-table-container">
                                    <div className="pcap-table-wrap">
                                        <table className="pcap-packet-table">
                                            <colgroup>
                                                <col className="pcap-col-seq" />
                                                <col className="pcap-col-time" />
                                                <col className="pcap-col-size" />
                                                <col className="pcap-col-payload" />
                                            </colgroup>
                                            <thead>
                                                <tr>
                                                    <th className="pcap-th">SEQ</th>
                                                    <th className="pcap-th">Timestamp</th>
                                                    <th className="pcap-th">Size</th>
                                                    <th className="pcap-th">Payload Stream</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentData.packets.slice(0, 500).map(pkt => (
                                                    <tr key={pkt.id}>
                                                        <td className="pcap-td" style={{ color: '#334155', fontSize: 9 }}>{pkt.id}</td>
                                                        <td className="pcap-td">{pkt.timestamp}</td>
                                                        <td className="pcap-td" style={{ color: 'white', fontWeight: 900 }}>{pkt.length} B</td>
                                                        <td className="pcap-td pcap-td-payload" title={pkt.payloadHex}>
                                                            {payloadPreview(pkt.payloadHex)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {currentData.packetCount > 500 && (
                                        <div className="pcap-table-footer">
                                            Stream truncated · showing first 500 of {currentData.packetCount.toLocaleString()} packets
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
