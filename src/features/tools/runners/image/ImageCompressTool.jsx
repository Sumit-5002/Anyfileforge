import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { ImageIcon, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';
import '../common/ToolWorkspace.css';

const LEVELS = [
    { id: 'low', name: 'Extreme', desc: 'Max compression', quality: 0.3, icon: <Zap size={18} /> },
    { id: 'medium', name: 'Recommended', desc: 'Balanced', quality: 0.6, icon: <CheckCircle2 size={18} /> },
    { id: 'high', name: 'High Quality', desc: 'Less compression', quality: 0.9, icon: <ShieldCheck size={18} /> }
];

function ImageCompressTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [level, setLevel] = useState('medium');
    const [processing, setProcessing] = useState(false);
    const [completedIds, setCompletedIds] = useState(new Set());

    const handleFilesSelected = (newFiles) => {
        const wrapped = newFiles.map(f => ({
            id: crypto.randomUUID(),
            file: f
        }));
        setFiles(prev => [...prev, ...wrapped]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        setProcessing(true);
        setCompletedIds(new Set());
        try {
            const quality = LEVELS.find(l => l.id === level).quality;
            const CONCURRENCY_LIMIT = 5;

            // Parallel batch processing with concurrency limit to optimize performance (Bolt ⚡)
            for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
                const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
                await Promise.allSettled(chunk.map(async ({ id, file }) => {
                    try {
                        const blob = tool.mode === 'server'
                            ? await serverProcessingService.compressImage(file, { quality: Math.round(quality * 100), format: 'jpeg' })
                            : await imageService.convertImage(file, 'image/jpeg', quality);

                        const baseName = file.name.replace(/\.[^/.]+$/, '');
                        imageService.downloadBlob(blob, `${baseName}_compressed.jpg`);
                        setCompletedIds(prev => new Set(prev).add(id));
                    } catch (error) {
                        console.error(`Failed to compress ${file.name}:`, error);
                    }
                }));
            }
        } finally {
            setProcessing(false);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} accept="image/*" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files.map(f => f.file)}
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFiles([]); setCompletedIds(new Set()); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Compress Images"
            sidebar={
                <div className="sidebar-levels">
                    <label className="sidebar-label">Compression Level</label>
                    <div className="levels-vertical">
                        {LEVELS.map(l => (
                            <div
                                key={l.id}
                                className={`level-box ${level === l.id ? 'active' : ''}`}
                                onClick={() => setLevel(l.id)}
                            >
                                <span className="level-icon">{l.icon}</span>
                                <div className="level-meta">
                                    <div className="level-name">{l.name}</div>
                                    <div className="level-desc">{l.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map(({ id, file }) => (
                    <div key={id} className="file-item-horizontal">
                        <ImageIcon size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        {completedIds.has(id) && <div className="status-badge">Compressed!</div>}
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter(f => f.id !== id))}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageCompressTool;
