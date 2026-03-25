import React, { useState } from 'react';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { ScanText, CircleCheck, FileText, Settings, Zap } from 'lucide-react';
import Tesseract from 'tesseract.js';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function PdfOcrTool({ tool, onFilesAdded }) {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("");
    const [done, setDone] = useState(false);
    const [language, setLanguage] = useState('eng');
    const [mode, setMode] = useState('extract'); // 'extract' or 'ocr'

    const handleFilesSelected = (files) => {
        setFile(files[0] || null);
        setDone(false);
        if (onFilesAdded) onFilesAdded(files);
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
        if (!file) return;
        setProcessing(true);
        setProgress(5);
        setProgressLabel("Loading PDF engine...");
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfData = new Uint8Array(arrayBuffer);
            const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const totalPages = pdfDoc.numPages;
            
            const outputPdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = outputPdf.internal.pageSize.getWidth();
            const pdfHeight = outputPdf.internal.pageSize.getHeight();
            
            if (mode === 'extract') {
                await runExtraction(pdfDoc, totalPages, outputPdf, pdfWidth, pdfHeight);
            } else {
                await runOcr(pdfDoc, totalPages, outputPdf, pdfWidth, pdfHeight);
            }
            
            setProgressLabel("Finalizing PDF...");
            outputPdf.save(`${file.name.replace(/\.[^/.]+$/, '')}_${mode === 'extract' ? 'extracted' : 'ocr'}.pdf`);
            
            setProgress(100);
            setDone(true);
        } catch (error) {
            console.error('Text Extraction Error:', error);
            alert(`Failed during ${mode === 'extract' ? 'extraction' : 'OCR'}: ` + error.message);
        } finally {
            setProcessing(false);
            setProgressLabel("");
        }
    };

    if (!file) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} accept="application/pdf" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={[file]}
            onFilesSelected={handleFilesSelected}
            onReset={() => {
                 setFile(null);
                 setDone(false);
                 setProgress(0);
            }}
            processing={processing}
            progress={progress}
            onProcess={handleProcess}
            actionLabel={mode === 'extract' ? "Extract Text Quickly" : "Run Vision OCR Mode"}
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
            <div className="files-list-view" style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CircleCheck size={64} className="text-success mb-3" />
                        <h3>{mode === 'extract' ? 'Extraction' : 'OCR'} Complete</h3>
                        <p className="text-muted">Your document has been processed and downloaded!</p>
                    </div>
                ) : (
                    <div className="file-item-horizontal w-full" style={{ maxWidth: '520px' }}>
                        <FileText size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <ScanText size={20} className="text-primary" opacity={mode === 'ocr' ? 1 : 0.3} />
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfOcrTool;

