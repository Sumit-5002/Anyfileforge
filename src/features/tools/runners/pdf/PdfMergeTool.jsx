import React from 'react';
import FileUploader from '../../../../components/ui/FileUploader';

function PdfMergeTool({ tool }) {
    return (
        <FileUploader
            tool={tool}
            customLayout={true}
        />
    );
}

export default PdfMergeTool;
