import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import PageGrid from '../common/PageGrid';
import { Trash2 } from 'lucide-react';

function PdfRemovePagesTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        setSelectedPages(new Set());
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const handleProcess = async () => {
        if (selectedPages.size === 0) {
            alert('Please select pages to remove.');
            return;
        }
        setProcessing(true);
        try {
            const indices = Array.from(selectedPages).sort((a, b) => a - b).map(n => n - 1);
            const data = await pdfService.removePages(file, indices);
            pdfService.downloadPDF(data, 'removed_pages_document.pdf');
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
            actionLabel="Remove Selected Pages"
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">Select the pages you want to delete from the PDF.</p>
                    <div className="selection-summary mt-5 flex items-center gap-3">
                        <Trash2 size={20} className="text-red-500" />
                        <span className="text-sm font-bold text-slate-300">
                            <strong className="text-red-500">{selectedPages.size}</strong> {selectedPages.size === 1 ? 'page' : 'pages'} flagged for removal
                        </span>
                    </div>
                </div>
            }
        >
            <PageGrid
                file={file}
                selectedPages={selectedPages}
                onTogglePage={(num) => {
                    const next = new Set(selectedPages);
                    next.has(num) ? next.delete(num) : next.add(num);
                    setSelectedPages(next);
                }}
            />
        </ToolWorkspace>
    );
}

export default PdfRemovePagesTool;
