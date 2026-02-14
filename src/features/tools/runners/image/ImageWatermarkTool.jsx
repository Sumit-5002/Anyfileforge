import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageWatermarkTool({ tool }) {
    const [text, setText] = useState('CONFIDENTIAL');
    const [position, setPosition] = useState('bottom-right');
    const [opacity, setOpacity] = useState('0.35');
    const [fontSize, setFontSize] = useState('32');

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple
            actionLabel="Add Watermark"
            onProcess={async ({ items }) => {
                const results = [];
                for (const item of items) {
                    const blob = await imageService.watermarkImage(item.file, text, {
                        position,
                        opacity: Math.min(1, Math.max(0, Number(opacity) || 0.35)),
                        fontSize: Number(fontSize) || 32
                    });
                    results.push({
                        type: 'image',
                        data: blob,
                        name: `${getBaseName(item.name)}_watermark.png`
                    });
                }
                return results;
            }}
        >
            <div className="tool-field">
                <label htmlFor="wm-image-text">Watermark text</label>
                <input
                    id="wm-image-text"
                    type="text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                />
            </div>
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="wm-image-position">Position</label>
                    <select
                        id="wm-image-position"
                        value={position}
                        onChange={(event) => setPosition(event.target.value)}
                    >
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="wm-image-opacity">Opacity</label>
                    <input
                        id="wm-image-opacity"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={opacity}
                        onChange={(event) => setOpacity(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="wm-image-size">Font size</label>
                    <input
                        id="wm-image-size"
                        type="number"
                        min="8"
                        value={fontSize}
                        onChange={(event) => setFontSize(event.target.value)}
                    />
                </div>
            </div>
        </GenericFileTool>
    );
}

export default ImageWatermarkTool;
