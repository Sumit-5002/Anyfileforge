import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageEditorTool({ tool }) {
    const [activeTab, setActiveTab] = useState('filters'); // 'filters' or 'text'
    const [filter, setFilter] = useState('grayscale');
    const [intensity, setIntensity] = useState('0.5');

    const [text, setText] = useState('Sample text');
    const [x, setX] = useState('24');
    const [y, setY] = useState('64');
    const [fontSize, setFontSize] = useState('42');
    const [color, setColor] = useState('#ffffff');
    const [opacity] = useState('0.9');

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple={false}
            actionLabel="Apply Edit"
            onProcess={async ({ items }) => {
                const item = items[0];
                if (!item) throw new Error('Please upload an image.');

                let blob;
                if (activeTab === 'filters') {
                    blob = await imageService.applyImageFilter(item.file, filter, {
                        intensity: Number(intensity) || 0.5
                    });
                } else {
                    if (!text.trim()) throw new Error('Enter some text.');
                    blob = await imageService.addTextOverlay(item.file, text, {
                        x: Number(x) || 0,
                        y: Number(y) || 0,
                        fontSize: Number(fontSize) || 42,
                        color,
                        opacity: Math.min(1, Math.max(0, Number(opacity) || 0.9))
                    });
                }

                return {
                    type: 'image',
                    data: blob,
                    name: `${getBaseName(item.name)}_edited.png`
                };
            }}
        >
            <div className="tool-tabs mb-4">
                <button className={`tool-tab-btn ${activeTab === 'filters' ? 'active' : ''}`} onClick={() => setActiveTab('filters')}>Filters</button>
                <button className={`tool-tab-btn ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>Text Overlay</button>
            </div>

            {activeTab === 'filters' ? (
                <div className="tool-settings mt-2">
                    <div className="tool-field">
                        <label>Filter Type</label>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="grayscale">Grayscale</option>
                            <option value="sepia">Sepia</option>
                            <option value="invert">Invert Colors</option>
                            <option value="blur">Blur</option>
                            <option value="brightness">Brightness</option>
                            <option value="contrast">Contrast</option>
                        </select>
                    </div>
                    <div className="tool-field">
                        <label>Intensity ({Math.round(intensity * 100)}%)</label>
                        <input type="range" min="0" max="1" step="0.05" value={intensity} onChange={(e) => setIntensity(e.target.value)} />
                    </div>
                </div>
            ) : (
                <div className="tool-settings mt-2">
                    <div className="tool-field">
                        <label htmlFor="edit-text">Text</label>
                        <input id="edit-text" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text..." />
                    </div>
                    <div className="tool-inline">
                        <div className="tool-field">
                            <label>X (px)</label>
                            <input type="number" value={x} onChange={(e) => setX(e.target.value)} />
                        </div>
                        <div className="tool-field">
                            <label>Y (px)</label>
                            <input type="number" value={y} onChange={(e) => setY(e.target.value)} />
                        </div>
                    </div>
                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>Font Size</label>
                            <input type="number" min="8" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
                        </div>
                        <div className="tool-field">
                            <label>Color</label>
                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="p-1" />
                        </div>
                    </div>
                </div>
            )}

            <div className="tool-help mt-4">
                Apply quick artistic filters or position text anywhere on your photo.
            </div>
        </GenericFileTool>
    );
}

export default ImageEditorTool;

