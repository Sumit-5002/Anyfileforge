import React, { useState } from 'react';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import serverProcessingService from '../../../../services/serverProcessingService';
import pdfService from '../../../../services/pdfService';
import { ScanText, CircleCheck, FileText } from 'lucide-react';

function PdfOcrTool({ tool, onFilesAdded }) {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);

    const handleFilesSelected = (files) => {
        setFile(files[0] || null);
        setDone(false);
        if (onFilesAdded) onFilesAdded(files);
    };

    const handleProcess = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            const blob = await serverProcessingService.ocrPDF(file);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            pdfService.downloadBlob(blob, `${baseName}_ocr.txt`);
            setDone(true);
        } catch (error) {
            console.error('OCR error:', error);
            alert(error.message || 'Failed to run OCR extraction.');
        } finally {
            setProcessing(false);
        }
    };

    if (!file) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} accept="application/pdf" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={[file]}
            onFilesSelected={handleFilesSelected}
            onReset={() => {
                setFile(null);
                setDone(false);
            }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Run OCR"
            sidebar={
                <div className="sidebar-info">
                    <p className="tool-help">
                        Extract text from uploaded PDF using server processing. Output is downloaded as a `.txt` file.
                    </p>
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CircleCheck size={64} className="text-success mb-3" />
                        <h3>OCR Complete</h3>
                        <p className="text-muted">Extracted text has been downloaded.</p>
                    </div>
                ) : (
                    <div className="file-item-horizontal w-full" style={{ maxWidth: '520px' }}>
                        <FileText size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <ScanText size={20} className="text-primary" />
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfOcrTool;

