import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageCropTool({ tool }) {
    const [x, setX] = useState('0');
    const [y, setY] = useState('0');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [format, setFormat] = useState('image/jpeg');
    const [quality, setQuality] = useState('0.9');

    const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple={false}
            actionLabel="Crop Image"
            onProcess={async ({ items }) => {
                const item = items[0];
                if (!item) throw new Error('Please upload an image.');
                if (!width || !height) {
                    throw new Error('Provide crop width and height.');
                }
                const blob = await imageService.cropImage(
                    item.file,
                    x,
                    y,
                    width,
                    height,
                    format,
                    Math.min(1, Math.max(0.1, Number(quality) || 0.9))
                );
                return {
                    type: 'image',
                    data: blob,
                    name: `${getBaseName(item.name)}_crop.${extension}`
                };
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="crop-x">X (px)</label>
                    <input
                        id="crop-x"
                        type="number"
                        min="0"
                        value={x}
                        onChange={(event) => setX(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="crop-y">Y (px)</label>
                    <input
                        id="crop-y"
                        type="number"
                        min="0"
                        value={y}
                        onChange={(event) => setY(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="crop-width">Width (px)</label>
                    <input
                        id="crop-width"
                        type="number"
                        min="1"
                        value={width}
                        onChange={(event) => setWidth(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="crop-height">Height (px)</label>
                    <input
                        id="crop-height"
                        type="number"
                        min="1"
                        value={height}
                        onChange={(event) => setHeight(event.target.value)}
                    />
                </div>
            </div>
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="crop-format">Output format</label>
                    <select
                        id="crop-format"
                        value={format}
                        onChange={(event) => setFormat(event.target.value)}
                    >
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="crop-quality">Quality (0.1 - 1)</label>
                    <input
                        id="crop-quality"
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="1"
                        value={quality}
                        onChange={(event) => setQuality(event.target.value)}
                    />
                </div>
            </div>
        </GenericFileTool>
    );
}

export default ImageCropTool;
