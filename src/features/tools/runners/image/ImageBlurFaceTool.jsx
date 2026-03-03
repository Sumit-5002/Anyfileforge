import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import { EyeOff, Settings, MousePointer2, ShieldCheck, ImageIcon } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageBlurFaceTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState('auto'); // 'auto' or 'manual'
    const [sensitivity, setSensitivity] = useState('medium');
    const [x, setX] = useState('100');
    const [y, setY] = useState('100');
    const [width, setWidth] = useState('200');
    const [height, setHeight] = useState('200');
    const [radius, setRadius] = useState('25');
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (newFiles) => {
        if (newFiles.length > 0) {
            setFile(newFiles[0]);
            if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            let blob;
            if (mode === 'auto') {
                blob = await imageService.autoDetectFaces(file, sensitivity);
            } else {
                blob = await imageService.blurRegion(file, {
                    x: Number(x) || 0,
                    y: Number(y) || 0,
                    width: Number(width) || 200,
                    height: Number(height) || 200,
                    radius: Math.max(0, Number(radius) || 25)
                });
            }
            imageService.downloadBlob(blob, `${getBaseName(file.name)}_blurred.png`);
        } catch (error) {
            console.error('Blur operation failed:', error);
            alert('Failed to apply blur.');
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
            onFilesSelected={handleFilesSelected}
            onReset={() => setFile(null)}
            processing={processing}
            onProcess={handleProcess}
            actionLabel={mode === 'auto' ? "Auto Blur" : "Apply Blur"}
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
                                {['low', 'medium', 'high'].map(s => (
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
            <div className="files-list-view">
                <div className="file-item-horizontal">
                    <ImageIcon size={24} className="text-primary" />
                    <div className="file-item-info">
                        <div className="file-item-name">{file.name}</div>
                        <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button className="btn-icon-danger" onClick={() => setFile(null)} disabled={processing}>×</button>
                </div>
                <div className="mt-4 p-4 text-center opacity-70 border rounded-lg border-dashed">
                    <p>{mode === 'auto' ? "AI will attempt to find and blur faces automatically." : "Manually define the region to blur using the fields on the right."}</p>
                </div>
            </div>
        </ToolWorkspace>
    );
}

export default ImageBlurFaceTool;

