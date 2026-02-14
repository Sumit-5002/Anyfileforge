import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import { parsePageRange } from '../../../../utils/pageRange';
import GenericFileTool from '../common/GenericFileTool';

function PdfCropTool({ tool }) {
    const [top, setTop] = useState('0');
    const [right, setRight] = useState('0');
    const [bottom, setBottom] = useState('0');
    const [left, setLeft] = useState('0');
    const [pageRange, setPageRange] = useState('');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Crop PDF"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const total = await pdfService.getPageCount(file);
                const range = pageRange.trim();
                const pageNumbers = range ? parsePageRange(range, total) : [];
                const indices = pageNumbers.map((n) => n - 1);
                const data = await pdfService.cropPages(file, {
                    top: Number(top) || 0,
                    right: Number(right) || 0,
                    bottom: Number(bottom) || 0,
                    left: Number(left) || 0
                }, indices);
                return { type: 'pdf', data, name: 'cropped_anyfileforge.pdf' };
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="crop-top">Top (pt)</label>
                    <input
                        id="crop-top"
                        type="number"
                        min="0"
                        value={top}
                        onChange={(event) => setTop(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="crop-right">Right (pt)</label>
                    <input
                        id="crop-right"
                        type="number"
                        min="0"
                        value={right}
                        onChange={(event) => setRight(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="crop-bottom">Bottom (pt)</label>
                    <input
                        id="crop-bottom"
                        type="number"
                        min="0"
                        value={bottom}
                        onChange={(event) => setBottom(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="crop-left">Left (pt)</label>
                    <input
                        id="crop-left"
                        type="number"
                        min="0"
                        value={left}
                        onChange={(event) => setLeft(event.target.value)}
                    />
                </div>
            </div>
            <div className="tool-field">
                <label htmlFor="crop-range">Page range (optional)</label>
                <input
                    id="crop-range"
                    type="text"
                    value={pageRange}
                    onChange={(event) => setPageRange(event.target.value)}
                    placeholder="e.g. 1-3"
                />
            </div>
        </GenericFileTool>
    );
}

export default PdfCropTool;
