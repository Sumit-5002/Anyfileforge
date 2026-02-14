import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import GenericFileTool from '../common/GenericFileTool';

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

function PdfCompareTool({ tool }) {
    const [includeHashes, setIncludeHashes] = useState(true);

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple
            actionLabel="Compare PDFs"
            onProcess={async ({ items }) => {
                const isPdf = (item) =>
                    item.file?.type === 'application/pdf' ||
                    String(item.name || '').toLowerCase().endsWith('.pdf');
                const pdfItems = items.filter(isPdf);
                if (pdfItems.length !== 2) {
                    throw new Error('Please upload exactly 2 PDF files to compare.');
                }

                const [a, b] = pdfItems;
                const [aPages, bPages] = await Promise.all([
                    pdfService.getPageCount(a.file),
                    pdfService.getPageCount(b.file)
                ]);

                const [aHash, bHash] = includeHashes ? await Promise.all([sha256(a.file), sha256(b.file)]) : [null, null];
                const sameHash = includeHashes && aHash && bHash ? aHash === bHash : null;

                const report = {
                    generatedAt: new Date().toISOString(),
                    tool: tool.id,
                    summary: {
                        sameSha256: sameHash
                    },
                    files: [
                        {
                            name: a.name,
                            sizeBytes: a.file.size,
                            pageCount: aPages,
                            sha256: aHash
                        },
                        {
                            name: b.name,
                            sizeBytes: b.file.size,
                            pageCount: bPages,
                            sha256: bHash
                        }
                    ]
                };

                return {
                    type: 'text',
                    data: JSON.stringify(report, null, 2),
                    name: 'pdf_compare_report.json'
                };
            }}
        >
            <label className="tool-checkbox">
                <input
                    type="checkbox"
                    checked={includeHashes}
                    onChange={(event) => setIncludeHashes(event.target.checked)}
                />
                Include SHA-256 hashes (slower)
            </label>
            <div className="tool-help">
                This generates a report with basic differences (page count, size, and optional SHA-256 hash).
            </div>
        </GenericFileTool>
    );
}

export default PdfCompareTool;
