import React, { useState, useEffect, useRef } from 'react';
import pdfService from '../../../../services/pdfService';
import { parsePageRange } from '../../../../utils/pageRange';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Crop, FileText, Layout } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import '../common/ToolWorkspace.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PdfCropTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [margins, setMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
    const [pageRange, setPageRange] = useState('');
    const [processing, setProcessing] = useState(false);
    
    // Preview state
    const canvasRef = useRef(null);
    const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    useEffect(() => {
        if (!file) return;
        let active = true;

        const renderPreview = async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1);
                
                // Adjust scale to fit inside UI
                const tempViewport = page.getViewport({ scale: 1.0 });
                const renderScale = Math.min(1.0, 400 / tempViewport.width);
                const viewport = page.getViewport({ scale: renderScale });
                
                if (active) {
                    setPdfDimensions({ width: tempViewport.width, height: tempViewport.height });
                    setScale(renderScale);
                }

                if (canvasRef.current) {
                    const canvas = canvasRef.current;
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    await page.render(renderContext).promise;
                }
            } catch (err) {
                console.error("Preview render failed", err);
            }
        };
        renderPreview();

        return () => { active = false; };
    }, [file]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setStartPos({ x, y });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        
        const tx = Math.min(startPos.x, x);
        const ty = Math.min(startPos.y, y);
        const bx = Math.max(startPos.x, x);
        const by = Math.max(startPos.y, y);

        // Convert pixels back to points
        setMargins({
            top: Math.round(ty / scale),
            left: Math.round(tx / scale),
            bottom: Math.round((rect.height - by) / scale),
            right: Math.round((rect.width - bx) / scale)
        });
    };

    const handleMouseUp = () => setIsDrawing(false);

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const total = await pdfService.getPageCount(file);
            const range = pageRange.trim();
            const pageNumbers = range ? parsePageRange(range, total) : [];
            const indices = pageNumbers.map((n) => n - 1);

            const data = await pdfService.cropPages(file, {
                top: Number(margins.top) || 0,
                right: Number(margins.right) || 0,
                bottom: Number(margins.bottom) || 0,
                left: Number(margins.left) || 0
            }, indices);

            pdfService.downloadPDF(data, 'cropped_document.pdf');
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
            actionLabel="Apply Crop"
            sidebar={
                <div className="sidebar-settings">
                    <div className="sidebar-label-group">
                        <Crop size={14} />
                        <label>Crop Margins (pt)</label>
                    </div>

                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>Top</label>
                            <input type="number" min="0" value={margins.top} onChange={e => setMargins({ ...margins, top: e.target.value })} />
                        </div>
                        <div className="tool-field">
                            <label>Bottom</label>
                            <input type="number" min="0" value={margins.bottom} onChange={e => setMargins({ ...margins, bottom: e.target.value })} />
                        </div>
                    </div>

                    <div className="tool-inline">
                        <div className="tool-field">
                            <label>Left</label>
                            <input type="number" min="0" value={margins.left} onChange={e => setMargins({ ...margins, left: e.target.value })} />
                        </div>
                        <div className="tool-field">
                            <label>Right</label>
                            <input type="number" min="0" value={margins.right} onChange={e => setMargins({ ...margins, right: e.target.value })} />
                        </div>
                    </div>

                    <div className="tool-field mt-3">
                        <label><Layout size={14} /> Page Range</label>
                        <input
                            type="text"
                            value={pageRange}
                            onChange={e => setPageRange(e.target.value)}
                            placeholder="e.g. 1-5, 8 (blank for all)"
                        />
                    </div>
                    
                    <div className="tool-help mt-4">
                        <small>1pt = 1/72 inch. Use the preview area to visualize the crop box.</small>
                    </div>
                </div>
            }
        >
            <div className="crop-preview-wrapper flex flex-col items-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 bg-white/5 px-6 py-2 rounded-full border border-white/5 animate-pulse">
                    Drag on the page to define crop box
                </div>
                
                <div 
                    className="relative cursor-crosshair shadow-2xl rounded-lg overflow-hidden border border-white/10"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    style={{ userSelect: 'none' }}
                >
                    <canvas ref={canvasRef} style={{ display: 'block', background: '#fff' }} />
                    
                    {pdfDimensions.width > 0 && (
                        <div 
                            className="absolute border-2 border-primary-500 bg-primary-500/10 pointer-events-none transition-shadow"
                            style={{
                                top: `${Number(margins.top) * scale}px`,
                                left: `${Number(margins.left) * scale}px`,
                                right: `${Number(margins.right) * scale}px`,
                                bottom: `${Number(margins.bottom) * scale}px`,
                                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
                            }} 
                        >
                            <div className="absolute -top-6 left-0 bg-primary-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded">
                                Selection_Area: {Math.round(pdfDimensions.width - Number(margins.left) - Number(margins.right))} x {Math.round(pdfDimensions.height - Number(margins.top) - Number(margins.bottom))} pt
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="file-item-horizontal mt-4" style={{ maxWidth: '400px', margin: '24px auto 0' }}>
                <FileText size={24} className="text-danger" />
                <div className="file-item-info">
                    <div className="file-item-name">{file.name}</div>
                    <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
            </div>
        </ToolWorkspace>
    );
}

export default PdfCropTool;
