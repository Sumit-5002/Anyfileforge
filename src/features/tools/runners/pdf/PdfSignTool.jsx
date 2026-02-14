import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import GenericFileTool from '../common/GenericFileTool';

function PdfSignTool({ tool }) {
    const [pageNumber, setPageNumber] = useState('1');
    const [x, setX] = useState('50');
    const [y, setY] = useState('50');
    const [width, setWidth] = useState('160');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf,image/*"
            multiple
            actionLabel="Add Signature"
            onProcess={async ({ items }) => {
                const isPdf = (item) =>
                    item.file?.type === 'application/pdf' ||
                    String(item.name || '').toLowerCase().endsWith('.pdf');
                const isImage = (item) => {
                    const type = String(item.file?.type || '');
                    if (type.startsWith('image/')) return true;
                    const name = String(item.name || '').toLowerCase();
                    return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp');
                };

                const pdfItem = items.find(isPdf);
                const imageItem = items.find(isImage);

                if (!pdfItem || !imageItem) {
                    throw new Error('Upload 1 PDF and 1 signature image (PNG/JPG).');
                }

                const data = await pdfService.addSignatureImage(pdfItem.file, imageItem.file, {
                    pageNumber: Number(pageNumber) || 1,
                    x: Number(x) || 50,
                    y: Number(y) || 50,
                    width: Number(width) || 160
                });

                return { type: 'pdf', data, name: 'signed_anyfileforge.pdf' };
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="sign-page">Page</label>
                    <input
                        id="sign-page"
                        type="number"
                        min="1"
                        value={pageNumber}
                        onChange={(event) => setPageNumber(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="sign-x">X (pt)</label>
                    <input
                        id="sign-x"
                        type="number"
                        value={x}
                        onChange={(event) => setX(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="sign-y">Y (pt)</label>
                    <input
                        id="sign-y"
                        type="number"
                        value={y}
                        onChange={(event) => setY(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="sign-width">Width (pt)</label>
                    <input
                        id="sign-width"
                        type="number"
                        min="10"
                        value={width}
                        onChange={(event) => setWidth(event.target.value)}
                    />
                </div>
            </div>
            <div className="tool-help">
                Place a signature image onto the PDF. Coordinates are in points (1/72 inch), origin bottom-left.
            </div>
        </GenericFileTool>
    );
}

export default PdfSignTool;
