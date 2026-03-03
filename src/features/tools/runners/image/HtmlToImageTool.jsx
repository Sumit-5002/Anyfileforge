import React, { useEffect, useMemo, useState } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Globe, Info, Download } from 'lucide-react';
import '../common/ToolWorkspace.css';

const escapeHtmlForXml = (html) =>
    html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const buildHtmlSvg = (html, width = 1366, height = 768) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="background:white;color:black;width:100%;height:100%;overflow:hidden;">
      ${html}
    </div>
  </foreignObject>
</svg>`;

const svgBlobToJpegBlob = async (svgBlob) => {
    const objectUrl = URL.createObjectURL(svgBlob);
    try {
        const img = await new Promise((resolve, reject) => {
            const nextImg = new Image();
            nextImg.onload = () => resolve(nextImg);
            nextImg.onerror = () => reject(new Error('Failed to render HTML as image.'));
            nextImg.src = objectUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width || 1366;
        canvas.height = img.height || 768;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const jpegBlob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) reject(new Error('Failed to encode JPG output.'));
                else resolve(blob);
            }, 'image/jpeg', 0.9);
        });

        return jpegBlob;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};

const convertHtmlFileToImage = async (file, format) => {
    const html = await file.text();
    const svgMarkup = buildHtmlSvg(escapeHtmlForXml(html));
    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    if (format === 'svg') return svgBlob;
    return svgBlobToJpegBlob(svgBlob);
};

function HtmlToImageTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [urlInput, setUrlInput] = useState('');
    const [processing, setProcessing] = useState(false);
    const [format, setFormat] = useState('jpeg');
    const [resultUrl, setResultUrl] = useState('');
    const [resultName, setResultName] = useState('');

    const canCaptureUrl = useMemo(() => tool.mode === 'server', [tool.mode]);

    useEffect(() => () => {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
    }, [resultUrl]);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            let blob;
            let outputName;

            if (urlInput) {
                if (!canCaptureUrl) {
                    throw new Error('URL capture needs Online Server Mode. For Offline Mode, upload an HTML file instead.');
                }
                blob = await serverProcessingService.htmlToImage(urlInput, { format });
                outputName = `webpage_capture.${format === 'svg' ? 'svg' : 'jpg'}`;
            } else if (files.length > 0) {
                blob = await convertHtmlFileToImage(files[0], format);
                const base = files[0].name.replace(/\.[^/.]+$/, '');
                outputName = `${base}_capture.${format === 'svg' ? 'svg' : 'jpg'}`;
            } else {
                throw new Error('Add a URL or upload an HTML file first.');
            }

            if (resultUrl) URL.revokeObjectURL(resultUrl);
            const nextResultUrl = URL.createObjectURL(blob);
            setResultUrl(nextResultUrl);
            setResultName(outputName);
            imageService.downloadBlob(blob, outputName);
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
                            <button className="btn btn-primary" onClick={handleProcess} disabled={!urlInput || processing || !canCaptureUrl}>
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
                        {canCaptureUrl ? 'URL capture available in Online Mode' : 'Switch to Online Mode for URL capture (HTML file upload works offline)'}
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
                if (resultUrl) URL.revokeObjectURL(resultUrl);
                setResultUrl('');
                setResultName('');
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
                    <p className="hint-text mt-3">
                        URL capture uses server mode. HTML file upload works in both offline and online modes.
                    </p>
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
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>x</button>
                    </div>
                ))}

                {resultUrl && (
                    <div className="card mt-3" style={{ padding: '16px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Converted Output</strong>
                        </div>
                        <img src={resultUrl} alt="Converted output preview" style={{ width: '100%', borderRadius: '10px', border: '1px solid var(--border-subtle)' }} />
                        <div className="mt-2">
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    const anchor = document.createElement('a');
                                    anchor.href = resultUrl;
                                    anchor.download = resultName || `webpage_capture.${format === 'svg' ? 'svg' : 'jpg'}`;
                                    document.body.appendChild(anchor);
                                    anchor.click();
                                    document.body.removeChild(anchor);
                                }}
                            >
                                <Download size={16} />
                                Download Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default HtmlToImageTool;
