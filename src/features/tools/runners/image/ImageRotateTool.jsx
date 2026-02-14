import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageRotateTool({ tool }) {
    const [angle, setAngle] = useState('90');
    const [format, setFormat] = useState('image/jpeg');
    const [quality, setQuality] = useState('0.9');

    const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple
            actionLabel="Rotate Images"
            onProcess={async ({ items }) => {
                const results = [];
                for (const item of items) {
                    const blob = await imageService.rotateImage(
                        item.file,
                        Number(angle),
                        format,
                        Math.min(1, Math.max(0.1, Number(quality) || 0.9))
                    );
                    results.push({
                        type: 'image',
                        data: blob,
                        name: `${getBaseName(item.name)}_rotated.${extension}`
                    });
                }
                return results;
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="rotate-angle-img">Rotation</label>
                    <select
                        id="rotate-angle-img"
                        value={angle}
                        onChange={(event) => setAngle(event.target.value)}
                    >
                        <option value="90">90° clockwise</option>
                        <option value="180">180°</option>
                        <option value="270">270° clockwise</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="rotate-format">Output format</label>
                    <select
                        id="rotate-format"
                        value={format}
                        onChange={(event) => setFormat(event.target.value)}
                    >
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="rotate-quality">Quality (0.1 - 1)</label>
                    <input
                        id="rotate-quality"
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

export default ImageRotateTool;
