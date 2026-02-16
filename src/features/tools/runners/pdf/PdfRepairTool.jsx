import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { ShieldCheck, FileText } from 'lucide-react';
import '../common/ToolWorkspace.css';

function PdfRepairTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        setCompleted(false);
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const data = await pdfService.rewritePDF(file);
            pdfService.downloadPDF(data, 'repaired_document.pdf');
            setCompleted(true);
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
            onReset={() => { setFile(null); setCompleted(false); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Repair PDF"
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">Rebuilding internal structure to fix minor corruptions or compatibility issues.</p>
                </div>
            }
        >
            <div className="file-item-horizontal">
                <FileText size={24} className="text-primary" />
                <div className="file-item-info">
                    <div className="file-item-name">{file.name}</div>
                    <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                {completed && <div className="status-badge"><ShieldCheck size={14} /> Fixed!</div>}
            </div>
        </ToolWorkspace>
    );
}

export default PdfRepairTool;
