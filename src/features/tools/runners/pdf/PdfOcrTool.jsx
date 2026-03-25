import React, { useState } from 'react';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { ScanText, CircleCheck, FileText, Settings, Zap, ChevronUp, ChevronDown, Eye, ImageIcon } from 'lucide-react';
import Tesseract from 'tesseract.js';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PdfOcrTool({ tool, onFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("");
    const [done, setDone] = useState(false);
    const [language, setLanguage] = useState('eng');
    const [mode, setMode] = useState('extract'); // 'extract' or 'ocr'

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

    const runExtraction = async (pdfDoc, totalPages, outputPdf, pdfWidth, pdfHeight) => {
        for (let i = 1; i <= totalPages; i++) {
            setProgressLabel(`Extracting page ${i} of ${totalPages}...`);
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            
            let textStr = textContent.items.map(item => item.str).join(' ');
            if (i > 1) outputPdf.addPage();
            
            outputPdf.setFontSize(11);
            const splitText = outputPdf.splitTextToSize(textStr || "No text available on this page", pdfWidth - 40);
            
            let y = 40;
            for(let line = 0; line < splitText.length; line++) {
                if (y > pdfHeight - 40) {
                    outputPdf.addPage();
                    y = 40;
                }
                outputPdf.text(splitText[line], 20, y);
                y += 14;
            }
            setProgress(15 + Math.round((i / totalPages) * 80));
        }
    };

    const runOcr = async (pdfDoc, totalPages, outputPdf, pdfWidth, pdfHeight) => {
        setProgressLabel(`Initializing AI (Language: ${language})...`);
        const worker = await Tesseract.createWorker(language);
        
        for (let i = 1; i <= totalPages; i++) {
            setProgressLabel(`Processing page ${i} of ${totalPages} with Machine Vision...`);
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({ canvasContext: ctx, viewport }).promise;
            
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            if (i > 1) outputPdf.addPage();
            outputPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            // OCR
            setProgressLabel(`Running OCR on page ${i}...`);
            const { data } = await worker.recognize(canvas);
            
            outputPdf.addPage();
            const splitText = outputPdf.splitTextToSize(data.text || "No text found", pdfWidth - 40);
            outputPdf.setFontSize(11);
            
            let y = 40;
            for(let line = 0; line < splitText.length; line++) {
                if (y > pdfHeight - 40) {
                    outputPdf.addPage();
                    y = 40;
                }
                outputPdf.text(splitText[line], 20, y);
                y += 14;
            }
            setProgress(15 + Math.round((i / totalPages) * 80));
        }
        await worker.terminate();
    };

    const handleProcess = async () => {
        if (files.length === 0) return;
        setProcessing(true);
        setProgress(5);
        setProgressLabel("Initializing AI Engine...");
        
        try {
            let worker = null;
            if (mode === 'ocr' || files.some(f => !f.type.includes('pdf'))) {
                try {
                    worker = await Tesseract.createWorker(language);
                } catch (tness) {
                    throw new Error("Tesseract Bridge Error: AI models could not be loaded from CDN. Check your connection.");
                }
            }

            for (let fIdx = 0; fIdx < files.length; fIdx++) {
                const file = files[fIdx];
                const baseProgress = (fIdx / files.length) * 100;
                const nextBaseProgress = ((fIdx + 1) / files.length) * 100;
                
                const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
                const outputPdf = new jsPDF('p', 'pt', 'a4');
                const pdfWidth = outputPdf.internal.pageSize.getWidth();
                const pdfHeight = outputPdf.internal.pageSize.getHeight();

                if (isPdf) {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                    const totalPages = pdfDoc.numPages;

                    if (mode === 'extract') {
                        await runExtraction(pdfDoc, totalPages, outputPdf, pdfWidth, pdfHeight);
                    } else {
                        await runOcr(pdfDoc, totalPages, outputPdf, pdfWidth, pdfHeight);
                    }
                } else {
                    // Direct Image OCR
                    setProgressLabel(`Running Vision OCR on ${file.name}...`);
                    const imgUrl = URL.createObjectURL(file);
                    const { data } = await worker.recognize(imgUrl);
                    URL.revokeObjectURL(imgUrl);

                    outputPdf.setFontSize(11);
                    const splitText = outputPdf.splitTextToSize(data.text || "No text found", pdfWidth - 40);
                    let y = 40;
                    for(let line = 0; line < splitText.length; line++) {
                        if (y > pdfHeight - 40) {
                            outputPdf.addPage();
                            y = 40;
                        }
                        outputPdf.text(splitText[line], 20, y);
                        y += 14;
                    }
                }

                outputPdf.save(`${file.name.replace(/\.[^/.]+$/, '')}_processed.pdf`);
                setProgress(nextBaseProgress);
            }
            
            if (worker) await worker.terminate();
            setDone(true);
        } catch (error) {
            console.error('OCR Process Failure:', error);
            alert(`Process error: ` + error.message);
        } finally {
            setProcessing(false);
            setProgressLabel("");
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} accept="application/pdf,image/*" />;
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
            }}
            processing={processing}
            progress={progress}
            onProcess={handleProcess}
            actionLabel={files.length > 1 ? `Batch Process (${files.length})` : (mode === 'extract' ? "Extract Text" : "Run AI Vision OCR")}
            sidebar={
                <div className="sidebar-info">
                    <p className="tool-help mb-4">
                        Choose between fast digital text extraction or AI-powered Image OCR.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        <button className={`btn w-full ${mode === 'extract' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('extract')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={16} /> Fast Extract (Non-OCR)
                        </button>
                        <button className={`btn w-full ${mode === 'ocr' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('ocr')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ScanText size={16} /> Vision OCR (Scans)
                        </button>
                    </div>
                    
                    {mode === 'ocr' && (
                        <div className="tool-field mt-3">
                            <label><Settings size={14} className="inline mr-1" /> AI Language Model</label>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={processing}>
                                <option value="eng">English</option>
                                <option value="hin">Hindi</option>
                                <option value="spa">Spanish</option>
                                <option value="fra">French</option>
                                <option value="deu">German</option>
                            </select>
                            <small className="text-muted d-block mt-2">Downloads a lightweight model automatically if used for the first time.</small>
                        </div>
                    )}
                    
                    {progressLabel && <p className="text-primary mt-4" style={{ fontSize: '0.9rem' }}><strong>{progressLabel}</strong></p>}
                </div>
            }
        >
            <div className="files-list-view">
                {done ? (
                    <div className="fade-in text-center py-5">
                        <CircleCheck size={64} className="text-success mb-3 mx-auto" />
                        <h3>Processing Complete</h3>
                        <p className="text-muted">All documents and images have been processed and downloaded!</p>
                    </div>
                ) : (
                    files.map((file, i) => (
                        <div key={i} className="file-item-horizontal">
                            {file.type.includes('image') ? <ImageIcon size={24} className="text-primary" /> : <FileText size={24} className="text-danger" />}
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

export default PdfOcrTool;
