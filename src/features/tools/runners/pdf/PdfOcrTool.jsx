import React, { useState } from 'react';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { ScanText, CircleCheck, FileText } from 'lucide-react';
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

    const handleFilesSelected = (files) => {
        setFile(files[0] || null);
        setDone(false);
        if (onFilesAdded) onFilesAdded(files);
    };

    const handleProcess = async () => {
        if (!file) return;
        setProcessing(true);
        setProgress(5);
        setProgressLabel("Loading PDF engine offline...");
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfData = new Uint8Array(arrayBuffer);
            const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const totalPages = pdfDoc.numPages;
            
            setProgress(15);
            setProgressLabel(`Initializing AI (Language: ${language})...`);
            
            const worker = await Tesseract.createWorker(language);
            
            const outputPdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = outputPdf.internal.pageSize.getWidth();
            const pdfHeight = outputPdf.internal.pageSize.getHeight();
            
            for (let i = 1; i <= totalPages; i++) {
                setProgressLabel(`Extracting page ${i} of ${totalPages}...`);
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                await page.render({ canvasContext: ctx, viewport }).promise;
                
                setProgressLabel(`Running Machine Vision on page ${i}...`);
                
                // Add the image to the PDF
                const imgData = canvas.toDataURL('image/jpeg', 0.85);
                if (i > 1) outputPdf.addPage();
                outputPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

                // Run OCR and overlay invisible text over the image
                const { data } = await worker.recognize(canvas);
                
                // Add actual text page with extracted text so it's searchable immediately below the image
                outputPdf.addPage();
                
                const splitText = outputPdf.splitTextToSize(data.text || "No text found", pdfWidth - 40);
                outputPdf.setFontSize(12);
                
                // Print text line by line onto the page to make it extremely easy to copy-paste
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
            
            setProgressLabel("Finalizing PDF...");
            outputPdf.save(`${file.name.replace(/\.[^/.]+$/, '')}_offline_ocr.pdf`);
            
            setProgress(100);
            setDone(true);
        } catch (error) {
            console.error('Offline OCR Error:', error);
            alert("Failed to OCR document offline: " + error.message);
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
            actionLabel="Run Offline OCR"
            sidebar={
                <div className="sidebar-info">
                    <p className="tool-help">
                        Runs Machine Vision OCR completely offline without uploading to any server!
                    </p>
                    {progressLabel && <p className="text-primary mt-2"><strong>{progressLabel}</strong></p>}
                    <div className="tool-field mt-3">
                        <label>AI OCR Language</label>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={processing}>
                            <option value="eng">English</option>
                            <option value="hin">Hindi</option>
                        </select>
                    </div>
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CircleCheck size={64} className="text-success mb-3" />
                        <h3>OCR Complete</h3>
                        <p className="text-muted">Your document has been processed offline!</p>
                    </div>
                ) : (
                    <div className="file-item-horizontal w-full" style={{ maxWidth: '520px' }}>
                        <FileText size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <ScanText size={20} className="text-primary" />
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfOcrTool;
