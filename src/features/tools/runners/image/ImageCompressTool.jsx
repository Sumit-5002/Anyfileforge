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
    const [completed, setCompleted] = useState(false);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        setCompleted(false);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const quality = LEVELS.find(l => l.id === level).quality;
            for (const f of files) {
                const blob = tool.mode === 'server'
                    ? await serverProcessingService.compressImage(f, { quality: Math.round(quality * 100), format: 'jpeg' })
                    : await imageService.convertImage(f, 'image/jpeg', quality);

                const baseName = f.name.replace(/\.[^/.]+$/, '');
                imageService.downloadBlob(blob, `${baseName}_compressed.jpg`);
            }
            setCompleted(true);
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
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFiles([]); setCompleted(false); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Compress Images"
            sidebar={
                <div className="sidebar-levels">
                    <label className="sidebar-label">Compression Level</label>
                    <div className="levels-vertical">
                        {LEVELS.map(l => (
                            <button
                                key={l.id}
                                type="button"
                                className={`level-box ${level === l.id ? 'active' : ''}`}
                                onClick={() => setLevel(l.id)}
                                aria-pressed={level === l.id}
                            >
                                <span className="level-icon">{l.icon}</span>
                                <div className="level-meta">
                                    <div className="level-name">{l.name}</div>
                                    <div className="level-desc">{l.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <ImageIcon size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        {completed && <div className="status-badge">Compressed!</div>}
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} aria-label={`Remove ${file.name}`}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageCompressTool;
