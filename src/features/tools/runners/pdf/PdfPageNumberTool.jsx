import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { ListOrdered, Type, Move, FileText } from 'lucide-react';
import '../common/ToolWorkspace.css';

function PdfPageNumberTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [startAt, setStartAt] = useState(1);
    const [position, setPosition] = useState('bottom-right');
    const [fontSize, setFontSize] = useState(12);
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const data = await pdfService.addPageNumbers(file, {
                startAt: Number(startAt),
                position,
                fontSize: Number(fontSize)
            });
            pdfService.downloadPDF(data, 'page_numbered_document.pdf');
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
            actionLabel="Add Page Numbers"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label><ListOrdered size={14} /> Start At</label>
                        <input type="number" min="1" value={startAt} onChange={e => setStartAt(e.target.value)} />
                    </div>

                    <div className="tool-field">
                        <label><Move size={14} /> Position</label>
                        <select value={position} onChange={e => setPosition(e.target.value)}>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-right">Top Right</option>
                        </select>
                    </div>

                    <div className="tool-field">
                        <label><Type size={14} /> Font Size (pt)</label>
                        <input type="number" min="6" max="72" value={fontSize} onChange={e => setFontSize(e.target.value)} />
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
        </ToolWorkspace>
    );
}

export default PdfPageNumberTool;
