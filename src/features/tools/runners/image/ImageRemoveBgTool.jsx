import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageRemoveBgTool({ tool }) {
    const [mode, setMode] = useState('auto');
    const [color, setColor] = useState('#ffffff');
    const [tolerance, setTolerance] = useState('40');

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple={false}
            actionLabel="Remove Background"
            onProcess={async ({ items }) => {
                const item = items[0];
                if (!item) throw new Error('Please upload an image.');
                const blob = await imageService.removeBackgroundByColor(item.file, {
                    mode,
                    color,
                    tolerance: Math.min(255, Math.max(0, Number(tolerance) || 40))
                });
                return {
                    type: 'image',
                    data: blob,
                    name: `${getBaseName(item.name)}_no_bg.png`
                };
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="bg-mode">Mode</label>
                    <select id="bg-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                        <option value="auto">Auto (top-left pixel)</option>
                        <option value="pick">Pick color</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="bg-color">Background color</label>
                    <input
                        id="bg-color"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={mode !== 'pick'}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="bg-tolerance">Tolerance (0 - 255)</label>
                    <input
                        id="bg-tolerance"
                        type="number"
                        min="0"
                        max="255"
                        value={tolerance}
                        onChange={(e) => setTolerance(e.target.value)}
                    />
                </div>
            </div>
            <div className="tool-help">
                Best for solid backgrounds. Output is PNG with transparency.
            </div>
        </GenericFileTool>
    );
}

export default ImageRemoveBgTool;

