import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import pdfService from '../../../../services/pdfService';
import { FileEdit, CircleCheck, Type, Eye, ChevronUp, ChevronDown } from 'lucide-react';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PdfEditTool({ tool, onFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);
    const [text, setText] = useState('Edited with AnyFileForge');
    const [page, setPage] = useState('1');
    const [x, setX] = useState('48');
    const [y, setY] = useState('760');
    const [size, setSize] = useState('18');
    const [previewLoading, setPreviewLoading] = useState(false);
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);

    // Live Preview Logic
    useEffect(() => {
        let active = true;
        if (files.length > 0 && !done) {
            renderPreview(active);
        }
        return () => { active = false; };
    }, [files[0], page, text, x, y, size, done]);

    const renderPreview = async (active) => {
        const file = files[0];
        if (!file || !canvasRef.current) return;

        setPreviewLoading(true);
        try {
            // Cancel previous render task if any
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            const arrayBuffer = await file.arrayBuffer();
            if (!active) return;
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            
            const pageNum = Math.max(1, Math.min(Number(page) || 1, pdf.numPages));
            const pdfPage = await pdf.getPage(pageNum);
            
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            const viewport = pdfPage.getViewport({ scale: 1.0 });
            setPageSize({ w: viewport.width, h: viewport.height });
            const containerWidth = 600; // Expected width
            const scale = containerWidth / viewport.width;
            const scaledViewport = pdfPage.getViewport({ scale });
            
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            const renderTask = pdfPage.render({ canvasContext: context, viewport: scaledViewport });
            renderTaskRef.current = renderTask;
            await renderTask.promise;

            if (!active) return;

            // Overlay with scaling
            // Use parseFloat to ensure precision
            const posX = (parseFloat(x) || 0) * scale;
            const posY = scaledViewport.height - ((parseFloat(y) || 0) * scale);
            
            context.font = `${(parseFloat(size) || 18) * scale}px Helvetica`;
            context.fillStyle = '#ff3333';
            context.fillText(text, posX, posY);
            
            // Draw a high-contrast crosshair
            context.shadowBlur = 4;
            context.shadowColor = 'rgba(255, 255, 255, 0.8)';
            context.strokeStyle = '#ff3333';
            context.lineWidth = 1.5;
            context.beginPath();
            context.moveTo(posX - 20, posY); context.lineTo(posX + 20, posY);
            context.moveTo(posX, posY - 20); context.lineTo(posX, posY + 20);
            context.stroke();
            context.shadowBlur = 0;

        } catch (err) {
            if (err.name !== 'RenderingCancelledException') {
                console.error('Preview render failed:', err);
            }
        } finally {
            if (active) setPreviewLoading(false);
        }
    };

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

    const handleCanvasClick = (e) => {
        if (!canvasRef.current || files.length === 0) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Ratio based calculation - works even if the canvas is shrunk by CSS
        const ratioX = clickX / rect.width;
        const ratioY = clickY / rect.height;
        
        const pdfX = Math.round(ratioX * pageSize.w);
        const pdfY = Math.round((1 - ratioY) * pageSize.h);
        
        setX(String(pdfX));
        setY(String(pdfY));
    };

    const [pageSize, setPageSize] = useState({ w: 595, h: 842 }); // Default A4 points

    const handleProcess = async () => {
        if (files.length === 0) return;
        if (!text.trim()) {
            alert('Please enter text to add.');
            return;
        }

        setProcessing(true);
        try {
            for (const file of files) {
                const data = await pdfService.addTextToPdf(file, {
                    text,
                    pageNum: Number(page) || 1,
                    x: Number(x) || 48,
                    y: Number(y) || 760,
                    fontSize: Number(size) || 18
                });
                const baseName = file.name.replace(/\.[^/.]+$/, '');
                pdfService.downloadPDF(data, `${baseName}_edited.pdf`);
            }
            setDone(true);
        } catch (error) {
            console.error('Edit PDF error:', error);
            alert(error.message || 'Failed to edit PDF.');
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
            actionLabel={files.length > 1 ? `Batch Edit (${files.length})` : "Apply Edit Now"}
            sidebar={
                <div className="sidebar-info">
                    <p className="tool-help mb-4">
                        Add text overlays to your PDFs. This works locally in your browser for maximum privacy.
                    </p>

                    <div className="tool-field">
                        <label><Type size={14} className="inline mr-1" /> Text to Add</label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text"
                            disabled={processing}
                        />
                    </div>

                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>Page</label>
                            <input type="number" min="1" value={page} onChange={(e) => setPage(e.target.value)} disabled={processing} />
                        </div>
                        <div className="tool-field">
                            <label>Size</label>
                            <input type="number" min="8" max="96" value={size} onChange={(e) => setSize(e.target.value)} disabled={processing} />
                        </div>
                    </div>

                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>X (Left)</label>
                            <input type="number" value={x} onChange={(e) => setX(e.target.value)} disabled={processing} />
                        </div>
                        <div className="tool-field">
                            <label>Y (Bottom)</label>
                            <input type="number" value={y} onChange={(e) => setY(e.target.value)} disabled={processing} />
                        </div>
                    </div>
                </div>
            }
        >
            <div className="edit-work-area" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                <div className="files-list-view" style={{ flex: 'none' }}>
                    {done ? (
                        <div className="fade-in text-center py-5">
                            <CircleCheck size={64} className="text-success mb-3 mx-auto" />
                            <h3>Editing Complete</h3>
                            <p className="text-muted">All documents have been edited locally and downloaded.</p>
                        </div>
                    ) : (
                        files.map((file, i) => (
                            <div key={i} className="file-item-horizontal">
                                <FileEdit size={24} className="text-primary" />
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

                {!done && files.length > 0 && (
                    <div className="preview-container card" style={{ padding: '16px', backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Live Editor View</h4>
                            {previewLoading && <span className="text-muted" style={{ fontSize: '0.8rem' }}>Updating...</span>}
                        </div>
                        <div style={{ position: 'relative', overflow: 'auto', maxHeight: '500px', display: 'flex', justifyContent: 'center', backgroundColor: '#333', borderRadius: '8px', cursor: 'crosshair' }}>
                            <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)', margin: '20px' }} />
                        </div>
                        <p className="text-muted mt-2" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                           <strong>Pro Tip:</strong> Click anywhere on the document above to instantly position your text!
                        </p>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfEditTool;
