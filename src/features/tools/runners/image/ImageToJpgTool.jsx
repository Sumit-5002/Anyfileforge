import React, { useCallback, useEffect, useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import FileThumbnail from '../../../../components/tools/shared/FileThumbnail';
import { X } from 'lucide-react';
import '../common/ToolWorkspace.css';

function ImageToJpgTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [quality, setQuality] = useState(0.9);
    const [results, setResults] = useState([]);
    const [preview, setPreview] = useState(null);

    const processFile = useCallback(async ({ file }) => {
        const blob = tool.mode === 'server'
            ? await serverProcessingService.convertImage(file, {
                quality: Math.round(quality * 100),
                format: 'jpeg'
            })
            : await imageService.convertImage(file, 'image/jpeg', quality);

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const outName = `${baseName}.jpg`;

        setResults((prev) => [...prev, {
            id: `${file.name}-${Date.now()}`,
            name: outName,
            data: blob,
            type: 'image'
        }]);
    }, [tool.mode, quality]);

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
        return <FileUploader tool={tool} onFilesSelected={onFilesSelected} multiple={true} accept="image/*" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={toolFiles}
            results={results}
            onFilesSelected={onFilesSelected}
            onReset={() => { reset(); setResults([]); }}
            processing={processing}
            progress={progress}
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
                        onChange={(e) => setQuality(Number(e.target.value))}
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

export default ImageToJpgTool;
