import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Lock, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

function PdfProtectTool({ tool, onFilesAdded }) {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);

    const handleFilesSelected = (files) => {
        setFile(files[0]);
        setDone(false);
        if (onFilesAdded) onFilesAdded(files);
    };

    const handleProcess = async () => {
        if (!file || !password) {
            alert('Please enter a password.');
            return;
        }
        setProcessing(true);
        try {
            const data = await pdfService.protectPDF(file, password);
            pdfService.downloadPDF(data, 'protected_document.pdf');
            setDone(true);
        } catch (error) {
            console.error('Protect error:', error);
            alert('Failed to protect PDF.');
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
            onReset={() => { setFile(null); setDone(false); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Protect PDF Now"
            sidebarTitle="Security Settings"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label><Lock size={14} /> Set Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters recommended"
                        />
                        <p className="tool-help"><ShieldAlert size={12} /> This adds a document open password.</p>
                    </div>
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CheckCircle size={64} className="text-success mb-3" />
                        <h3>PDF Protected!</h3>
                        <p className="text-muted">Your document has been encrypted with your password.</p>
                    </div>
                ) : (
                    <div className="file-item-horizontal w-full" style={{ maxWidth: '500px' }}>
                        <FileText size={24} className="text-danger" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfProtectTool;
