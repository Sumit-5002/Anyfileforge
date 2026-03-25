import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Layers, Maximize, Smartphone, Monitor } from 'lucide-react';

const PdfDiffViewer = ({ fileA, fileB, differingPages = [] }) => {
    const [pageNumber, setPageNumber] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [zoom, setZoom] = useState(1.0);
    const [loading, setLoading] = useState(false);
    const [layout, setLayout] = useState('side'); // 'side' or 'stack'
    
    const canvasRefA = useRef(null);
    const canvasRefB = useRef(null);
    const pdfRefA = useRef(null);
    const pdfRefB = useRef(null);

    useEffect(() => {
        const loadPdfs = async () => {
            setLoading(true);
            try {
                const [pdfA, pdfB] = await Promise.all([
                    pdfjs.getDocument({ data: await fileA.arrayBuffer() }).promise,
                    pdfjs.getDocument({ data: await fileB.arrayBuffer() }).promise
                ]);
                pdfRefA.current = pdfA;
                pdfRefB.current = pdfB;
                setNumPages(Math.max(pdfA.numPages, pdfB.numPages));
                renderPages(1, pdfA, pdfB);
            } catch (e) {
                console.error("PDF Load Error:", e);
            } finally {
                setLoading(false);
            }
        };
        loadPdfs();
    }, [fileA, fileB]);

    const renderPages = async (pageNum, pdfA = pdfRefA.current, pdfB = pdfRefB.current) => {
        if (!pdfA || !pdfB) return;
        
        const renderPage = async (pdf, canvas, num) => {
            if (!canvas) return;
            if (num > pdf.numPages) {
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }
            const page = await pdf.getPage(num);
            const viewport = page.getViewport({ scale: zoom * 1.5 });
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
        };

        await Promise.all([
            renderPage(pdfA, canvasRefA.current, pageNum),
            renderPage(pdfB, canvasRefB.current, pageNum)
        ]);
    };

    useEffect(() => {
        renderPages(pageNumber);
    }, [pageNumber, zoom]);

    const goToPage = (num) => {
        const target = Math.max(1, Math.min(num, numPages));
        setPageNumber(target);
    };

    return (
        <div className="pdf-diff-viewer flex flex-col h-full bg-slate-900/50 rounded-[40px] overflow-hidden border border-white/5 relative">
            <div className="viewer-toolbar p-6 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex flex-wrap items-center justify-between gap-6 z-20">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        <button className="p-2.5 hover:bg-primary-500/20 hover:text-primary-400 rounded-xl transition-all" onClick={() => goToPage(pageNumber - 1)}><ChevronLeft size={16}/></button>
                        <span className="px-4 text-[10px] font-black uppercase tracking-widest text-white border-x border-white/5">PAGE {pageNumber}_{numPages}</span>
                        <button className="p-2.5 hover:bg-primary-500/20 hover:text-primary-400 rounded-xl transition-all" onClick={() => goToPage(pageNumber + 1)}><ChevronRight size={16}/></button>
                    </div>
                    {differingPages.length > 0 && (
                        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/5">
                             <span className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">DELTA_LOCI:</span>
                             <div className="flex gap-1.5">
                                 {differingPages.slice(0, 8).map(p => (
                                     <button 
                                        key={p} 
                                        className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all border ${pageNumber === p ? 'bg-primary-500 text-white border-primary-400 shadow-lg' : 'bg-white/5 text-slate-500 border-white/5 hover:text-white'}`} 
                                        onClick={() => goToPage(p)}
                                     >
                                         {p}
                                     </button>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        <button className="p-2.5 hover:bg-white/10 rounded-xl text-slate-500" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}><ZoomOut size={16}/></button>
                        <span className="text-[10px] font-black w-14 text-center text-slate-300">{Math.round(zoom * 100)}%</span>
                        <button className="p-2.5 hover:bg-white/10 rounded-xl text-slate-500" onClick={() => setZoom(z => Math.min(4, z + 0.1))}><ZoomIn size={16}/></button>
                    </div>
                    <div className="h-8 w-[1px] bg-white/5 mx-2"></div>
                    <div className="flex gap-2">
                        <button 
                            className={`p-3 rounded-xl transition-all border ${layout === 'side' ? 'bg-primary-500 text-white border-primary-400 shadow-lg' : 'bg-white/5 text-slate-500 border-white/5'}`} 
                            onClick={() => setLayout('side')}
                            title="Side-by-Side View"
                        >
                            <Monitor size={18}/>
                        </button>
                        <button 
                            className={`p-3 rounded-xl transition-all border ${layout === 'stack' ? 'bg-primary-500 text-white border-primary-400 shadow-lg' : 'bg-white/5 text-slate-500 border-white/5'}`} 
                            onClick={() => setLayout('stack')}
                            title="Vertical Stack View"
                        >
                            <Smartphone size={18}/>
                        </button>
                    </div>
                </div>
            </div>

            <div className={`viewer-canvases flex-grow overflow-auto p-12 flex ${layout === 'side' ? 'flex-row gap-12' : 'flex-col gap-16'} justify-center bg-black/40 items-start no-scrollbar relative`}>
                <div className="absolute inset-0 bg-primary-500/[0.02] pointer-events-none"></div>
                
                <div className="canvas-container relative group shrink-0">
                    <div className="absolute -top-7 left-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">A_ORIGINAL_BUFFER</span>
                    </div>
                    <div className="shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/5 bg-white">
                        <canvas ref={canvasRefA} className="max-w-full h-auto" />
                    </div>
                </div>

                <div className="canvas-container relative group shrink-0">
                    <div className="absolute -top-7 left-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest leading-none">B_TARGET_REVISION</span>
                    </div>
                    <div className="shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/5 bg-white">
                        <canvas ref={canvasRefB} className="max-w-full h-auto" />
                    </div>
                </div>
            </div>
            
            {loading && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <Layers size={48} className="text-primary-500 animate-spin-slow"/>
                            <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full"></div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-[3px] text-white">RECONSTRUCTION_IN_PROGRESS</span>
                            <span className="text-[9px] font-black uppercase tracking-[1px] text-slate-600 italic">Caching local memory buffers...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PdfDiffViewer;
