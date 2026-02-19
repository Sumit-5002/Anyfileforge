import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { ImageIcon, FileType } from 'lucide-react';
import '../common/ToolWorkspace.css';

function ImageToJpgTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [quality, setQuality] = useState(0.9);
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
            for (const f of files) {
                const blob = tool.mode === 'server'
                    ? await serverProcessingService.compressImage(f, { quality: Math.round(quality * 100), format: 'jpeg' })
                    : await imageService.convertImage(f, 'image/jpeg', quality);

                const baseName = f.name.replace(/\.[^/.]+$/, '');
                imageService.downloadBlob(blob, `${baseName}.jpg`);
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
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <ImageIcon size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        {completed && <div className="status-badge"><FileType size={14} /> Converted!</div>}
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageToJpgTool;
