import React, { useState, useCallback } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import { ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import '../common/ToolWorkspace.css';

function ImageToJpgTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [quality, setQuality] = useState(0.9);

    const processFile = useCallback(async ({ file }) => {
        const blob = tool.mode === 'server'
            ? await serverProcessingService.convertImage(file, {
                quality: Math.round(quality * 100),
                format: 'jpeg'
            })
            : await imageService.convertImage(file, 'image/jpeg', quality);

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        imageService.downloadBlob(blob, `${baseName}.jpg`);
    }, [tool.mode, quality]);

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

    const onFilesSelected = useCallback((newFiles) => {
        handleFilesSelected(newFiles);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    }, [handleFilesSelected, parentOnFilesAdded]);

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

export default ImageToJpgTool;
