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

    // Unified UI - No early returns
    const showUrlInput = files.length === 0 && !resultUrl && !processing;
    const showResults = resultUrl || processing;

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
            <div className="files-list-view" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                {showUrlInput ? (
                    <div className="card fade-in p-8 text-center w-full max-w-xl mx-auto border-none shadow-none bg-transparent">
                        <Globe size={64} className="text-primary-500 mx-auto mb-6 opacity-80" />
                        <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-2">Capture Webpage</h2>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            Convert any public website or URL into a high-resolution image instantly.
                        </p>
                        
                        <div className="flex flex-col gap-6 max-w-md mx-auto w-full">
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    placeholder="https://example.com"
                                    className="flex-grow p-4 bg-slate-900 border border-white/10 rounded-2xl text-white outline-none focus:border-primary-500/50 transition-all font-mono text-sm"
                                />
                                <button
                                    className="bg-primary-500 hover:bg-primary-600 text-white font-black uppercase tracking-widest px-8 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                                    onClick={handleProcess}
                                    disabled={!urlInput || processing}
                                >
                                    Capture
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2">Output Format</span>
                                <label className="flex items-center gap-2 cursor-pointer group hover:text-primary-400 transition-colors">
                                    <input type="radio" className="accent-primary-500" checked={format === 'jpeg'} onChange={() => setFormat('jpeg')} /> 
                                    <span className="text-xs font-bold font-mono">JPG</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group hover:text-primary-400 transition-colors">
                                    <input type="radio" className="accent-primary-500" checked={format === 'svg'} onChange={() => setFormat('svg')} /> 
                                    <span className="text-xs font-bold font-mono">SVG</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-12 w-full pt-8 border-t border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-6 block">Or Upload Local Source</span>
                            <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} accept=".html,.htm" />
                        </div>
                    </div>
                ) : (
                    <>
                        {files.map((file, i) => (
                            <div key={i} className="file-item-horizontal w-full max-w-xl mx-auto">
                                <Globe size={24} className="text-blue-400" />
                                <div className="file-item-info">
                                    <div className="file-item-name font-mono">{file.name}</div>
                                    <div className="file-item-size text-[10px] uppercase font-bold tracking-widest opacity-40">Local HTML Source</div>
                                </div>
                                <button className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-colors" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>x</button>
                            </div>
                        ))}

                        {resultUrl && !processing && (
                            <div className="result-preview-card fade-in mt-8 w-full max-w-2xl mx-auto bg-slate-900/50 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capture_Success</span>
                                    </div>
                                    <button
                                        className="bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all active:scale-95 flex items-center gap-2"
                                        onClick={() => {
                                            const anchor = document.createElement('a');
                                            anchor.href = resultUrl;
                                            anchor.download = resultName;
                                            document.body.appendChild(anchor);
                                            anchor.click();
                                            document.body.removeChild(anchor);
                                        }}
                                    >
                                        <Download size={12} />
                                        Save Results
                                    </button>
                                </div>
                                <div className="p-6 bg-black/40 flex items-center justify-center">
                                    {format === 'svg' ? (
                                        <div className="text-xs font-mono text-slate-500 bg-slate-950 p-6 rounded-xl border border-white/5 w-full overflow-hidden text-center italic">
                                            (Vector SVG Preview - High Fidelity Output Saved)
                                        </div>
                                    ) : (
                                        <img src={resultUrl} alt="Capture preview" className="max-w-full rounded-xl shadow-inner border border-white/5" style={{maxHeight: '400px'}} />
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {processing && (
                            <div className="text-center py-20 flex flex-col items-center">
                                <div className="spinner-border text-primary-500 w-12 h-12 mb-6" />
                                <h3 className="text-xl font-black italic tracking-tighter uppercase">Capturing_Reality</h3>
                                <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mt-2">Initializing Local Rendering Engine</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default HtmlToImageTool;
