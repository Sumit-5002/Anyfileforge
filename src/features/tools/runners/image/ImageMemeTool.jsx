import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import GenericFileTool from '../common/GenericFileTool';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageMemeTool({ tool }) {
    const [topText, setTopText] = useState('');
    const [bottomText, setBottomText] = useState('');
    const [fontSize, setFontSize] = useState('42');

    return (
        <GenericFileTool
            tool={tool}
            accept="image/*"
            multiple={false}
            actionLabel="Create Meme"
            onProcess={async ({ items }) => {
                const item = items[0];
                if (!item) throw new Error('Please upload an image.');
                const blob = await imageService.memeImage(item.file, topText, bottomText, {
                    fontSize: Number(fontSize) || 42
                });
                return {
                    type: 'image',
                    data: blob,
                    name: `${getBaseName(item.name)}_meme.png`
                };
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="meme-top">Top text</label>
                    <input
                        id="meme-top"
                        type="text"
                        value={topText}
                        onChange={(event) => setTopText(event.target.value)}
                        placeholder="Top text"
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="meme-bottom">Bottom text</label>
                    <input
                        id="meme-bottom"
                        type="text"
                        value={bottomText}
                        onChange={(event) => setBottomText(event.target.value)}
                        placeholder="Bottom text"
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="meme-size">Font size</label>
                    <input
                        id="meme-size"
                        type="number"
                        min="12"
                        value={fontSize}
                        onChange={(event) => setFontSize(event.target.value)}
                    />
                </div>
            </div>
        </GenericFileTool>
    );
}

export default ImageMemeTool;
