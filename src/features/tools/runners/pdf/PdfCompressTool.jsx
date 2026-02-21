import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileText, Zap, CheckCircle2, ShieldCheck, Settings } from 'lucide-react';
import '../common/ToolWorkspace.css';

const LEVELS = [
    { id: 'extreme', name: 'Extreme', desc: 'Max compression, lower quality', quality: 30, icon: <Zap size={18} /> },
    { id: 'recommended', name: 'Recommended', desc: 'Balanced results', quality: 60, icon: <CheckCircle2 size={18} /> },
    { id: 'less', name: 'Less', desc: 'High Quality, minimal compression', quality: 85, icon: <ShieldCheck size={18} /> }
];

function PdfCompressTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [level, setLevel] = useState('recommended');
    const [processing, setProcessing] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        setProcessing(true);
        setCompletedCount(0);
        try {
            const quality = LEVELS.find(l => l.id === level).quality;
            const CONCURRENCY_LIMIT = 3;

            // Process files in parallel chunks to speed up batch compression (Bolt ⚡)
            for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
                const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
                await Promise.allSettled(chunk.map(async (f) => {
                    try {
                        const data = tool.mode === 'server'
                            ? await serverProcessingService.compressPDF(f, { quality })
                            : await pdfService.rewritePDF(f);
                        pdfService.downloadPDF(data, f.name.replace('.pdf', '_compressed.pdf'));
                    } catch (error) {
                        console.error(`Failed to compress ${f.name}:`, error);
                    }
                }));
                // Update progress after each chunk to reduce re-renders (Bolt ⚡)
                setCompletedCount(prev => Math.min(files.length, prev + chunk.length));
            }
        } finally {
            setProcessing(false);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFiles([]); setCompletedCount(0); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Compress Now"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group">
                        <Settings size={14} />
                        <label>Compression Mode</label>
                    </div>
                    <div className="levels-vertical mt-2">
                        {LEVELS.map(l => (
                            <div
                                key={l.id}
                                className={`level-box ${level === l.id ? 'active' : ''}`}
                                onClick={() => setLevel(l.id)}
                                aria-pressed={level === l.id}
                            >
                                <span className="level-icon">{l.icon}</span>
                                <div className="level-meta">
                                    <div className="level-name">{l.name}</div>
                                    <div className="level-desc">{l.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="tool-help mt-4">
                        Offline compression performs a "rewrite" which removes unused objects and optimizes streams.
                    </div>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <FileText size={24} className={`${i < completedCount ? 'text-success' : 'text-danger'}`} />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        {i < completedCount && <div className="status-badge">Done!</div>}
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default PdfCompressTool;
