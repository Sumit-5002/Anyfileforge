import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import { downloadBlob } from './pdfUtils';

export const imagesToPDF = async (files) => {
    const pdf = await (await import('pdf-lib')).PDFDocument.create();
    for (const f of files) {
        const image = await (f.type === 'image/png' ? pdf.embedPng(await f.arrayBuffer()) : pdf.embedJpg(await f.arrayBuffer()));
        const { width, height } = image.size();
        pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
    }
    return pdf.save();
};

export const pdfToJpg = async (file) => {
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const zip = new JSZip();
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const b64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        zip.file(`page_${i}.jpg`, b64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, file.name.replace('.pdf', '_images.zip'));
};
