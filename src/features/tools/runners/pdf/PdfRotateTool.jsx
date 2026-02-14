import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import { parsePageRange } from '../../../../utils/pageRange';
import GenericFileTool from '../common/GenericFileTool';

function PdfRotateTool({ tool }) {
    const [angle, setAngle] = useState('90');
    const [pageRange, setPageRange] = useState('');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Rotate PDF"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const total = await pdfService.getPageCount(file);
                const range = pageRange.trim();
                const pageNumbers = range ? parsePageRange(range, total) : [];
                const indices = pageNumbers.map((n) => n - 1);
                const data = await pdfService.rotatePages(file, indices, Number(angle));
                return { type: 'pdf', data, name: 'rotated_anyfileforge.pdf' };
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="rotate-angle">Rotation</label>
                    <select
                        id="rotate-angle"
                        value={angle}
                        onChange={(event) => setAngle(event.target.value)}
                    >
                        <option value="90">90° clockwise</option>
                        <option value="180">180°</option>
                        <option value="270">270° clockwise</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="rotate-range">Page range (optional)</label>
                    <input
                        id="rotate-range"
                        type="text"
                        value={pageRange}
                        onChange={(event) => setPageRange(event.target.value)}
                        placeholder="e.g. 1-3"
                    />
                </div>
            </div>
        </GenericFileTool>
    );
}

export default PdfRotateTool;
