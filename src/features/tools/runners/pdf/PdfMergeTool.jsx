import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileText, ArrowUpDown, ListOrdered } from 'lucide-react';
import '../common/ToolWorkspace.css';

function PdfMergeTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            alert('Please select at least 2 PDF files to merge.');
            return;
        }
        setProcessing(true);
        try {
            const data = tool.mode === 'server'
                ? await serverProcessingService.mergePDFs(files)
                : await pdfService.mergePDFs(files);

            pdfService.downloadPDF(data, 'merged_document.pdf');
        } catch (error) {
            console.error('Merge error:', error);
            alert('Failed to merge PDFs.');
        } finally {
            setProcessing(false);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => setFiles([])}
            processing={processing}
            onProcess={handleMerge}
            actionLabel="Merge PDF"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group">
                        <ListOrdered size={14} />
                        <label>Merge Queue</label>
                    </div>
                    <div className="order-summary mt-2">
                        <ArrowUpDown size={16} />
                        <span>{files.length} PDFs Selected</span>
                    </div>
                    <p className="tool-help mt-3">
                        PDFs will be merged in the order shown on the left. You can add more files or remove items before processing.
                    </p>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <span className="file-index">{i + 1}</span>
                        <FileText size={24} className="text-danger" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <button
                            className="btn-icon-danger"
                            onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default PdfMergeTool;
