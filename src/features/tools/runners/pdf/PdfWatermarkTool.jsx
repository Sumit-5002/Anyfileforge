import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import GenericFileTool from '../common/GenericFileTool';

function PdfWatermarkTool({ tool }) {
    const [text, setText] = useState('CONFIDENTIAL');
    const [opacity, setOpacity] = useState('0.2');
    const [angle, setAngle] = useState('30');
    const [size, setSize] = useState('48');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Add Watermark"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const data = await pdfService.addWatermarkText(file, {
                    text,
                    opacity: Math.min(1, Math.max(0, Number(opacity) || 0.2)),
                    angle: Number(angle) || 30,
                    fontSize: Number(size) || 48
                });
                return { type: 'pdf', data, name: 'watermarked_anyfileforge.pdf' };
            }}
        >
            <div className="tool-field">
                <label htmlFor="wm-text">Watermark text</label>
                <input
                    id="wm-text"
                    type="text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                />
            </div>
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="wm-opacity">Opacity (0-1)</label>
                    <input
                        id="wm-opacity"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={opacity}
                        onChange={(event) => setOpacity(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="wm-angle">Angle</label>
                    <input
                        id="wm-angle"
                        type="number"
                        value={angle}
                        onChange={(event) => setAngle(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="wm-size">Font size</label>
                    <input
                        id="wm-size"
                        type="number"
                        value={size}
                        onChange={(event) => setSize(event.target.value)}
                    />
                </div>
            </div>
        </GenericFileTool>
    );
}

export default PdfWatermarkTool;
