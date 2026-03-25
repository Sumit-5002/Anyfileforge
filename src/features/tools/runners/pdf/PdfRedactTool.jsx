import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import { parsePageRange } from '../../../../utils/pageRange';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { ShieldAlert, Layout, Square, FileText, Wand2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import '../common/ToolWorkspace.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const parseRects = (input) => {
    const raw = String(input || '').trim();
    if (!raw) return [];
    return raw
        .split(/[;\n]+/g)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.split(',').map((v) => Number(v.trim())))
        .filter((nums) => nums.length === 4 && nums.every((n) => Number.isFinite(n)))
        .map(([x, y, width, height]) => ({ x, y, width, height }));
};

function PdfRedactTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [pageRange, setPageRange] = useState('');
    const [rects, setRects] = useState('');
    const [processing, setProcessing] = useState(false);
    const [detecting, setDetecting] = useState(false);

    // AI/ML Automation Flags (Rule-based NLP)
    const [autoDetect, setAutoDetect] = useState({ email: true, phone: true, ssn: false });

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const runAutoDetect = async () => {
        setDetecting(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const phoneRegex = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
            const ssnRegex = /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g;

            let detectedRects = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const pageNum = i;
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                textContent.items.forEach((item) => {
                    const str = item.str;
                    let matches = [];
                    
                    if (autoDetect.email) matches.push(...[...str.matchAll(emailRegex)]);
                    if (autoDetect.phone) matches.push(...[...str.matchAll(phoneRegex)]);
                    if (autoDetect.ssn) matches.push(...[...str.matchAll(ssnRegex)]);
                    
                    if (matches.length > 0) {
                        // Very rough bounding box extraction based on item transform matrix
                        // item.transform array: [scaleX, skewY, skewX, scaleY, translateX, translateY]
                        const tx = item.transform[4];
                        const ty = item.transform[5];
                        const width = item.width || (str.length * 6); // estimate
                        const height = item.height || 12; // pt estimate
                        
                        // Pdf-lib coordinates match pdfjs translate values generally
                        detectedRects.push(`${Math.round(tx)},${Math.round(ty-height/4)},${Math.round(width)},${Math.round(height)}`);
                    }
                });
            }

            if (detectedRects.length > 0) {
                const existing = rects ? rects + ';\n' : '';
                setRects(existing + detectedRects.join(';\n'));
                alert(`Auto-detected ${detectedRects.length} potential PII items!`);
            } else {
                alert('No PII detected based on selected patterns.');
            }
        } catch (e) {
            console.error("Auto detect failed", e);
            alert("Auto-detection failed.");
        } finally {
            setDetecting(false);
        }
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const total = await pdfService.getPageCount(file);
            const range = pageRange.trim();
            const pageNumbers = range ? parsePageRange(range, total) : [];
            const pageIndices = pageNumbers.map((n) => n - 1);

            const rectList = parseRects(rects);
            if (rectList.length === 0) throw new Error('Add at least one rectangle.');

            const data = await pdfService.redactPDF(file, rectList, pageIndices);
            pdfService.downloadPDF(data, 'redacted_document.pdf');
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
            actionLabel="Apply Redaction"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label className="sidebar-label d-flex align-items-center gap-2">
                            <Wand2 size={16} className="text-primary"/> AI/ML Automation (PII Detect)
                        </label>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            <label className="tool-checkbox">
                                <input type="checkbox" checked={autoDetect.email} onChange={e=>setAutoDetect({...autoDetect, email: e.target.checked})} />
                                <span>Emails</span>
                            </label>
                            <label className="tool-checkbox">
                                <input type="checkbox" checked={autoDetect.phone} onChange={e=>setAutoDetect({...autoDetect, phone: e.target.checked})} />
                                <span>Phones</span>
                            </label>
                            <label className="tool-checkbox">
                                <input type="checkbox" checked={autoDetect.ssn} onChange={e=>setAutoDetect({...autoDetect, ssn: e.target.checked})} />
                                <span>SSN</span>
                            </label>
                        </div>
                        <button 
                            className="btn btn-primary btn-sm w-100 mt-2 rounded-pill d-flex justify-content-center align-items-center gap-2" 
                            onClick={runAutoDetect}
                            disabled={detecting}
                            style={{ padding: '6px 12px' }}
                        >
                            <Wand2 size={14}/> {detecting ? 'Scanning...' : 'Auto-Detect Coordinates'}
                        </button>
                    </div>

                    <div className="divider mt-3"></div>

                    <div className="tool-field mt-3">
                        <label><Square size={14} /> Redaction Rectangles (pt)</label>
                        <textarea
                            rows="5"
                            value={rects}
                            onChange={(e) => setRects(e.target.value)}
                            placeholder="x,y,width,height"
                        />
                        <p className="tool-help">Format: x, y, width, height. Multiple boxes separated by semicolons or newlines.</p>
                    </div>

                    <div className="tool-field">
                        <label><Layout size={14} /> Page Range</label>
                        <input
                            type="text"
                            value={pageRange}
                            onChange={e => setPageRange(e.target.value)}
                            placeholder="e.g. 1, 3-5 (blank for all)"
                        />
                    </div>

                    <div className="alert-mini danger mt-3">
                        <ShieldAlert size={14} />
                        <span>This permanently covers data.</span>
                    </div>
                </div>
            }
        >
            <div className="file-item-horizontal" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <FileText size={24} className="text-danger" />
                <div className="file-item-info">
                    <div className="file-item-name">{file.name}</div>
                    <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
            </div>
            
            <div className="tool-help text-center mt-4">
                Use the <strong>Auto-Detect</strong> feature to automatically scan text and generate reduction rectangles using NLP patterns!
            </div>
        </ToolWorkspace>
    );
}

export default PdfRedactTool;
