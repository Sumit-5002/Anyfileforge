import React, { useState, useCallback } from 'react';
import imageService from '../../../../services/imageService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import { RotateCw, Settings, ImageIcon } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageRotateTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [angle, setAngle] = useState('90');
    const [filter, setFilter] = useState('all'); // all, landscape, portrait
    const [format, setFormat] = useState('image/jpeg');
    const [quality, setQuality] = useState('0.9');

    const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

    const processFile = useCallback(async ({ file }) => {
        // Orientation detection
        const skip = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const isPortrait = img.width < img.height;
                const isLandscape = img.width > img.height;
                if (filter === 'landscape' && isPortrait) resolve(true);
                else if (filter === 'portrait' && isLandscape) resolve(true);
                else resolve(false);
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => resolve(false);
            img.src = URL.createObjectURL(file);
        });

        if (skip) return; // Do nothing for skipped files in parallel loop, they stay "pending" or we can handle it

        const blob = await imageService.rotateImage(
            file,
            Number(angle),
            format,
            Math.min(1, Math.max(0.1, Number(quality) || 0.9))
        );

        imageService.downloadBlob(blob, `${getBaseName(file.name)}_rotated.${extension}`);
    }, [angle, filter, format, quality, extension]);

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
            actionLabel="Rotate Images"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group mb-3">
                        <RotateCw size={14} />
                        <label>Rotation Settings</label>
                    </div>
                    <div className="tool-field">
                        <label>Angle</label>
                        <select value={angle} onChange={(e) => setAngle(e.target.value)}>
                            <option value="90">90° clockwise</option>
                            <option value="180">180°</option>
                            <option value="270">270° clockwise</option>
                        </select>
                    </div>
                    <div className="tool-field">
                        <label>Apply To</label>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="all">All images</option>
                            <option value="landscape">Landscape only</option>
                            <option value="portrait">Portrait only</option>
                        </select>
                    </div>

                    <div className="sidebar-label-group mt-4 mb-3">
                        <Settings size={14} />
                        <label>Output Format</label>
                    </div>
                    <div className="tool-field">
                        <select value={format} onChange={(e) => setFormat(e.target.value)}>
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
                        {completedIds.has(id) && <div className="status-badge">Done!</div>}
                        {failedIds.has(id) && <div className="status-badge error">Error</div>}
                        <button className="btn-icon-danger" onClick={() => removeFile(id)} disabled={processing}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageRotateTool;
