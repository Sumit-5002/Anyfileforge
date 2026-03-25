import React, { useCallback, useEffect, useState } from 'react';
import imageService from '../../../../services/imageService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import FileThumbnail from '../../../../components/tools/shared/FileThumbnail';
import { MousePointer2, Settings, ShieldCheck, X } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageBlurFaceTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState('auto');
    const [sensitivity, setSensitivity] = useState('medium');
    const [x, setX] = useState('100');
    const [y, setY] = useState('100');
    const [width, setWidth] = useState('200');
    const [height, setHeight] = useState('200');
    const [radius, setRadius] = useState('25');
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const [preview, setPreview] = useState(null);

    const handleFilesSelected = useCallback((newFiles) => {
        if (newFiles.length > 0) {
            setFile(newFiles[0]);
            setResults([]);
            if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
        }
    }, [parentOnFilesAdded]);

    const openPreview = useCallback((sourceFile) => {
        const url = URL.createObjectURL(sourceFile);
        setPreview((prev) => {
            if (prev?.url) URL.revokeObjectURL(prev.url);
            return { url, name: sourceFile.name };
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

    const handleProcess = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            const blob = mode === 'auto'
                ? await imageService.autoDetectFaces(file, sensitivity)
                : await imageService.blurRegion(file, {
                    x: Number(x) || 0,
                    y: Number(y) || 0,
                    width: Number(width) || 200,
                    height: Number(height) || 200,
                    radius: Math.max(0, Number(radius) || 25)
                });

            setResults([{
                type: 'image',
                data: blob,
                name: `${getBaseName(file.name)}_blurred.png`
            }]);
        } catch (error) {
            console.error('Blur operation failed:', error);
            alert(error?.message || 'Failed to apply blur.');
        } finally {
            setProcessing(false);
        }
    };

    if (!file) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} accept="image/*" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={[file]}
            results={results}
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFile(null); setResults([]); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel={mode === 'auto' ? 'Auto Blur' : 'Apply Blur'}
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group mb-3">
                        <Settings size={14} />
                        <label>Blur Mode</label>
                    </div>
                    <div className="tool-tabs mb-4">
                        <button className={`tool-tab-btn ${mode === 'auto' ? 'active' : ''}`} onClick={() => setMode('auto')}>
                            <ShieldCheck size={14} className="me-1" /> Auto
                        </button>
                        <button className={`tool-tab-btn ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
                            <MousePointer2 size={14} className="me-1" /> Manual
                        </button>
                    </div>

                    {mode === 'auto' ? (
                        <div className="tool-field">
                            <label>Sensitivity</label>
                            <div className="levels-horizontal mt-2">
                                {['low', 'medium', 'high'].map((s) => (
                                    <button
                                        key={s}
                                        className={`level-btn ${sensitivity === s ? 'active' : ''}`}
                                        onClick={() => setSensitivity(s)}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <p className="tool-help mt-2"><small>Recommended: Medium</small></p>
                        </div>
                    ) : (
                        <>
                            <div className="tool-inline">
                                <div className="tool-field">
                                    <label>X Offset</label>
                                    <input type="number" value={x} onChange={(e) => setX(e.target.value)} />
                                </div>
                                <div className="tool-field">
                                    <label>Y Offset</label>
                                    <input type="number" value={y} onChange={(e) => setY(e.target.value)} />
                                </div>
                            </div>
                            <div className="tool-inline mt-2">
                                <div className="tool-field">
                                    <label>Width</label>
                                    <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
                                </div>
                                <div className="tool-field">
                                    <label>Height</label>
                                    <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                                </div>
                            </div>
                            <div className="tool-field mt-3">
                                <label>Blur Strength</label>
                                <input type="range" min="5" max="100" step="5" value={radius} onChange={(e) => setRadius(e.target.value)} />
                            </div>
                        </>
                    )}
                </div>
            }
        >
            <div className="pages-grid image-pages-grid">
                <div className="page-item-card">
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
                            onClick={() => setFile(null)}
                            disabled={processing}
                            title="Remove Image"
                            aria-label={`Remove ${file.name}`}
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="page-item-label image-page-label" title={file.name}>
                        <div className="image-page-index">Source Image</div>
                        <div className="image-page-name">{file.name}</div>
                    </div>
                </div>
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

export default ImageBlurFaceTool;
