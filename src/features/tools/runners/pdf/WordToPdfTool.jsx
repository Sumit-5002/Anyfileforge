import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileText, FileType } from 'lucide-react';
import '../common/ToolWorkspace.css';

function WordToPdfTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        if (files.length === 0) return;
        setProcessing(true);
        setProgress(0);
        try {
            // Process the first file for simplicity in this version
            const data = await pdfService.wordToPDF(files[0], (p) => setProgress(p));
            const outputName = files[0].name.replace(/\.[^/.]+$/, '') + '.pdf';
            pdfService.downloadPDF(data, outputName);
        } catch (err) {
            console.error('Word to PDF error:', err);
            alert('Failed to convert Word to PDF. Please ensure the file is a valid .docx document.');
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} accept=".docx" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => setFiles([])}
            processing={processing}
            progress={progress}
            onProcess={handleProcess}
            actionLabel="Convert Word to PDF"
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">This tool converts DOCX files to PDF directly in your browser.</p>
                    <div className="mt-3 d-flex align-items-center gap-2">
                        <FileType className="text-primary" size={20} />
                        <span>Ready to convert <strong>{files[0].name}</strong></span>
                    </div>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <FileText size={24} className="text-primary" />
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

export default WordToPdfTool;
