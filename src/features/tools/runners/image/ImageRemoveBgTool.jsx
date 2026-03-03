import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageRemoveBgTool({ tool }) {
    const [mode, setMode] = useState('auto');
    const [color, setColor] = useState('#ffffff');
    const [tolerance, setTolerance] = useState('40');
    const [preview, setPreview] = useState(null); // { original, processed }
    const [sliderPos, setSliderPos] = useState(50);
    const [processing, setProcessing] = useState(false);

    const handleProcess = async (file) => {
        setProcessing(true);
        try {
            const blob = await imageService.removeBackgroundByColor(file, {
                mode,
                color,
                tolerance: Math.min(255, Math.max(0, Number(tolerance) || 40))
            });

            setPreview({
                original: URL.createObjectURL(file),
                processed: URL.createObjectURL(blob),
                blob,
                name: `${getBaseName(file.name)}_no_bg.png`
            });
        } catch (err) {
            alert('Failed to remove background.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple={false}
            actionLabel="Remove Background"
            onProcess={async ({ items }) => {
                const item = items[0];
                if (!item) throw new Error('Please upload an image.');
                await handleProcess(item.file);
                // The actual GenericFileTool expecting return for its own listing
                // but we will show the slider instead
                return null;
            }}
        >
            <div className="tool-tabs mb-4">
                <button className={`tool-tab-btn ${mode === 'auto' ? 'active' : ''}`} onClick={() => setMode('auto')}>Auto Mode</button>
                <button className={`tool-tab-btn ${mode === 'pick' ? 'active' : ''}`} onClick={() => setMode('pick')}>Select Color</button>
            </div>

            <div className="tool-inline mt-2">
                <div className="tool-field">
                    <label>Bg Color</label>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={mode !== 'pick'} />
                </div>
                <div className="tool-field">
                    <label>Tolerance ({tolerance})</label>
                    <input type="range" min="0" max="255" value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
                </div>
            </div>

            {preview && (
                <div className="comparison-container mt-4 pt-4 border-top">
                    <div
                        className="comparison-slider"
                        onMouseMove={(e) => {
                            if (e.buttons === 1 || e.type === 'mousemove') {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - rect.left) / rect.width) * 100;
                                setSliderPos(Math.min(100, Math.max(0, x)));
                            }
                        }}
                    >
                        <img src={preview.original} alt="Original" />
                        <div className="after-image" style={{ width: `${sliderPos}%` }}>
                            <img src={preview.processed} alt="Processed" style={{ width: '600px' }} />
                        </div>
                        <div className="slider-handle-bar" style={{ left: `${sliderPos}%` }} />
                        <div className="slider-handle-circle" style={{ left: `${sliderPos}%` }}>
                            ↔
                        </div>
                    </div>
                    <div className="comparison-labels">
                        <span>ORIGINAL</span>
                        <span>REMOVED</span>
                    </div>
                    <button
                        className="btn btn-success mt-4 w-full"
                        onClick={() => imageService.downloadBlob(preview.blob, preview.name)}
                    >
                        Download PNG
                    </button>
                </div>
            )}
        </GenericFileTool>
    );
}

export default ImageRemoveBgTool;

