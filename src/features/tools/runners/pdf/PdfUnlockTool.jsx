import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { LockOpen, ShieldAlert, FileText, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import '../common/ToolWorkspace.css';

function PdfUnlockTool({ tool, onFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [password, setPassword] = useState('');
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        setDone(false);
        if (onFilesAdded) onFilesAdded(newFiles);
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
        if (files.length === 0) return;
        setProcessing(true);
        try {
            for (const file of files) {
                const data = await pdfService.unlockPDF(file, password || undefined);
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                pdfService.downloadPDF(data, `${baseName}_unlocked.pdf`);
            }
            setDone(true);
        } catch (error) {
            console.error('Unlock error:', error);
            alert(error?.message || 'Failed to unlock PDF. Please check the password.');
        } finally {
            setProcessing(false);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} accept="application/pdf" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => {
                setFiles([]);
                setDone(false);
            }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel={files.length > 1 ? `Unlock Batch (${files.length})` : "Unlock PDF Now"}
            sidebar={
                <div className="sidebar-info">
                    <div className="tool-field">
                        <label><LockOpen size={14} className="inline mr-1" /> Source Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Unlock password"
                            disabled={processing}
                        />
                        <p className="tool-help mt-2" style={{ fontSize: '0.8rem' }}>
                            <ShieldAlert size={12} className="inline mr-1" /> 
                            We do not upload or store your passwords. Processing is entirely local.
                        </p>
                    </div>
                </div>
            }
        >
            <div className="files-list-view">
                {done ? (
                    <div className="fade-in text-center py-5">
                        <LockOpen size={64} className="text-success mb-3 mx-auto" />
                        <h3>Unlocking Complete</h3>
                        <p className="text-muted">All documents have been unlocked and downloaded.</p>
                    </div>
                ) : (
                    files.map((file, i) => (
                        <div key={i} className="file-item-horizontal">
                            <FileText size={24} className="text-danger" />
                            <div className="file-item-info">
                                <div className="file-item-name font-mono">{file.name}</div>
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
                                <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} title="Remove file">×</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfUnlockTool;
