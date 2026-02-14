import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import GenericFileTool from '../common/GenericFileTool';

function PdfPageNumberTool({ tool }) {
    const [startAt, setStartAt] = useState('1');
    const [position, setPosition] = useState('bottom-right');
    const [fontSize, setFontSize] = useState('12');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Add Page Numbers"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const data = await pdfService.addPageNumbers(file, {
                    startAt: Number(startAt) || 1,
                    position,
                    fontSize: Number(fontSize) || 12
                });
                return { type: 'pdf', data, name: 'pagenumbered_anyfileforge.pdf' };
            }}
        >
            <div className="tool-inline">
                <div className="tool-field">
                    <label htmlFor="page-start">Start number</label>
                    <input
                        id="page-start"
                        type="number"
                        min="1"
                        value={startAt}
                        onChange={(event) => setStartAt(event.target.value)}
                    />
                </div>
                <div className="tool-field">
                    <label htmlFor="page-position">Position</label>
                    <select
                        id="page-position"
                        value={position}
                        onChange={(event) => setPosition(event.target.value)}
                    >
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                    </select>
                </div>
                <div className="tool-field">
                    <label htmlFor="page-size">Font size</label>
                    <input
                        id="page-size"
                        type="number"
                        min="8"
                        value={fontSize}
                        onChange={(event) => setFontSize(event.target.value)}
                    />
                </div>
            </div>
        </GenericFileTool>
    );
}

export default PdfPageNumberTool;
