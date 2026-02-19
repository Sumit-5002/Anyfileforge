import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Maximize, Layout, FileImage, Settings, Check } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageResizeTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [keepAspect, setKeepAspect] = useState(true);
    const [format, setFormat] = useState('image/jpeg');
    const [quality, setQuality] = useState(0.9);
    const [processing, setProcessing] = useState(false);
    const [completedIndices, setCompletedIndices] = useState(new Set());

    const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        if (!width && !height) {
            alert('Set at least a width or height.');
            return;
        }
        setProcessing(true);
        setCompletedIndices(new Set());
        try {
            const normalizedQuality = Math.min(1, Math.max(0.1, Number(quality)));
            const CONCURRENCY_LIMIT = 5;

            // Process files in chunks to avoid memory spikes and UI freeze (Bolt ⚡)
            for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
                const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
                await Promise.allSettled(chunk.map(async (f, chunkIdx) => {
                    const actualIdx = i + chunkIdx;
                    try {
                        const blob = tool.mode === 'server'
                            ? await serverProcessingService.resizeImage(f, {
                                width,
                                height,
                                format: format.replace('image/', '')
                            })
                            : await imageService.resizeImageTo(f, width, height, keepAspect, format, normalizedQuality);

                        imageService.downloadBlob(blob, `${getBaseName(f.name)}_resized.${extension}`);
                        setCompletedIndices(prev => new Set(prev).add(actualIdx));
                    } catch (error) {
                        console.error(`Failed to process ${f.name}:`, error);
                    }
                }));
            }
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
            onReset={() => { setFiles([]); setCompletedIndices(new Set()); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Resize Images"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group">
                        <Maximize size={14} />
                        <label>Dimensions (px)</label>
                    </div>
                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>Width</label>
                            <input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="Auto" />
                        </div>
                        <div className="tool-field">
                            <label>Height</label>
                            <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="Auto" />
                        </div>
                    </div>

                    <div className="tool-field">
                        <label className="tool-checkbox">
                            <input type="checkbox" checked={keepAspect} onChange={e => setKeepAspect(e.target.checked)} />
                            <span>Maintain aspect ratio</span>
                        </label>
                    </div>

                    <div className="sidebar-label-group mt-3">
                        <Settings size={14} />
                        <label>Output Format</label>
                    </div>
                    <div className="tool-field mt-2">
                        <select value={format} onChange={e => setFormat(e.target.value)}>
                            <option value="image/jpeg">JPEG (Smaller size)</option>
                            <option value="image/png">PNG (Lossless)</option>
                            <option value="image/webp">WebP (Modern)</option>
                        </select>
                    </div>

                    {format !== 'image/png' && (
                        <div className="tool-field">
                            <label>Quality ({Math.round(quality * 100)}%)</label>
                            <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={e => setQuality(e.target.value)} />
                        </div>
                    )}
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <FileImage size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        {completedIndices.has(i) && <div className="status-badge"><Check size={14} /> Done</div>}
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} aria-label={`Remove ${file.name}`}>×</button>
                    </div>
                ))}
            </div>
            <p className="tool-help text-center mt-4">
                Leave one dimension blank to auto-scale based on aspect ratio.
            </p>
        </ToolWorkspace>
    );
}

export default ImageResizeTool;
