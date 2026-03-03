import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileText, CheckCircle, Download } from 'lucide-react';

function PdfToWordTool({ tool, onFilesAdded }) {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);

    const handleFilesSelected = (files) => {
        setFile(files[0]);
        setDone(false);
        if (onFilesAdded) onFilesAdded(files);
    };

    const handleProcess = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            const data = await pdfService.pdfToWord(file);
            pdfService.downloadBlob(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), file.name.replace('.pdf', '.docx'));
            setDone(true);
        } catch (error) {
            console.error('PDF to Word error:', error);
            alert('Failed to convert PDF to Word. Note: Only text-based PDFs are supported for offline conversion.');
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
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFile(null); setDone(false); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Convert to Word"
            sidebarTitle="Conversion Settings"
            sidebar={
                <div className="sidebar-info">
                    <p className="tool-help">
                        This tool extracts text layout from your PDF and creates a new .docx file.
                    </p>
                    <div className="mt-3 d-flex align-items-center gap-2">
                        <FileText size={20} className="text-primary" />
                        <span className="small">Ready to convert {file.name}</span>
                    </div>
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CheckCircle size={64} className="text-success mb-3" />
                        <h3>Conversion Successful!</h3>
                        <p className="text-muted">Your Word document is ready.</p>
                    </div>
                ) : (
                    <div className="file-item-horizontal w-full" style={{ maxWidth: '500px' }}>
                        <FileText size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfToWordTool;
