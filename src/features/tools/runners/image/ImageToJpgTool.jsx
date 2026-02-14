import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageToJpgTool({ tool }) {
    const [quality, setQuality] = useState('0.9');

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple
            actionLabel="Convert to JPG"
            onProcess={async ({ items }) => {
                const results = [];
                for (const item of items) {
                    const blob = await imageService.convertImage(
                        item.file,
                        'image/jpeg',
                        Math.min(1, Math.max(0.1, Number(quality) || 0.9))
                    );
                    results.push({
                        type: 'image',
                        data: blob,
                        name: `${getBaseName(item.name)}.jpg`
                    });
                }
                return results;
            }}
        >
            <div className="tool-field">
                <label htmlFor="jpg-quality">Quality (0.1 - 1)</label>
                <input
                    id="jpg-quality"
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1"
                    value={quality}
                    onChange={(event) => setQuality(event.target.value)}
                />
            </div>
        </GenericFileTool>
    );
}

export default ImageToJpgTool;
