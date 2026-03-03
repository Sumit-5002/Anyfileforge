import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageBlurFaceTool({ tool }) {
    const [mode, setMode] = useState('auto'); // 'auto' or 'manual'
    const [sensitivity, setSensitivity] = useState('medium');
    const [x, setX] = useState('0');
    const [y, setY] = useState('0');
    const [width, setWidth] = useState('300');
    const [height, setHeight] = useState('300');
    const [radius, setRadius] = useState('25');

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple={false}
            actionLabel={mode === 'auto' ? "Auto Blur Faces" : "Blur Selected Region"}
            onProcess={async ({ items }) => {
                const item = items[0];
                if (!item) throw new Error('Please upload an image.');

                let blob;
                if (mode === 'auto') {
                    blob = await imageService.autoDetectFaces(item.file, sensitivity);
                } else {
                    if (!width || !height) throw new Error('Provide blur region width and height.');
                    blob = await imageService.blurRegion(item.file, {
                        x: Number(x) || 0,
                        y: Number(y) || 0,
                        width: Number(width),
                        height: Number(height),
                        radius: Math.max(0, Number(radius) || 25)
                    });
                }

                return {
                    type: 'image',
                    data: blob,
                    name: `${getBaseName(item.name)}_blurred.png`
                };
            }}
        >
            <div className="tool-tabs mb-4">
                <button
                    className={`tool-tab-btn ${mode === 'auto' ? 'active' : ''}`}
                    onClick={() => setMode('auto')}
                >
                    Automatic detection
                </button>
                <button
                    className={`tool-tab-btn ${mode === 'manual' ? 'active' : ''}`}
                    onClick={() => setMode('manual')}
                >
                    Customised detection
                </button>
            </div>

            {mode === 'auto' ? (
                <div className="tool-field">
                    <label>Detection Sensitivity</label>
                    <div className="levels-horizontal mt-2">
                        {['low', 'medium', 'high'].map(s => (
                            <button
                                key={s}
                                className={`level-btn ${sensitivity === s ? 'active' : ''}`}
                                onClick={() => setSensitivity(s)}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                {s === 'medium' ? ' (Recommended)' : ''}
                            </button>
                        ))}
                    </div>
                    <p className="tool-help mt-3">
                        <small>High detection will apply stronger blur and larger detection zones.</small>
                    </p>
                </div>
            ) : (
                <>
                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label htmlFor="blur-x">X (px)</label>
                            <input id="blur-x" type="number" min="0" value={x} onChange={(e) => setX(e.target.value)} />
                        </div>
                        <div className="tool-field">
                            <label htmlFor="blur-y">Y (px)</label>
                            <input id="blur-y" type="number" min="0" value={y} onChange={(e) => setY(e.target.value)} />
                        </div>
                        <div className="tool-field">
                            <label htmlFor="blur-w">Width (px)</label>
                            <input id="blur-w" type="number" min="1" value={width} onChange={(e) => setWidth(e.target.value)} />
                        </div>
                        <div className="tool-field">
                            <label htmlFor="blur-h">Height (px)</label>
                            <input id="blur-h" type="number" min="1" value={height} onChange={(e) => setHeight(e.target.value)} />
                        </div>
                    </div>
                    <div className="tool-field">
                        <label htmlFor="blur-radius">Blur radius (px)</label>
                        <input
                            id="blur-radius"
                            type="number"
                            min="0"
                            step="5"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                        />
                    </div>
                    <button className="btn-outline-primary btn-sm mt-2">+ Add more blur area</button>
                </>
            )}

            <div className="feature-badges mt-4 pt-3 border-top">
                <span className="badge bg-light text-dark border mr-2">License Plates</span>
                <span className="badge bg-light text-dark border mr-2">Faces</span>
                <span className="badge bg-light text-dark border">Private Info</span>
            </div>
        </GenericFileTool>
    );
}

export default ImageBlurFaceTool;

