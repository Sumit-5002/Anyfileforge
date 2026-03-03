import React, { useState, useCallback } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import { ImageIcon, Settings } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageFromJpgTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [format, setFormat] = useState('image/png');
    const [quality, setQuality] = useState('0.9');

    const extension = format === 'image/webp' ? 'webp' : 'png';

    const processFile = useCallback(async ({ file }) => {
        const normalizedQuality = Math.min(1, Math.max(0.1, Number(quality) || 0.9));
        const blob = tool.mode === 'server'
            ? await serverProcessingService.convertImage(file, {
                format: format.replace('image/', '')
            })
            : await imageService.convertImage(file, format, normalizedQuality);

        imageService.downloadBlob(blob, `${getBaseName(file.name)}.${extension}`);
    }, [tool.mode, format, quality, extension]);

    const {
        files,
        toolFiles,
        processing,
        progress,
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
        return <FileUploader tool={tool} onFilesSelected={onFilesSelected} multiple={true} accept="image/jpeg" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={toolFiles}
            onFilesSelected={onFilesSelected}
            onReset={reset}
            processing={processing}
            progress={progress}
            onProcess={processFiles}
            actionLabel="Convert Images"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group mb-3">
                        <Settings size={14} />
                        <label>Conversion Options</label>
                    </div>
                    <div className="tool-field">
                        <label>Target Format</label>
                        <select value={format} onChange={(e) => setFormat(e.target.value)}>
                            <option value="image/png">PNG (Lossless)</option>
                            <option value="image/webp">WebP (Modern)</option>
                        </select>
                    </div>
                    <div className="tool-field">
                        <label>Quality ({Math.round(quality * 100)}%)</label>
                        <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(e) => setQuality(e.target.value)} />
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
                        {completedIds.has(id) && <div className="status-badge">Converted!</div>}
                        {failedIds.has(id) && <div className="status-badge error">Error</div>}
                        <button className="btn-icon-danger" onClick={() => removeFile(id)} disabled={processing}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageFromJpgTool;
