import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import { parsePageRange } from '../../../../utils/pageRange';
import GenericFileTool from '../common/GenericFileTool';

function PdfRemovePagesTool({ tool }) {
    const [pageRange, setPageRange] = useState('');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Remove Pages"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const total = await pdfService.getPageCount(file);
                const pageNumbers = parsePageRange(pageRange.trim(), total);
                if (!pageNumbers.length) {
                    throw new Error('Provide the pages you want to remove.');
                }
                const indices = pageNumbers.map((n) => n - 1);
                const data = await pdfService.removePages(file, indices);
                return {
                    type: 'pdf',
                    data,
                    name: 'pages_removed_anyfileforge.pdf'
                };
            }}
        >
            <div className="tool-field">
                <label htmlFor="remove-range">Pages to remove</label>
                <input
                    id="remove-range"
                    type="text"
                    value={pageRange}
                    onChange={(event) => setPageRange(event.target.value)}
                    placeholder="e.g. 2,4-6"
                />
            </div>
        </GenericFileTool>
    );
}

export default PdfRemovePagesTool;
