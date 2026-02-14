import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageEditorTool({ tool }) {
    const [text, setText] = useState('Sample text');
    const [x, setX] = useState('24');
    const [y, setY] = useState('64');
    const [fontSize, setFontSize] = useState('42');
    const [color, setColor] = useState('#ffffff');
    const [opacity, setOpacity] = useState('0.9');

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple={false}
            actionLabel="Apply Edit"
            onProcess={async ({ items }) => {
                const item = items[0];
                if (!item) throw new Error('Please upload an image.');
                if (!text.trim()) throw new Error('Enter some text.');

                const blob = await imageService.addTextOverlay(item.file, text, {
                    x: Number(x) || 0,
                    y: Number(y) || 0,
                    fontSize: Number(fontSize) || 42,
                    color,
                    opacity: Math.min(1, Math.max(0, Number(opacity) || 0.9))
                });

                return {
                    type: 'image',
                    data: blob,
                    name: `${getBaseName(item.name)}_edited.png`
                };
            }}
        >
            <div className="tool-field">
                <label htmlFor="edit-text">Text</label>
                <input id="edit-text" type="text" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="edit-x">X (px)</label>
                    <input id="edit-x" type="number" value={x} onChange={(e) => setX(e.target.value)} />
                </div>
                <div className="tool-field">
                    <label htmlFor="edit-y">Y (px)</label>
                    <input id="edit-y" type="number" value={y} onChange={(e) => setY(e.target.value)} />
                </div>
                <div className="tool-field">
                    <label htmlFor="edit-size">Font size</label>
                    <input id="edit-size" type="number" min="8" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
                </div>
                <div className="tool-field">
                    <label htmlFor="edit-opacity">Opacity</label>
                    <input
                        id="edit-opacity"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={opacity}
                        onChange={(e) => setOpacity(e.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="edit-color">Color</label>
                    <input id="edit-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
            </div>
            <div className="tool-help">
                Lightweight editor for adding positioned text. For memes/watermarks, use the dedicated tools.
            </div>
        </GenericFileTool>
    );
}

export default ImageEditorTool;

