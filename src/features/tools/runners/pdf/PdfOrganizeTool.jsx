import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import GenericFileTool from '../common/GenericFileTool';

const parseOrder = (input) => {
    if (!input) return [];
    return input
        .split(',')
        .map((part) => parseInt(part.trim(), 10))
        .filter((num) => Number.isFinite(num));
};

function PdfOrganizeTool({ tool }) {
    const [orderInput, setOrderInput] = useState('');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Reorder Pages"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const total = await pdfService.getPageCount(file);
                const requested = parseOrder(orderInput);

                if (requested.length === 0) {
                    throw new Error('Enter the new page order (e.g. 3,1,2).');
                }

                const unique = Array.from(new Set(requested.filter((n) => n >= 1 && n <= total)));
                const remaining = [];
                for (let i = 1; i <= total; i += 1) {
                    if (!unique.includes(i)) remaining.push(i);
                }

                const finalOrder = [...unique, ...remaining];
                const indices = finalOrder.map((n) => n - 1);
                const data = await pdfService.reorderPages(file, indices);

                return {
                    type: 'pdf',
                    data,
                    name: 'organized_anyfileforge.pdf'
                };
            }}
        >
            <div className="tool-field">
                <label htmlFor="order-input">New page order</label>
                <input
                    id="order-input"
                    type="text"
                    value={orderInput}
                    onChange={(event) => setOrderInput(event.target.value)}
                    placeholder="e.g. 3,1,2"
                />
                <small className="tool-help">Pages not listed will be appended in original order.</small>
            </div>
        </GenericFileTool>
    );
}

export default PdfOrganizeTool;
