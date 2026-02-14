import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import { parsePageRange } from '../../../../utils/pageRange';
import GenericFileTool from '../common/GenericFileTool';

const parseRects = (input) => {
    const raw = String(input || '').trim();
    if (!raw) return [];
    return raw
        .split(/[;\n]+/g)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.split(',').map((v) => Number(v.trim())))
        .filter((nums) => nums.length === 4 && nums.every((n) => Number.isFinite(n)))
        .map(([x, y, width, height]) => ({ x, y, width, height }));
};

function PdfRedactTool({ tool }) {
    const [pageRange, setPageRange] = useState('');
    const [rects, setRects] = useState('50,50,200,30');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Redact PDF"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const total = await pdfService.getPageCount(file);

                const range = pageRange.trim();
                const pageNumbers = range ? parsePageRange(range, total) : [];
                const pageIndices = pageNumbers.map((n) => n - 1);

                const rectList = parseRects(rects);
                if (rectList.length === 0) {
                    throw new Error('Add at least one rectangle as: x,y,width,height');
                }

                const data = await pdfService.redactPDF(file, rectList, pageIndices);
                return { type: 'pdf', data, name: 'redacted_anyfileforge.pdf' };
            }}
        >
            <div className="tool-field">
                <label htmlFor="redact-range">Page range (optional)</label>
                <input
                    id="redact-range"
                    type="text"
                    value={pageRange}
                    onChange={(event) => setPageRange(event.target.value)}
                    placeholder="e.g. 1-2,5"
                />
            </div>
            <div className="tool-field">
                <label htmlFor="redact-rects">Redaction rectangles</label>
                <textarea
                    id="redact-rects"
                    rows="4"
                    value={rects}
                    onChange={(event) => setRects(event.target.value)}
                    placeholder="x,y,width,height; x,y,width,height"
                />
                <small className="tool-help">
                    Coordinates are in PDF points (1/72 inch), origin at bottom-left. Separate multiple rectangles with semicolons or new lines.
                </small>
            </div>
        </GenericFileTool>
    );
}

export default PdfRedactTool;

