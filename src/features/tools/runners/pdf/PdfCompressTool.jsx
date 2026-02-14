import React from 'react';
import pdfService from '../../../../services/pdfService';
import serverProcessingService from '../../../../services/serverProcessingService';
import GenericFileTool from '../common/GenericFileTool';

function PdfCompressTool({ tool }) {
    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Compress PDF"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const data = tool.mode === 'server'
                    ? await serverProcessingService.compressPDF(file)
                    : await pdfService.rewritePDF(file);
                return { type: 'pdf', data, name: 'compressed_anyfileforge.pdf' };
            }}
        >
            <div className="tool-field">
                <label>Compression note</label>
                <div className="tool-help">
                    This locally rebuilds your PDF to reduce overhead when possible. Results vary by file.
                </div>
            </div>
        </GenericFileTool>
    );
}

export default PdfCompressTool;
