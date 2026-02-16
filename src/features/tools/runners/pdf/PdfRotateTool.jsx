import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import PageGrid from '../common/PageGrid';
import { RotateCw } from 'lucide-react';

function PdfRotateTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [rotations, setRotations] = useState({}); // pageNum -> degrees
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        setRotations({});
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const handleRotatePage = (pageNum) => {
        setRotations(prev => ({
            ...prev,
            [pageNum]: ((prev[pageNum] || 0) + 90) % 360
        }));
    };


    const handleProcess = async () => {
        setProcessing(true);
        try {
            // Find modified pages
            const changed = Object.entries(rotations).filter(([, deg]) => deg !== 0);
            if (changed.length === 0) {
                alert('No pages rotated.');
                return;
            }

            // For now, if all angles are the same or we just rotate what's selected
            const firstAngle = changed[0][1];
            const indices = changed.map(([num]) => Number(num) - 1);

            const data = await pdfService.rotatePages(file, indices, firstAngle);
            pdfService.downloadPDF(data, 'rotated_document.pdf');
        } finally {
            setProcessing(false);
        }
    };

    if (!file) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={[file]}
            onReset={() => setFile(null)}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Apply Rotations"
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">Click the <strong>⟳</strong> icon on a page to rotate it clockwise.</p>
                    <div className="mt-3 d-flex align-items-center gap-2">
                        <RotateCw size={18} className="text-primary" />
                        <span><strong>{Object.keys(rotations).filter(k => rotations[k] !== 0).length}</strong> pages rotated</span>
                    </div>
                </div>
            }
        >
            <PageGrid
                file={file}
                rotations={rotations}
                onRotatePage={handleRotatePage}
            />
        </ToolWorkspace>
    );
}

export default PdfRotateTool;
