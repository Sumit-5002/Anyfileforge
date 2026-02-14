import React from 'react';
import pdfService from '../../../../services/pdfService';
import GenericFileTool from '../common/GenericFileTool';

function PdfRepairTool({ tool }) {
    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Repair PDF"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const data = await pdfService.rewritePDF(file);
                return { type: 'pdf', data, name: 'repaired_anyfileforge.pdf' };
            }}
        >
            <div className="tool-help">
                Repairs some PDFs by rebuilding the file structure. If the PDF is heavily corrupted, results may vary.
            </div>
        </GenericFileTool>
    );
}

export default PdfRepairTool;

