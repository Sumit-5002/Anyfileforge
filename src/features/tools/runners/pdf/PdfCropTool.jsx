import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import { parsePageRange } from '../../../../utils/pageRange';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Crop, FileText, Layout } from 'lucide-react';
import '../common/ToolWorkspace.css';

function PdfCropTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [margins, setMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
    const [pageRange, setPageRange] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const total = await pdfService.getPageCount(file);
            const range = pageRange.trim();
            const pageNumbers = range ? parsePageRange(range, total) : [];
            const indices = pageNumbers.map((n) => n - 1);

            const data = await pdfService.cropPages(file, {
                top: Number(margins.top) || 0,
                right: Number(margins.right) || 0,
                bottom: Number(margins.bottom) || 0,
                left: Number(margins.left) || 0
            }, indices);

            pdfService.downloadPDF(data, 'cropped_document.pdf');
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
            actionLabel="Apply Crop"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group">
                        <Crop size={14} />
                        <label>Crop Margins (pt)</label>
                    </div>

                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>Top</label>
                            <input type="number" value={margins.top} onChange={e => setMargins({ ...margins, top: e.target.value })} />
                        </div>
                        <div className="tool-field">
                            <label>Bottom</label>
                            <input type="number" value={margins.bottom} onChange={e => setMargins({ ...margins, bottom: e.target.value })} />
                        </div>
                    </div>

                    <div className="tool-inline">
                        <div className="tool-field">
                            <label>Left</label>
                            <input type="number" value={margins.left} onChange={e => setMargins({ ...margins, left: e.target.value })} />
                        </div>
                        <div className="tool-field">
                            <label>Right</label>
                            <input type="number" value={margins.right} onChange={e => setMargins({ ...margins, right: e.target.value })} />
                        </div>
                    </div>

                    <div className="tool-field mt-3">
                        <label><Layout size={14} /> Page Range</label>
                        <input
                            type="text"
                            value={pageRange}
                            onChange={e => setPageRange(e.target.value)}
                            placeholder="e.g. 1-5, 8 (blank for all)"
                        />
                    </div>
                </div>
            }
        >
            <div className="file-item-horizontal">
                <FileText size={24} className="text-danger" />
                <div className="file-item-info">
                    <div className="file-item-name">{file.name}</div>
                    <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
            </div>
            <div className="tool-help text-center mt-4">
                Crop margins are applied relative to the current MediaBox. 1pt = 1/72 inch.
            </div>
        </ToolWorkspace>
    );
}

export default PdfCropTool;
