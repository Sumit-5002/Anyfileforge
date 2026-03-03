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
    const [width, setWidth] = useState('1366');
    const [height, setHeight] = useState('768');
    const [unit, setUnit] = useState('px'); // 'px' or 'percent'
    const [keepAspect, setKeepAspect] = useState(true);
    const [noEnlarge, setNoEnlarge] = useState(true);
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
        if (!width && !height && unit === 'px') {
            alert('Set at least a width or height.');
            return;
        }
        setProcessing(true);
        setCompletedIndices(new Set());
        try {
            const normalizedQuality = Math.min(1, Math.max(0.1, Number(quality)));
            const CONCURRENCY_LIMIT = 5;

            for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
                const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
                await Promise.allSettled(chunk.map(async (f, chunkIdx) => {
                    const actualIdx = i + chunkIdx;
                    try {
                        const blob = tool.mode === 'server'
                            ? await serverProcessingService.resizeImage(f, {
                                width, height, unit, noEnlarge,
                                format: format.replace('image/', '')
                            })
                            : await imageService.resizeImageTo(f, width, height, {
                                keep: keepAspect,
                                fmt: format,
                                q: normalizedQuality,
                                noEnlarge,
                                unit
                            });

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
            actionLabel="Resize IMAGES"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-tabs mb-3">
                        <button className={`tool-tab-btn ${unit === 'px' ? 'active' : ''}`} onClick={() => setUnit('px')}>By pixels</button>
                        <button className={`tool-tab-btn ${unit === 'percent' ? 'active' : ''}`} onClick={() => setUnit('percent')}>By percentage</button>
                    </div>

                    <div className="sidebar-label-group">
                        <Maximize size={14} />
                        <label>{unit === 'px' ? 'Resize to exact size' : 'Scale by percent'}</label>
                    </div>

                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>{unit === 'px' ? 'Width (px)' : 'Percentage'}</label>
                            <input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder={unit === 'px' ? "1366" : "50"} />
                        </div>
                        {unit === 'px' && (
                            <div className="tool-field">
                                <label>Height (px)</label>
                                <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="768" />
                            </div>
                        )}
                    </div>

                    <div className="tool-field mt-3">
                        <label className="tool-checkbox">
                            <input type="checkbox" checked={keepAspect} onChange={e => setKeepAspect(e.target.checked)} />
                            <span>Maintain aspect ratio</span>
                        </label>
                        <label className="tool-checkbox mt-2">
                            <input type="checkbox" checked={noEnlarge} onChange={e => setNoEnlarge(e.target.checked)} />
                            <span>Do not enlarge if smaller</span>
                        </label>
                    </div>

                    <div className="sidebar-label-group mt-4">
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
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageResizeTool;
