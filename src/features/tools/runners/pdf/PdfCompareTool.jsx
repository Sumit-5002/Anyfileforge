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
    const [report, setReport] = useState(null);

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
        try {
            const [a, b] = files;
            const [aPages, bPages] = await Promise.all([
                pdfService.getPageCount(a),
                pdfService.getPageCount(b)
            ]);

            const [aHash, bHash] = includeHashes ? await Promise.all([sha256(a), sha256(b)]) : [null, null];
            const sameHash = includeHashes && aHash && bHash ? aHash === bHash : null;

            const comparisonReport = {
                generatedAt: new Date().toISOString(),
                tool: tool.id,
                summary: {
                    sameSha256: sameHash,
                    samePageCount: aPages === bPages,
                    sameSize: a.size === b.size
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
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFiles([]); setReport(null); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Compare Files"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-field">
                        <label className="tool-checkbox">
                            <input
                                type="checkbox"
                                checked={includeHashes}
                                onChange={(e) => setIncludeHashes(e.target.checked)}
                            />
                            <span>Include SHA-256 hashes</span>
                        </label>
                    </div>
                    <p className="tool-help">Generates a detailed JSON comparison report including page counts and checksums.</p>
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
                <div className="report-preview card mt-4 p-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <FileJson className="text-primary" />
                        <h4 className="m-0">Comparison Results</h4>
                    </div>
                    <div className="report-grid">
                        <div className="report-stat">
                            <label>Identical Data</label>
                            {report.summary.sameSha256 ? <CheckCircle2 className="text-success" /> : <XCircle className="text-danger" />}
                        </div>
                        <div className="report-stat">
                            <label>Same Page Count</label>
                            {report.summary.samePageCount ? <CheckCircle2 className="text-success" /> : <XCircle className="text-danger" />}
                        </div>
                    </div>
                </div>
            )}
        </ToolWorkspace>
    );
}

export default PdfCompareTool;
