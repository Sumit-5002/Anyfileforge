import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageBlurFaceTool({ tool }) {
    const [x, setX] = useState('0');
    const [y, setY] = useState('0');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [radius, setRadius] = useState('12');

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple={false}
            actionLabel="Blur Region"
            onProcess={async ({ items }) => {
                const item = items[0];
                if (!item) throw new Error('Please upload an image.');
                if (!width || !height) throw new Error('Provide blur region width and height.');

                const blob = await imageService.blurRegion(item.file, {
                    x: Number(x) || 0,
                    y: Number(y) || 0,
                    width: Number(width),
                    height: Number(height),
                    radius: Math.max(0, Number(radius) || 12)
                });

                return {
                    type: 'image',
                    data: blob,
                    name: `${getBaseName(item.name)}_blur.png`
                };
            }}
        >
            <div className="tool-inline">
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
                    step="1"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                />
            </div>
            <div className="tool-help">
                This is a manual blur box (not automatic face detection). Use it to hide faces or sensitive areas.
            </div>
        </GenericFileTool>
    );
}

export default ImageBlurFaceTool;

