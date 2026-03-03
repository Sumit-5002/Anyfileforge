import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileImage, Download, CheckCircle, FileText } from 'lucide-react';

function PdfToJpgTool({ tool, onFilesAdded }) {
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
            await pdfService.pdfToJpg(file);
            setDone(true);
        } catch (error) {
            console.error('PDF to JPG error:', error);
            alert('Failed to extract images from PDF.');
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
            actionLabel="Extract JPG Images"
            sidebarTitle="Export Settings"
            sidebar={
                <div className="sidebar-info">
                    <p className="tool-help">
                        This will convert each page of your PDF into high-quality JPG image and bundle them in a ZIP file.
                    </p>
                    <div className="mt-3 d-flex align-items-center gap-2">
                        <FileImage size={20} className="text-primary" />
                        <span className="small">Ready to export {file.name}</span>
                    </div>
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CheckCircle size={64} className="text-success mb-3" />
                        <h3>Extraction Complete!</h3>
                        <p className="text-muted">Your images have been downloaded as a ZIP file.</p>
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

export default PdfToJpgTool;
