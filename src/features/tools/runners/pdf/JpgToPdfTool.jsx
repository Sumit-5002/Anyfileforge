import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { ImageIcon, FileType } from 'lucide-react';
import '../common/ToolWorkspace.css';

function JpgToPdfTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        if (files.length === 0) return;
        setProcessing(true);
        try {
            const data = await pdfService.imagesToPDF(files);
            pdfService.downloadPDF(data, 'images_to_pdf.pdf');
        } finally {
            setProcessing(false);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} accept="image/jpeg,image/png" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => setFiles([])}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Convert Images to PDF"
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">All images will be combined into a single PDF document in the order listed.</p>
                    <div className="mt-3 d-flex align-items-center gap-2">
                        <FileType className="text-primary" size={20} />
                        <span>Creating PDF from <strong>{files.length}</strong> images</span>
                    </div>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <span className="file-index">{i + 1}</span>
                        <ImageIcon size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} aria-label={`Remove ${file.name}`}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default JpgToPdfTool;
