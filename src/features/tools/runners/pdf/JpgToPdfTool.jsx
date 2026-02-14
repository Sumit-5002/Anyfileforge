import React from 'react';
import pdfService from '../../../../services/pdfService';
import GenericFileTool from '../common/GenericFileTool';

function JpgToPdfTool({ tool }) {
    return (
        <GenericFileTool
            tool={tool}
            accept="image/jpeg,image/png"
            multiple
            canReorder
            actionLabel="Convert to PDF"
            onProcess={async ({ files }) => {
                const data = await pdfService.imagesToPDF(files);
                return { type: 'pdf', data, name: 'images_anyfileforge.pdf' };
            }}
        >
            <div className="tool-help">
                Supports JPG or PNG. The order you upload is the order of pages.
            </div>
        </GenericFileTool>
    );
}

export default JpgToPdfTool;
