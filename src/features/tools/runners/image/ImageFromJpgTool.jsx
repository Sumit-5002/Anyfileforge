import React, { useCallback, useEffect, useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import FileThumbnail from '../../../../components/tools/shared/FileThumbnail';
import { Settings, X } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageFromJpgTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [format, setFormat] = useState('image/png');
    const [quality, setQuality] = useState('0.9');
    const [preview, setPreview] = useState(null);

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

    const openPreview = useCallback((file) => {
        const url = URL.createObjectURL(file);
        setPreview((prev) => {
            if (prev?.url) URL.revokeObjectURL(prev.url);
            return { url, name: file.name };
        });
    }, []);

    const closePreview = useCallback(() => {
        setPreview((prev) => {
            if (prev?.url) URL.revokeObjectURL(prev.url);
            return null;
        });
    }, []);

    useEffect(() => {
        if (!preview) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') closePreview();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [preview, closePreview]);

    useEffect(() => () => {
        if (preview?.url) URL.revokeObjectURL(preview.url);
    }, [preview]);

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
            <div className="pages-grid image-pages-grid">
                {files.map(({ id, file }, idx) => (
                    <div key={id} className={`page-item-card ${completedIds.has(id) ? 'selected' : ''}`}>
                        <div className="page-item-preview image-page-preview">
                            <FileThumbnail file={file} className="w-full h-full rounded-none border-0 shadow-none" />
                            <button
                                className="page-view-btn"
                                type="button"
                                onClick={() => openPreview(file)}
                                title="View Full"
                                aria-label={`View ${file.name} full screen`}
                            >
                                View
                            </button>
                            <button
                                className="page-remove-btn"
                                type="button"
                                onClick={() => removeFile(id)}
                                disabled={processing}
                                title="Remove Image"
                                aria-label={`Remove ${file.name}`}
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="page-item-label image-page-label" title={file.name}>
                            <div className="image-page-index">Image {idx + 1}</div>
                            <div className="image-page-name">{file.name}</div>
                            {failedIds.has(id) && <div className="text-danger small">Failed</div>}
                        </div>
                    </div>
                ))}
            </div>

            {preview && (
                <div className="image-fullscreen-modal" role="dialog" aria-modal="true" aria-label="Image preview">
                    <button className="image-fullscreen-backdrop" type="button" onClick={closePreview} aria-label="Close full screen preview" />
                    <div className="image-fullscreen-content">
                        <div className="image-fullscreen-header">
                            <span className="image-fullscreen-name" title={preview.name}>{preview.name}</span>
                            <button className="image-fullscreen-close" type="button" onClick={closePreview}>Close</button>
                        </div>
                        <img src={preview.url} alt={preview.name} className="image-fullscreen-image" />
                    </div>
                </div>
            )}
        </ToolWorkspace>
    );
}

export default ImageFromJpgTool;
