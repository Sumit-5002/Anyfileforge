import React, { useState, useCallback } from 'react';
import imageService from '../../../../services/imageService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import { Type, ImageIcon, Settings } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageWatermarkTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [type, setType] = useState('text'); // 'text' or 'image'
    const [text, setText] = useState('CONFIDENTIAL');
    const [wmFile, setWmFile] = useState(null);
    const [position, setPosition] = useState('bottom-right');
    const [opacity, setOpacity] = useState('0.35');
    const [fontSize, setFontSize] = useState('32');

    const processFile = useCallback(async ({ file }) => {
        const blob = await imageService.watermarkImage(file, {
            type,
            text,
            watermarkFile: wmFile,
            position,
            opacity: Math.min(1, Math.max(0, Number(opacity) || 0.35)),
            fontSize: Number(fontSize) || 32
        });

        imageService.downloadBlob(blob, `${getBaseName(file.name)}_watermarked.png`);
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

export default ImageWatermarkTool;
