import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { LockOpen, ShieldAlert, FileText } from 'lucide-react';
import '../common/ToolWorkspace.css';

function PdfUnlockTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const data = await pdfService.unlockPDF(file, password || undefined);
            pdfService.downloadPDF(data, 'unlocked_document.pdf');
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
            onReset={() => setFile(null)}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Unlock PDF Now"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label><LockOpen size={14} /> Source Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password to unlock"
                        />
                        <p className="tool-help"><ShieldAlert size={12} /> We do not store your passwords.</p>
                    </div>
                </div>
            }
        >
            <div className="file-item-horizontal">
                <FileText size={24} className="text-danger" />
                <div className="file-item-info">
                    <div className="file-item-name">{file.name}</div>
                    <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
            </div>
        </ToolWorkspace>
    );
}

export default PdfUnlockTool;
