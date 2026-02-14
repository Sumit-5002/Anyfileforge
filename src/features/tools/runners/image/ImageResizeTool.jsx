import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageResizeTool({ tool }) {
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [keepAspect, setKeepAspect] = useState(true);
    const [format, setFormat] = useState('image/jpeg');
    const [quality, setQuality] = useState('0.9');

    const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple
            actionLabel="Resize Images"
            onProcess={async ({ items }) => {
                if (!width && !height) {
                    throw new Error('Set at least a width or height.');
                }
                const results = [];
                for (const item of items) {
                    const normalizedQuality = Math.min(1, Math.max(0.1, Number(quality) || 0.9));
                    const blob = tool.mode === 'server'
                        ? await serverProcessingService.resizeImage(item.file, {
                            width,
                            height,
                            format: format.replace('image/', '')
                        })
                        : await imageService.resizeImageTo(
                            item.file,
                            width,
                            height,
                            keepAspect,
                            format,
                            normalizedQuality
                        );
                    results.push({
                        type: 'image',
                        data: blob,
                        name: `${getBaseName(item.name)}_resized.${extension}`
                    });
                }
                return results;
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="resize-width">Width (px)</label>
                    <input
                        id="resize-width"
                        type="number"
                        min="1"
                        value={width}
                        onChange={(event) => setWidth(event.target.value)}
                        placeholder="Auto"
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="resize-height">Height (px)</label>
                    <input
                        id="resize-height"
                        type="number"
                        min="1"
                        value={height}
                        onChange={(event) => setHeight(event.target.value)}
                        placeholder="Auto"
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="resize-format">Output format</label>
                    <select
                        id="resize-format"
                        value={format}
                        onChange={(event) => setFormat(event.target.value)}
                    >
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </div>
            </div>
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="resize-quality">Quality (0.1 - 1)</label>
                    <input
                        id="resize-quality"
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="1"
                        value={quality}
                        onChange={(event) => setQuality(event.target.value)}
                    />
                </div>
                <label className="tool-checkbox">
                    <input
                        type="checkbox"
                        checked={keepAspect}
                        onChange={(event) => setKeepAspect(event.target.checked)}
                    />
                    Keep aspect ratio
                </label>
            </div>
        </GenericFileTool>
    );
}

export default ImageResizeTool;
