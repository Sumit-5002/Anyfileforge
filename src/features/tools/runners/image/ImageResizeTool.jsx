import React, { useState, useCallback } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import { Maximize, Settings, ImageIcon, Check } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageResizeTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [width, setWidth] = useState('1366');
    const [height, setHeight] = useState('768');
    const [unit, setUnit] = useState('px'); // 'px' or 'percent'
    const [keepAspect, setKeepAspect] = useState(true);
    const [noEnlarge, setNoEnlarge] = useState(true);
    const [format, setFormat] = useState('image/jpeg');
    const [quality, setQuality] = useState(0.9);

    const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

    const processFile = useCallback(async ({ file }) => {
        const normalizedQuality = Math.min(1, Math.max(0.1, Number(quality)));
        const blob = tool.mode === 'server'
            ? await serverProcessingService.resizeImage(file, {
                width, height, unit, noEnlarge,
                format: format.replace('image/', '')
            })
            : await imageService.resizeImageTo(file, width, height, {
                keep: keepAspect,
                fmt: format,
                q: normalizedQuality,
                noEnlarge,
                unit
            });

        imageService.downloadBlob(blob, `${getBaseName(file.name)}_resized.${extension}`);
    }, [tool.mode, width, height, unit, noEnlarge, format, keepAspect, quality, extension]);

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
        return <FileUploader tool={tool} onFilesSelected={onFilesSelected} multiple={true} accept="image/*" />;
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
            actionLabel="Resize IMAGES"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-tabs mb-3">
                        <button className={`tool-tab-btn ${unit === 'px' ? 'active' : ''}`} onClick={() => setUnit('px')}>By pixels</button>
                        <button className={`tool-tab-btn ${unit === 'percent' ? 'active' : ''}`} onClick={() => setUnit('percent')}>By percentage</button>
                    </div>

                    <div className="sidebar-label-group">
                        <Maximize size={14} />
                        <label>{unit === 'px' ? 'Dimension' : 'Scale'}</label>
                    </div>

                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>{unit === 'px' ? 'Width (px)' : 'Percentage'}</label>
                            <input type="number" value={width} onChange={e => setWidth(e.target.value)} />
                        </div>
                        {unit === 'px' && (
                            <div className="tool-field">
                                <label>Height (px)</label>
                                <input type="number" value={height} onChange={e => setHeight(e.target.value)} />
                            </div>
                        )}
                    </div>

                    <div className="tool-field mt-3">
                        <label className="tool-checkbox">
                            <input type="checkbox" checked={keepAspect} onChange={e => setKeepAspect(e.target.checked)} />
                            <span>Keep aspect ratio</span>
                        </label>
                        <label className="tool-checkbox mt-2">
                            <input type="checkbox" checked={noEnlarge} onChange={e => setNoEnlarge(e.target.checked)} />
                            <span>Don't enlarge smaller</span>
                        </label>
                    </div>

                    <div className="sidebar-label-group mt-4">
                        <Settings size={14} />
                        <label>Output Format</label>
                    </div>
                    <div className="tool-field mt-2">
                        <select value={format} onChange={e => setFormat(e.target.value)}>
                            <option value="image/jpeg">JPG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/webp">WebP</option>
                        </select>
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
                        {completedIds.has(id) && <div className="status-badge"><Check size={14} /> Done</div>}
                        {failedIds.has(id) && <div className="status-badge error">Error</div>}
                        <button className="btn-icon-danger" onClick={() => removeFile(id)} disabled={processing}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageResizeTool;
