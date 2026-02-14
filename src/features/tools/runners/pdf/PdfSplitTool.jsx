import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import serverProcessingService from '../../../../services/serverProcessingService';
import { parsePageRange } from '../../../../utils/pageRange';
import GenericFileTool from '../common/GenericFileTool';

function PdfSplitTool({ tool }) {
    const [pageRange, setPageRange] = useState('');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Split PDF"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const maxPages = await pdfService.getPageCount(file);
                const range = pageRange.trim();

                if (!range) {
                    const pages = await pdfService.splitPDF(file);
                    return pages.map((data, index) => ({
                        type: 'pdf',
                        data,
                        name: `page_${index + 1}.pdf`
                    }));
                }

                const pageNumbers = parsePageRange(range, maxPages);
                if (pageNumbers.length === 0) {
                    throw new Error('Please provide a valid page range.');
                }
                if (tool.mode === 'server') {
                    const data = await serverProcessingService.splitPDF(file, range);
                    return {
                        type: 'pdf',
                        data,
                        name: `split_${range.replace(/\s+/g, '')}.pdf`
                    };
                }

                const indices = pageNumbers.map((n) => n - 1);
                const pages = await pdfService.extractPages(file, indices);
                return pages.map((data, index) => ({
                    type: 'pdf',
                    data,
                    name: `page_${pageNumbers[index]}.pdf`
                }));
            }}
        >
            <div className="tool-field">
                <label htmlFor="split-range">Page range (optional)</label>
                <input
                    id="split-range"
                    type="text"
                    value={pageRange}
                    onChange={(event) => setPageRange(event.target.value)}
                    placeholder="e.g. 1-3,5,7"
                />
                <small className="tool-help">Leave empty to split every page.</small>
            </div>
        </GenericFileTool>
    );
}

export default PdfSplitTool;
