import React, { useState } from 'react';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileType, FileText, CircleCheck, Download, FileSpreadsheet, Presentation, Globe, Image } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import '../common/ToolWorkspace.css';

const EXTENSION_MAP = {
    'word-to-pdf': '.pdf',
    'excel-to-pdf': '.pdf',
    'pp-to-pdf': '.pdf',
    'html-to-pdf': '.pdf',
    'pdf-to-word': '.docx',
    'pdf-to-excel': '.xlsx',
    'pdf-to-pp': '.pptx',
    'pdf-to-jpg': '.jpg',
};

const MIME_MAP = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg'
};

const getIcon = (id) => {
    if (id.includes('word')) return <FileText size={24} className="text-primary" />;
    if (id.includes('excel')) return <FileSpreadsheet size={24} className="text-primary" />;
    if (id.includes('pp')) return <Presentation size={24} className="text-primary" />;
    if (id.includes('html')) return <Globe size={24} className="text-primary" />;
    if (id.includes('jpg')) return <Image size={24} className="text-primary" />;
    return <FileType size={24} className="text-primary" />;
};

function SimulationRunner({ tool, onFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [urlInput, setUrlInput] = useState('');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [done, setDone] = useState(false);
    const [resultUrl, setResultUrl] = useState(null);
    const [resultName, setResultName] = useState('');

    const isHtml = tool.id === 'html-to-pdf';

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (onFilesAdded) onFilesAdded(newFiles);
    };

    const generateDummyFile = async (baseName, ext) => {
        if (ext === '.pdf') {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            page.drawText('Converted in Offline Mode (Demo)', { x: 50, y: 700, size: 24 });
            const pdfBytes = await pdfDoc.save();
            return new Blob([pdfBytes], { type: 'application/pdf' });
        }

        // For other files, return a plain text file pretending to be the format
        // In a real scenario, this would be a proper zip/xml structure
        return new Blob(['Simulated offline conversion data'], { type: MIME_MAP[ext] });
    };

    const handleProcess = async () => {
        if (!isHtml && files.length === 0) return;
        if (isHtml && !urlInput) return;

        setProcessing(true);
        setDone(false);
        setProgress(0);

        // Simulate progress for UI wow-factor
        for (let i = 0; i <= 100; i += 5) {
            setProgress(i);
            await new Promise(r => setTimeout(r, 100)); // 2s total
        }

        const ext = EXTENSION_MAP[tool.id] || '.pdf';
        const baseName = isHtml ? 'webpage' : files[0]?.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}_converted${ext}`;

        const blob = await generateDummyFile(baseName, ext);
        const url = URL.createObjectURL(blob);

        setResultUrl(url);
        setResultName(filename);
        setProcessing(false);
        setDone(true);
    };

    const handleDownload = () => {
        if (!resultUrl) return;
        const link = document.createElement('a');
        link.href = resultUrl;
        link.download = resultName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // HTML to PDF specific input View
    if (isHtml && !done && !processing && !files.length) {
        return (
            <div className="card fade-in" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Globe size={48} color="var(--primary-500)" style={{ margin: '0 auto 20px' }} />
                <h3>Enter Webpage URL</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Convert any public webpage to a PDF document instantly purely offline.
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
            </div>
        );
    }

    if (!isHtml && files.length === 0) {
        const accept = tool.id.includes('pdf-to') ? 'application/pdf' :
            tool.id.includes('word') ? '.doc,.docx' :
                tool.id.includes('excel') ? '.xls,.xlsx' :
                    tool.id.includes('pp') ? '.ppt,.pptx' : '*/*';

        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} accept={accept} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => {
                setFiles([]);
                setDone(false);
                setProgress(0);
                setUrlInput('');
            }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel={`Convert to ${EXTENSION_MAP[tool.id]?.toUpperCase() || 'PDF'}`}
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">
                        Processing will be done entirely in the browser (Offline Mode Simulation).
                    </p>
                    {(files.length > 0 || isHtml) && (
                        <div className="mt-3 d-flex align-items-center gap-2">
                            {getIcon(tool.id)}
                            <span>Ready to convert {isHtml ? 'URL' : files[0]?.name}</span>
                        </div>
                    )}
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                {processing ? (
                    <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
                        <div className="spinner-border mb-3" style={{ width: '3rem', height: '3rem', color: 'var(--primary-500)' }} role="status" />
                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Converting Format...</h4>
                        <div style={{ width: '100%', backgroundColor: 'var(--bg-deep)', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--primary-500)', transition: 'width 0.1s' }} />
                        </div>
                        <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>{progress}% Complete</p>
                    </div>
                ) : done ? (
                    <div className="fade-in" style={{ textAlign: 'center' }}>
                        <CircleCheck size={64} style={{ color: '#10b981', marginBottom: '20px' }} />
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Conversion Complete!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                            Your file has been successfully converted in offline mode.
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={handleDownload} style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
                            <Download size={20} style={{ marginRight: '8px' }} />
                            Download {resultName}
                        </button>
                    </div>
                ) : isHtml ? (
                    <div className="file-item-horizontal" style={{ width: '100%', maxWidth: '600px' }}>
                        <Globe size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{urlInput}</div>
                            <div className="file-item-size">Webpage to PDF</div>
                        </div>
                    </div>
                ) : (
                    files.map((file, i) => (
                        <div key={i} className="file-item-horizontal" style={{ width: '100%', maxWidth: '600px' }}>
                            {getIcon(tool.id)}
                            <div className="file-item-info">
                                <div className="file-item-name">{file.name}</div>
                                <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                            <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                        </div>
                    ))
                )}
            </div>
        </ToolWorkspace>
    );
}

export default SimulationRunner;
