import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageFromJpgTool({ tool }) {
    const [format, setFormat] = useState('image/png');
    const [quality, setQuality] = useState('0.9');

    const extension = format === 'image/webp' ? 'webp' : 'png';

    return (
        <GenericFileTool
            tool={tool}
            accept="image/jpeg"
            multiple
            actionLabel="Convert from JPG"
            onProcess={async ({ items }) => {
                const results = [];
                for (const item of items) {
                    const blob = await imageService.convertImage(
                        item.file,
                        format,
                        Math.min(1, Math.max(0.1, Number(quality) || 0.9))
                    );
                    results.push({
                        type: 'image',
                        data: blob,
                        name: `${getBaseName(item.name)}.${extension}`
                    });
                }
                return results;
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="from-jpg-format">Output format</label>
                    <select
                        id="from-jpg-format"
                        value={format}
                        onChange={(event) => setFormat(event.target.value)}
                    >
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="from-jpg-quality">Quality (0.1 - 1)</label>
                    <input
                        id="from-jpg-quality"
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

export default ImageFromJpgTool;
