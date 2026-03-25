import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileSearch, CheckCircle2, XCircle, FileJson } from 'lucide-react';
import '../common/ToolWorkspace.css';

const bufferToHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

const sha256 = async (file) => {
    if (!globalThis.crypto?.subtle) return null;
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return bufferToHex(digest);
};

function PdfCompareTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [includeHashes, setIncludeHashes] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [report, setReport] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        setReport(null);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        if (files.length !== 2) {
            alert('Please upload exactly 2 PDF files to compare.');
            return;
        }

        setProcessing(true);
        setProgress(0);
        try {
            const [a, b] = files;
            const [aPages, bPages] = await Promise.all([
                pdfService.getPageCount(a),
                pdfService.getPageCount(b)
            ]);

            const [aHash, bHash] = includeHashes ? await Promise.all([sha256(a), sha256(b)]) : [null, null];

            // Textual Comparison with Progress
            const textComparison = await pdfService.comparePDFs(a, b, (p) => setProgress(p));

            const comparisonReport = {
                generatedAt: new Date().toISOString(),
                tool: tool.id,
                pages: textComparison.pages, // Full page diff data
                summary: {
                    sameSha256: includeHashes ? aHash === bHash : null,
                    samePageCount: aPages === bPages,
                    sameSize: a.size === b.size,
                    identicalContent: textComparison.identicalContent,
                    totalDifferences: textComparison.totalDifferingWords,
                    differingPages: textComparison.differingPages
                },
                files: [
                    { name: a.name, sizeBytes: a.size, pageCount: aPages, sha256: aHash },
                    { name: b.name, sizeBytes: b.size, pageCount: bPages, sha256: bHash }
                ]
            };

            setReport(comparisonReport);
            const blob = new Blob([JSON.stringify(comparisonReport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'pdf_compare_report.json';
            link.click();
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    const filteredPages = report?.pages.filter(p => {
        if (!searchTerm) return !p.isSame;
        const s = searchTerm.toLowerCase();
        return (p.pageNumber.toString().includes(s) ||
            p.diff.added.some(w => w.toLowerCase().includes(s)) ||
            p.diff.removed.some(w => w.toLowerCase().includes(s))) && !p.isSame;
    }) || [];

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} />;
    }

    return (
        <div className="custom-tool-wrapper overflow-hidden h-full flex flex-col bg-slate-950" style={{ minHeight: '80vh' }}>
            <ToolWorkspace
                tool={tool}
                files={files}
                onFilesSelected={handleFilesSelected}
                onReset={() => { setFiles([]); setReport(null); setSearchTerm(''); }}
                processing={processing}
                progress={progress}
                onProcess={handleProcess}
                actionLabel="INITIATE SYNC ANALYTICS"
                layout="research"
                sidebar={
                    <div className="sidebar-settings flex flex-col h-full gap-8 p-4">
                        <div className="section-title text-[10px] uppercase font-black tracking-widest text-primary-500/60 mb-2">Operation Mode</div>
                        <div className="tool-field bg-white/5 p-4 rounded-2xl border border-white/5">
                            <label className="tool-checkbox flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded-lg bg-black border-white/20 checked:bg-primary-500 transition-all cursor-pointer"
                                    checked={includeHashes}
                                    onChange={(e) => setIncludeHashes(e.target.checked)}
                                />
                                <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors">BINARY_SIG_VALIDATION</span>
                            </label>
                        </div>
                        
                        {report && (
                            <div className="report-summary-box flex flex-col gap-4 mt-auto">
                                <div className="section-title text-[10px] uppercase font-black tracking-widest text-primary-500/60 mb-2">Sync Report</div>
                                <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl">
                                    <div className="text-3xl font-black font-mono text-primary-400 mb-1">{report.summary.totalDifferences}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary-500/60 opacity-60">Delta Discrepancies</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase px-2">
                                        <span>Structure</span>
                                        {report.summary.samePageCount ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-red-400" />}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase px-2">
                                        <span>Content</span>
                                        {report.summary.identicalContent ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Info size={12} className="text-primary-400" />}
                                    </div>
                                </div>
                            </div>
                        )}
                        <p className="tool-help text-[10px] text-slate-500 mt-4 leading-relaxed italic border-t border-white/5 pt-4">Zero-Server comparison. Uses Phred-style word scoring to isolate semantic drift between PDF revisions.</p>
                    </div>
                }
            >
                {!report ? (
                    <div className="files-selection-view h-full flex flex-col items-center justify-center p-12">
                         <div className="mb-8 p-10 bg-primary/5 rounded-[60px] border border-primary/10 shadow-inner relative group">
                            <div className="absolute inset-0 bg-primary-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <FileSearch size={80} className="text-primary-500/40 relative z-10" strokeWidth={1}/>
                         </div>
                         <h3 className="text-4xl font-black tracking-tighter text-white mb-4 italic">PDF_QUANTUM_SYNC</h3>
                         <div className="flex gap-4 mb-12">
                            {files.map((file, i) => (
                                <div key={i} className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 group hover:border-primary-500/30 transition-all">
                                    <div className="p-2 bg-primary/20 rounded-xl"><FileText size={18} className="text-primary-400"/></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{i === 0 ? 'Document A' : 'Document B'}</span>
                                        <span className="text-sm font-mono text-white truncate max-w-[150px]">{file.name}</span>
                                    </div>
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-red-500/40 hover:text-red-500 transition-colors" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                                </div>
                            ))}
                            {files.length < 2 && (
                                <div className="px-6 py-4 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-slate-600 text-[10px] font-black uppercase tracking-widest w-[250px]">
                                    Awaiting Target {files.length === 0 ? 'A' : 'B'}
                                </div>
                            )}
                         </div>
                         {files.length === 2 && (
                             <div className="badge-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-2 rounded-full text-[11px] font-black tracking-widest animate-bounce">
                                COMPARISON READY
                             </div>
                         )}
                    </div>
                ) : (
                    <div className="report-mode h-full flex flex-col p-4">
                        <PdfDiffViewer fileA={files[0]} fileB={files[1]} differingPages={report.summary.differingPages} />
                    </div>
                )}
            </ToolWorkspace>
        </div>
    );
}

import PdfDiffViewer from './PdfDiffViewer';
import { Info, FileText } from 'lucide-react';

export default PdfCompareTool;
