import React, { useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Globe, Info, Download } from 'lucide-react';
import '../common/ToolWorkspace.css';

function HtmlToImageTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [urlInput, setUrlInput] = useState('');
    const [processing, setProcessing] = useState(false);
    const [format, setFormat] = useState('jpeg'); // jpeg or svg

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        if (tool.mode !== 'server') {
            alert('This tool requires "Server Mode" to handle URL fetching and rendering. Please switch to Online Mode in the tool header.');
            return;
        }

        setProcessing(true);
        try {
            let blob;
            if (urlInput) {
                blob = await serverProcessingService.htmlToImage(urlInput, { format });
                imageService.downloadBlob(blob, `webpage_capture.${format === 'svg' ? 'svg' : 'jpg'}`);
            } else if (files.length > 0) {
                // For files, we might need a different server endpoint or handle locally if possible
                // But generally html-to-image usually implies URL.
                alert('File to Image conversion is currently optimized for URLs. Please enter a webpage URL.');
            }
        } catch (error) {
            console.error('HTML to Image error:', error);
            alert('Failed to convert HTML to Image. ' + error.message);
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
                        Convert any public webpage to an image (JPG or SVG).
                    </p>
                    <div className="d-flex flex-column gap-3" style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <div className="d-flex gap-2">
                            <input
                                type="url"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                placeholder="https://example.com"
                                className="form-control"
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-primary" onClick={handleProcess} disabled={!urlInput || processing}>
                                {processing ? '...' : 'Capture'}
                            </button>
                        </div>
                        <div className="d-flex align-items-center justify-content-center gap-3">
                            <label className="d-flex align-items-center gap-2 cursor-pointer">
                                <input type="radio" checked={format === 'jpeg'} onChange={() => setFormat('jpeg')} /> JPG
                            </label>
                            <label className="d-flex align-items-center gap-2 cursor-pointer">
                                <input type="radio" checked={format === 'svg'} onChange={() => setFormat('svg')} /> SVG
                            </label>
                        </div>
                    </div>
                    <div className="mt-4" style={{ fontSize: '0.9rem', color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Info size={14} />
                        Requires Online Server Mode
                    </div>
                </div>

                <div className="divider"><span>OR UPLOAD HTML FILE</span></div>

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
            actionLabel="Convert HTML to IMAGE"
            sidebar={
                <div className="sidebar-info">
                    <div className="tool-field">
                        <label>Output Format</label>
                        <select className="form-control" value={format} onChange={e => setFormat(e.target.value)}>
                            <option value="jpeg">JPG Image</option>
                            <option value="svg">SVG Vector</option>
                        </select>
                    </div>
                    <p className="hint-text mt-3">High-fidelity screenshot of the webpage.</p>
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

export default HtmlToImageTool;
