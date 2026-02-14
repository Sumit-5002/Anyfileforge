import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import GenericFileTool from '../common/GenericFileTool';

function PdfUnlockTool({ tool }) {
    const [password, setPassword] = useState('');

    return (
        <GenericFileTool
            tool={tool}
            accept="application/pdf"
            multiple={false}
            actionLabel="Unlock PDF"
            onProcess={async ({ files }) => {
                const file = files[0];
                if (!file) throw new Error('Please upload a PDF file.');
                const data = await pdfService.unlockPDF(file, password || undefined);
                return { type: 'pdf', data, name: 'unlocked_anyfileforge.pdf' };
            }}
        >
            <div className="tool-field">
                <label htmlFor="unlock-password">Password (if required)</label>
                <input
                    id="unlock-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Leave empty if not password-protected"
                />
            </div>
        </GenericFileTool>
    );
}

export default PdfUnlockTool;
