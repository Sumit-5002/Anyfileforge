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
    const [language, setLanguage] = useState('eng');

    const handleFilesSelected = (files) => {
        setFile(files[0] || null);
        setDone(false);
        if (onFilesAdded) onFilesAdded(files);
    };

    const handleProcess = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            const blob = await serverProcessingService.ocrPDF(file, { language });
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            pdfService.downloadBlob(blob, `${baseName}_ocr.pdf`);
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
                        Runs OCR and returns a searchable PDF with selectable text layer.
                    </p>
                    <div className="tool-field mt-2">
                        <label>OCR Language</label>
                        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                            <option value="eng">English</option>
                            <option value="hin">Hindi</option>
                        </select>
                    </div>
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CircleCheck size={64} className="text-success mb-3" />
                        <h3>OCR Complete</h3>
                        <p className="text-muted">Searchable PDF has been downloaded.</p>
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
