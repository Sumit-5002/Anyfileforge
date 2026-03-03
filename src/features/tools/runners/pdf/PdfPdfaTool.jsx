import React, { useState } from 'react';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import serverProcessingService from '../../../../services/serverProcessingService';
import pdfService from '../../../../services/pdfService';
import { FileClock, CircleCheck, Archive } from 'lucide-react';

function PdfPdfaTool({ tool, onFilesAdded }) {
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
            const blob = await serverProcessingService.convertToPdfA(file);
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            pdfService.downloadBlob(blob, `${baseName}_pdfa.pdf`);
            setDone(true);
        } catch (error) {
            console.error('PDF/A conversion error:', error);
            alert(error.message || 'Failed to convert PDF.');
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
            actionLabel="Convert to PDF/A"
            sidebar={
                <div className="sidebar-info">
                    <p className="tool-help">
                        Server converts the PDF using compatibility rewrite settings suitable for archival workflows.
                    </p>
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CircleCheck size={64} className="text-success mb-3" />
                        <h3>Conversion Complete</h3>
                        <p className="text-muted">PDF/A-compatible file has been downloaded.</p>
                    </div>
                ) : (
                    <div className="file-item-horizontal w-full" style={{ maxWidth: '520px' }}>
                        <FileClock size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <Archive size={20} className="text-primary" />
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfPdfaTool;

