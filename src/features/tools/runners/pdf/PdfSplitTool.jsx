import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import PageGrid from '../common/PageGrid';

function PdfSplitTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [selectedPages, setSelectedPages] = useState(new Set());
    const [extractMode, setExtractMode] = useState('selected'); // 'selected' | 'all' | 'range'
    const [rangeText, setRangeText] = useState('');
    const [processing, setProcessing] = useState(false);
    const [pageCount, setPageCount] = useState(0);

    const handleFilesSelected = async (selectedFiles) => {
        const selectedFile = selectedFiles[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        const count = await pdfService.getPageCount(selectedFile);
        setPageCount(count);
        setSelectedPages(new Set());
        if (parentOnFilesAdded) parentOnFilesAdded(selectedFiles);
    };

    const handleSplit = async () => {
        setProcessing(true);
        try {
            let results = [];
            let pNums = [];

            if (extractMode === 'all') {
                results = await pdfService.splitPDF(file);
                pNums = Array.from({ length: pageCount }, (_, i) => i + 1);
            } else if (extractMode === 'range') {
                const ranges = rangeText.split(',').map(r => r.trim());
                for (const range of ranges) {
                    if (range.includes('-')) {
                        const [start, end] = range.split('-').map(n => parseInt(n));
                        if (!isNaN(start) && !isNaN(end)) {
                            for (let i = start; i <= end; i++) pNums.push(i);
                        }
                    } else {
                        const n = parseInt(range);
                        if (!isNaN(n)) pNums.push(n);
                    }
                }
                const uniquePNums = [...new Set(pNums)].filter(n => n >= 1 && n <= pageCount).sort((a, b) => a - b);
                results = await pdfService.extractPages(file, uniquePNums.map(n => n - 1));
                pNums = uniquePNums;
            } else {
                pNums = Array.from(selectedPages).sort((a, b) => a - b);
                results = await pdfService.extractPages(file, pNums.map(n => n - 1));
            }

            results.forEach((data, i) => pdfService.downloadPDF(data, `split_page_${pNums[i]}.pdf`));
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
            onFilesSelected={handleFilesSelected}
            onReset={() => setFile(null)}
            processing={processing}
            onProcess={handleSplit}
            actionLabel="Split PDF Now"
            sidebar={
                <div className="levels-vertical">
                    <div className="sidebar-label">SPLIT MODE</div>
                    <div
                        className={`level-box ${extractMode === 'selected' ? 'active' : ''}`}
                        onClick={() => setExtractMode('selected')}
                        aria-pressed={extractMode === 'selected'}
                    >
                        <div className="level-meta">
                            <div className="level-name">Extract Pages</div>
                            <div className="level-desc">Download only the pages you select below.</div>
                        </div>
                    </div>
                    <div
                        className={`level-box ${extractMode === 'range' ? 'active' : ''}`}
                        onClick={() => setExtractMode('range')}
                        aria-pressed={extractMode === 'range'}
                    >
                        <div className="level-meta">
                            <div className="level-name">Split by Range</div>
                            <div className="level-desc">Enter ranges like "1-5, 8, 11-13".</div>
                        </div>
                    </div>

                    {extractMode === 'range' && (
                        <div className="tool-field mt-3">
                            <label className="sidebar-label">PAGE RANGES</label>
                            <input
                                type="text"
                                placeholder="e.g. 1-5, 8, 11-13"
                                value={rangeText}
                                onChange={(e) => setRangeText(e.target.value)}
                                className="range-input"
                            />
                        </div>
                    )}

                    <div className="divider mt-4"></div>

                    <div className="sidebar-label">SELECTION SUMMARY</div>
                    <div className="order-summary">
                        <div className="summary-row">
                            <span>Total Pages:</span>
                            <span>{pageCount}</span>
                        </div>
                        {extractMode === 'selected' && (
                            <div className="summary-row">
                                <span>To Extract:</span>
                                <span style={{ color: 'var(--primary-500)' }}>
                                    {extractMode === 'selected' ? selectedPages.size : 'From range'} pages
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            }
        >
            <PageGrid
                file={file}
                selectedPages={selectedPages}
                onTogglePage={(num) => {
                    const next = new Set(selectedPages);
                    next.has(num) ? next.delete(num) : next.add(num);
                    setSelectedPages(next);
                }}
            />
        </ToolWorkspace>
    );
}

export default PdfSplitTool;
