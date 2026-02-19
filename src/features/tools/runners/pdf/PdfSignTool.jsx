import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Type, MousePointer2, FileText, ImageIcon } from 'lucide-react';
import '../common/ToolWorkspace.css';

function PdfSignTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [x, setX] = useState(50);
    const [y, setY] = useState(50);
    const [width, setWidth] = useState(160);
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        const pdfFile = files.find(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        const imageFile = files.find(f => f.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(f.name));

        if (!pdfFile || !imageFile) {
            alert('Please upload exactly 1 PDF and 1 signature image (PNG/JPG).');
            return;
        }

        setProcessing(true);
        try {
            const data = await pdfService.addSignatureImage(pdfFile, imageFile, {
                pageNumber: Number(pageNumber),
                x: Number(x),
                y: Number(y),
                width: Number(width)
            });
            pdfService.downloadPDF(data, 'signed_document.pdf');
        } finally {
            setProcessing(false);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} accept="application/pdf,image/*" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => setFiles([])}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Sign PDF"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label><FileText size={14} /> Page Number</label>
                        <input type="number" min="1" value={pageNumber} onChange={e => setPageNumber(e.target.value)} />
                    </div>

                    <div className="tool-inline">
                        <div className="tool-field">
                            <label><MousePointer2 size={14} /> X Pos (pt)</label>
                            <input type="number" value={x} onChange={e => setX(e.target.value)} />
                        </div>
                        <div className="tool-field">
                            <label><MousePointer2 size={14} /> Y Pos (pt)</label>
                            <input type="number" value={y} onChange={e => setY(e.target.value)} />
                        </div>
                    </div>

                    <div className="tool-field">
                        <label><Type size={14} /> Signature Width</label>
                        <input type="number" min="10" value={width} onChange={e => setWidth(e.target.value)} />
                    </div>

                    <p className="tool-help">Coordinates start from the bottom-left corner of the page.</p>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        {file.type === 'application/pdf' ? <FileText size={24} className="text-danger" /> : <ImageIcon size={24} className="text-primary" />}
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default PdfSignTool;
