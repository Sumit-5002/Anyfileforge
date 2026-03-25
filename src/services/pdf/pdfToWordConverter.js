import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as pdfjs from 'pdfjs-dist';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export const pdfToWord = async (file, onProgress) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let allParas = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            if (onProgress) onProgress((i / pdf.numPages) * 100);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            let lastY = -1;
            let currentLine = '';

            textContent.items.forEach(item => {
                const y = item.transform[5];
                if (lastY !== -1 && Math.abs(y - lastY) > 8) {
                    if (currentLine.trim()) {
                        allParas.push(new Paragraph({
                            children: [new TextRun({ text: currentLine.trim(), font: "Helvetica" })],
                            spacing: { after: 120 }
                        }));
                    }
                    currentLine = '';
                }
                currentLine += (item.str || '') + ' ';
                lastY = y;
            });

            if (currentLine.trim()) {
                allParas.push(new Paragraph({
                    children: [new TextRun({ text: currentLine.trim(), font: "Helvetica" })]
                }));
            }

            // Add page break if not last page
            if (i < pdf.numPages) {
                allParas.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));
            }
        }

        if (allParas.length === 0) {
            allParas.push(new Paragraph({ children: [new TextRun("No selectable text found in this PDF.")] }));
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: allParas,
            }],
        });

        const blob = await Packer.toBlob(doc);
        return blob;
    } catch (error) {
        console.error("Internal PDF-to-Word Error:", error);
        throw new Error("Unable to parse PDF structure or generate Word document. " + error.message);
    }
};
