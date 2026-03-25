import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { ShieldCheck, FileText, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import '../common/ToolWorkspace.css';

function PdfRepairTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        setCompleted(false);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleMove = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= files.length) return;
        const newFiles = [...files];
        const [moved] = newFiles.splice(index, 1);
        newFiles.splice(newIndex, 0, moved);
        setFiles(newFiles);
    };

    const handlePreview = (file) => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            for (const file of files) {
                const data = await pdfService.rewritePDF(file);
                pdfService.downloadPDF(data, `${file.name.replace('.pdf', '')}_repaired.pdf`);
            }
            setCompleted(true);
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
            onReset={() => { setFiles([]); setCompleted(false); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel={files.length > 1 ? `Repair All (${files.length})` : "Repair PDF"}
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">Rebuilding internal structure to fix minor corruptions or compatibility issues.</p>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <FileText size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <div className="file-item-actions">
                            <button className="btn-icon" onClick={() => handlePreview(file)} title="Preview source">
                                <Eye size={16} />
                            </button>
                            <div className="reorder-buttons">
                                <button className="btn-icon" onClick={() => handleMove(i, -1)} disabled={i === 0}><ChevronUp size={14} /></button>
                                <button className="btn-icon" onClick={() => handleMove(i, 1)} disabled={i === files.length - 1}><ChevronDown size={14} /></button>
                            </div>
                            {completed && <div className="status-badge"><ShieldCheck size={14} /> Fixed!</div>}
                            <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} title="Remove file">×</button>
                        </div>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default PdfRepairTool;
