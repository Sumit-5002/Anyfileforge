import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageUpscaleTool({ tool }) {
    const [scale, setScale] = useState('2');
    const [format, setFormat] = useState('image/png');
    const [quality, setQuality] = useState('0.92');

    const extension = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple
            actionLabel="Upscale Images"
            onProcess={async ({ items }) => {
                const factor = Math.max(1, Number(scale) || 2);
                const q = Math.min(1, Math.max(0.1, Number(quality) || 0.92));
                const results = [];
                for (const item of items) {
                    const blob = await imageService.upscaleImage(item.file, factor, format, q);
                    results.push({
                        type: 'image',
                        data: blob,
                        name: `${getBaseName(item.name)}_upscaled_${factor}x.${extension}`
                    });
                }
                return results;
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="upscale-factor">Scale</label>
                    <select id="upscale-factor" value={scale} onChange={(e) => setScale(e.target.value)}>
                        <option value="2">2×</option>
                        <option value="3">3×</option>
                        <option value="4">4×</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="upscale-format">Output format</label>
                    <select id="upscale-format" value={format} onChange={(e) => setFormat(e.target.value)}>
                        <option value="image/png">PNG</option>
                        <option value="image/jpeg">JPG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="upscale-quality">Quality (0.1 - 1)</label>
                    <input
                        id="upscale-quality"
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="1"
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                    />
                </div>
            </div>
            <div className="tool-help">
                This is a high-quality resize (not AI super-resolution), but it helps for printing and quick enlargements.
            </div>
        </GenericFileTool>
    );
}

export default ImageUpscaleTool;

