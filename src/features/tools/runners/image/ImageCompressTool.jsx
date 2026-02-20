import React, { useState, useCallback } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import { ImageIcon, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';
import '../common/ToolWorkspace.css';

const LEVELS = [
    { id: 'low', name: 'Extreme', desc: 'Max compression', quality: 0.3, icon: <Zap size={18} /> },
    { id: 'medium', name: 'Recommended', desc: 'Balanced', quality: 0.6, icon: <CheckCircle2 size={18} /> },
    { id: 'high', name: 'High Quality', desc: 'Less compression', quality: 0.9, icon: <ShieldCheck size={18} /> }
];

function ImageCompressTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [level, setLevel] = useState('medium');

    const processFile = useCallback(async ({ file }) => {
        const quality = LEVELS.find(l => l.id === level).quality;
        const blob = tool.mode === 'server'
            ? await serverProcessingService.compressImage(file, { quality: Math.round(quality * 100), format: 'jpeg' })
            : await imageService.convertImage(file, 'image/jpeg', quality);

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        imageService.downloadBlob(blob, `${baseName}_compressed.jpg`);
    }, [tool.mode, level]);

    const {
        files,
        toolFiles,
        processing,
        completedIds,
        failedIds,
        handleFilesSelected,
        removeFile,
        reset,
        processFiles
    } = useParallelFileProcessor(processFile, 5);

    const onFilesSelected = (newFiles) => {
        handleFilesSelected(newFiles);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={onFilesSelected} multiple={true} accept="image/*" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={toolFiles}
            onFilesSelected={onFilesSelected}
            onReset={reset}
            processing={processing}
            onProcess={processFiles}
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
                        {failedIds.has(id) && <div className="status-badge error">Failed</div>}
                        <button
                            className="btn-icon-danger"
                            disabled={processing}
                            onClick={() => removeFile(id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageCompressTool;
