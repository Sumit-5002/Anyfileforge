import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import PageGrid from '../common/PageGrid';

function PdfSplitTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [extractMode, setExtractMode] = useState('selected');
    const [processing, setProcessing] = useState(false);
    const [pageCount, setPageCount] = useState(0);

    const handleFilesSelected = async (selectedFiles) => {
        const selectedFile = selectedFiles[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        const count = await pdfService.getPageCount(selectedFile);
        setPageCount(count);
        setSelectedPages(new Set());
        if (parentOnFilesAdded) parentOnFilesAdded(selectedFiles);
    };

    const handleSplit = async () => {
        setProcessing(true);
        try {
            let results = [];
            let pNums = [];

            if (extractMode === 'all') {
                results = await pdfService.splitPDF(file);
                pNums = Array.from({ length: pageCount }, (_, i) => i + 1);
            } else {
                pNums = Array.from(selectedPages).sort((a, b) => a - b);
                results = await pdfService.extractPages(file, pNums.map(n => n - 1));
            }

            results.forEach((data, i) => pdfService.downloadPDF(data, `split_page_${pNums[i]}.pdf`));
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
            onProcess={handleSplit}
            actionLabel="Split PDF Now"
            sidebar={
                <div className="sidebar-settings">
                    <div className="control-group">
                        <label className="sidebar-label">Split Mode</label>
                        <select value={extractMode} onChange={e => setExtractMode(e.target.value)} className="form-control">
                            <option value="selected">Extract Selected Pages</option>
                            <option value="all">Split Every Page</option>
                        </select>
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

export default PdfSplitTool;
