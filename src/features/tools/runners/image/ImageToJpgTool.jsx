import React, { useState, useMemo } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import '../common/ToolWorkspace.css';

function ImageToJpgTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [quality, setQuality] = useState(0.9);
    const [processing, setProcessing] = useState(false);
    const [completedIds, setCompletedIds] = useState(new Set());
    const [failedIds, setFailedIds] = useState(new Set());

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
        setFailedIds(new Set());
        try {
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
                        imageService.downloadBlob(blob, `${baseName}.jpg`);
                        setCompletedIds(prev => new Set(prev).add(id));
                    } catch (error) {
                        console.error(`Failed to convert ${file.name}:`, error);
                        setFailedIds(prev => new Set(prev).add(id));
                    }
                }));
            }
        } finally {
            setProcessing(false);
        }
    };

    // Memoize the file objects passed to ToolWorkspace to prevent redundant renders (Bolt ⚡)
    const toolFiles = useMemo(() => files.map(f => f.file), [files]);

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} accept="image/*" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={toolFiles}
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFiles([]); setCompletedIds(new Set()); setFailedIds(new Set()); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Convert to JPG"
            sidebar={
                <div className="sidebar-info">
                    <label className="sidebar-label">Conversion Quality</label>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={quality}
                        onChange={e => setQuality(Number(e.target.value))}
                        className="w-full"
                    />
                    <div className="d-flex justify-content-between mt-1 text-muted small">
                        <span>Low</span>
                        <span>{Math.round(quality * 100)}%</span>
                        <span>High</span>
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
                        {completedIds.has(id) && <div className="status-badge text-success"><CheckCircle size={14} /> Converted!</div>}
                        {failedIds.has(id) && <div className="status-badge text-danger"><AlertCircle size={14} /> Failed</div>}
                        <button className="btn-icon-danger" onClick={() => setFiles(prev => prev.filter(f => f.id !== id))}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageToJpgTool;
