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
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFiles([]); setReport(null); setSearchTerm(''); }}
            processing={processing}
            progress={progress}
            onProcess={handleProcess}
            actionLabel="Run Semantic Comparison"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label className="tool-checkbox">
                            <input
                                type="checkbox"
                                checked={includeHashes}
                                onChange={(e) => setIncludeHashes(e.target.checked)}
                            />
                            <span>Compare Binary Signatures</span>
                        </label>
                    </div>
                    {report && (
                        <div className="tool-field mt-3">
                            <label className="sidebar-label">Search in Report</label>
                            <input
                                type="text"
                                placeholder="Filter differences..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    )}
                    <p className="tool-help">Performs word-level semantic analysis to detect content changes even if the layout differs.</p>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <FileSearch size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                ))}
            </div>

            {report && (
                <div className="report-preview fade-in card mt-4 p-4 border-0 shadow-sm" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center gap-2">
                            <FileJson className="text-primary" />
                            <h4 className="m-0">Change Report ({report.summary.totalDifferences})</h4>
                        </div>
                        <span className="badge-pill" style={{ background: report.summary.identicalContent ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: report.summary.identicalContent ? '#10b981' : '#ef4444' }}>
                            {report.summary.identicalContent ? 'Documents are Identical' : 'Content Discrepants Detected'}
                        </span>
                    </div>

                    <div className="report-grid-detailed">
                        <div className="res-stat-card">
                            <div className="stat-val">
                                {report.summary.samePageCount ? <CheckCircle2 size={18} className="text-success" /> : <XCircle size={18} className="text-danger" />}
                            </div>
                            <div className="stat-lab">Structure</div>
                        </div>
                        <div className="res-stat-card">
                            <div className="stat-val">
                                {report.summary.totalDifferences === 0 ? <CheckCircle2 size={18} className="text-success" /> : <span className="text-danger" style={{ fontSize: '1rem' }}>{report.summary.totalDifferences}</span>}
                            </div>
                            <div className="stat-lab">Changes</div>
                        </div>
                        {report.summary.sameSha256 !== null && (
                            <div className="res-stat-card">
                                <div className="stat-val">
                                    {report.summary.sameSha256 ? <CheckCircle2 size={18} className="text-success" /> : <XCircle size={18} className="text-danger" />}
                                </div>
                                <div className="stat-lab">Binary</div>
                            </div>
                        )}
                    </div>

                    {!report.summary.identicalContent && (
                        <div className="diff-details-section mt-4">
                            <h5 className="sidebar-label mb-3">Content Overlay Details</h5>
                            <div className="diff-pages-grid">
                                {filteredPages.map(p => (
                                    <div key={p.pageNumber} className="page-diff-card p-3 mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <strong>Page {p.pageNumber}</strong>
                                            <div className="small text-muted">+{p.addedCount} / -{p.removedCount}</div>
                                        </div>
                                        <div className="diff-tags-container d-flex flex-wrap gap-1">
                                            {p.diff.added.slice(0, 10).map((w, idx) => (
                                                <span key={`a-${idx}`} className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.7rem' }}>+{w}</span>
                                            ))}
                                            {p.diff.removed.slice(0, 10).map((w, idx) => (
                                                <span key={`r-${idx}`} className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.7rem' }}>-{w}</span>
                                            ))}
                                            {(p.addedCount + p.removedCount > 20) && <span className="small text-muted">...and more</span>}
                                        </div>
                                    </div>
                                ))}
                                {filteredPages.length === 0 && <p className="text-muted small">No pages match your search.</p>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </ToolWorkspace>
    );
}

export default PdfCompareTool;
