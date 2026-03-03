import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Globe, Info } from 'lucide-react';
import '../common/ToolWorkspace.css';

function HtmlToPdfTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [urlInput, setUrlInput] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        if (urlInput) {
            alert('URL conversion requires "Server Mode". Please switch to Online Mode in the tool header if available.');
            return;
        }
        if (files.length === 0) return;
        setProcessing(true);
        try {
            const data = await pdfService.htmlToPDF(files[0]);
            pdfService.downloadPDF(data, files[0].name.replace(/\.[^/.]+$/, "") + ".pdf");
        } catch (error) {
            console.error('HTML to PDF error:', error);
            alert('Failed to convert HTML to PDF.');
        } finally {
            setProcessing(false);
        }
    };

    if (files.length === 0 && !urlInput) {
        return (
            <div className="html-to-pdf-selector">
                <div className="card fade-in mb-4" style={{ padding: '30px', textAlign: 'center' }}>
                    <Globe size={48} color="var(--primary-500)" style={{ margin: '0 auto 20px' }} />
                    <h3>Enter Webpage URL</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Convert any public webpage to a PDF. (Requires Server Connection)
                    </p>
                    <div style={{ display: 'flex', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
                        <input
                            type="url"
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            placeholder="https://example.com"
                            className="form-control"
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={handleProcess} disabled={!urlInput}>
                            Convert
                        </button>
                    </div>
                    <div className="mt-3" style={{ fontSize: '0.9rem', color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Info size={14} />
                        Requires Online Server Mode
                    </div>
                </div>

                <div className="divider"><span>OR UPLOAD FILE</span></div>

                <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} accept=".html,.htm" />
            </div>
        );
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => {
                setFiles([]);
                setUrlInput('');
            }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Convert HTML to PDF"
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">Convert HTML files or URLs to PDF documents.</p>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <Globe size={24} className="text-primary" />
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

export default HtmlToPdfTool;
