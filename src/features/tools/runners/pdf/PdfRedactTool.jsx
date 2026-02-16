import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import { parsePageRange } from '../../../../utils/pageRange';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { ShieldAlert, Layout, Square, FileText } from 'lucide-react';
import '../common/ToolWorkspace.css';

const parseRects = (input) => {
    const raw = String(input || '').trim();
    if (!raw) return [];
    return raw
        .split(/[;\n]+/g)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.split(',').map((v) => Number(v.trim())))
        .filter((nums) => nums.length === 4 && nums.every((n) => Number.isFinite(n)))
        .map(([x, y, width, height]) => ({ x, y, width, height }));
};

function PdfRedactTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [pageRange, setPageRange] = useState('');
    const [rects, setRects] = useState('50,50,200,30');
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
            const pageIndices = pageNumbers.map((n) => n - 1);

            const rectList = parseRects(rects);
            if (rectList.length === 0) throw new Error('Add at least one rectangle.');

            const data = await pdfService.redactPDF(file, rectList, pageIndices);
            pdfService.downloadPDF(data, 'redacted_document.pdf');
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
            actionLabel="Apply Redaction"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label><Square size={14} /> Redaction Rectangles</label>
                        <textarea
                            rows="4"
                            value={rects}
                            onChange={(e) => setRects(e.target.value)}
                            placeholder="x,y,width,height"
                        />
                        <p className="tool-help">Format: x, y, width, height. Multiple boxes separated by semicolons.</p>
                    </div>

                    <div className="tool-field">
                        <label><Layout size={14} /> Page Range</label>
                        <input
                            type="text"
                            value={pageRange}
                            onChange={e => setPageRange(e.target.value)}
                            placeholder="e.g. 1, 3-5 (blank for all)"
                        />
                    </div>

                    <div className="alert-mini danger mt-3">
                        <ShieldAlert size={14} />
                        <span>This permanently covers data.</span>
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
                Redaction adds a black opaque layer over specified coordinates. Coordinates are in points (1/72").
            </div>
        </ToolWorkspace>
    );
}

export default PdfRedactTool;
