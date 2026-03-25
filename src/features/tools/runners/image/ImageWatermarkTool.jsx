import React, { useCallback, useEffect, useState } from 'react';
import imageService from '../../../../services/imageService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import FileThumbnail from '../../../../components/tools/shared/FileThumbnail';
import { ImageIcon, Settings, Type, X } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

const WatermarkTilePreview = ({ file, resultBlob }) => {
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!(resultBlob instanceof Blob)) {
            setPreviewUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(resultBlob);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [resultBlob]);

    if (previewUrl) {
        return <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />;
    }

    return <FileThumbnail file={file} className="w-full h-full rounded-none border-0 shadow-none" />;
};

function ImageWatermarkTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [type, setType] = useState('text');
    const [text, setText] = useState('CONFIDENTIAL');
    const [wmFile, setWmFile] = useState(null);
    const [position, setPosition] = useState('bottom-right');
    const [opacity, setOpacity] = useState('0.35');
    const [fontSize, setFontSize] = useState('32');
    const [results, setResults] = useState([]);
    const [preview, setPreview] = useState(null);

    const processFile = useCallback(async ({ id, file }) => {
        const blob = await imageService.watermarkImage(file, {
            type,
            text,
            watermarkFile: wmFile,
            position,
            opacity: Math.min(1, Math.max(0, Number(opacity) || 0.35)),
            fontSize: Number(fontSize) || 32
        });

        setResults((prev) => [...prev, {
            sourceId: id,
            type: 'image',
            data: blob,
            name: `${getBaseName(file.name)}_watermarked.png`
        }]);
    }, [type, text, wmFile, position, opacity, fontSize]);

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

    const handleProcess = useCallback(async () => {
        setResults([]);
        await processFiles();
    }, [processFiles]);

    const openPreview = useCallback((file, processedResult = null) => {
        const sourceBlob = processedResult?.data instanceof Blob ? processedResult.data : file;
        const sourceName = processedResult?.name || file.name;
        const url = URL.createObjectURL(sourceBlob);
        setPreview((prev) => {
            if (prev?.url) URL.revokeObjectURL(prev.url);
            return { url, name: sourceName };
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
            onProcess={handleProcess}
            actionLabel="Add Watermarks"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group mb-3">
                        <Settings size={14} />
                        <label>Watermark Type</label>
                    </div>
                    <div className="tool-tabs mb-4">
                        <button className={`tool-tab-btn ${type === 'text' ? 'active' : ''}`} onClick={() => setType('text')}>
                            <Type size={14} className="me-1" /> Text
                        </button>
                        <button className={`tool-tab-btn ${type === 'image' ? 'active' : ''}`} onClick={() => setType('image')}>
                            <ImageIcon size={14} className="me-1" /> Image
                        </button>
                    </div>

                    {type === 'text' ? (
                        <div className="tool-field">
                            <label>Label Text</label>
                            <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
                        </div>
                    ) : (
                        <div className="tool-field">
                            <label>Logo Image</label>
                            <input type="file" accept="image/*" onChange={(e) => setWmFile(e.target.files[0])} />
                        </div>
                    )}

                    <div className="tool-field mt-3">
                        <label>Position</label>
                        <select value={position} onChange={(e) => setPosition(e.target.value)}>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="center">Center</option>
                        </select>
                    </div>

                    <div className="tool-field">
                        <label>Opacity ({Math.round(opacity * 100)}%)</label>
                        <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(e.target.value)} />
                    </div>

                    {type === 'text' && (
                        <div className="tool-field">
                            <label>Font Size</label>
                            <input type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
                        </div>
                    )}
                </div>
            }
        >
            <div className="pages-grid image-pages-grid">
                {files.map(({ id, file }, idx) => {
                    const processedResult = results.find((result) => result.sourceId === id) || null;
                    return (
                    <div key={id} className={`page-item-card ${completedIds.has(id) ? 'selected' : ''}`}>
                        <div className="page-item-preview image-page-preview">
                            <WatermarkTilePreview file={file} resultBlob={processedResult?.data} />
                            <button
                                className="page-view-btn"
                                type="button"
                                onClick={() => openPreview(file, processedResult)}
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
                )})}
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

export default ImageWatermarkTool;
