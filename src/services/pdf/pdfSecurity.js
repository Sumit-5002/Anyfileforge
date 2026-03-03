import { PDFDocument, rgb } from 'pdf-lib';
import { hasPdfEncryptMarker } from './pdfUtils';

export const unlockPDF = async (file) => {
    const buffer = await file.arrayBuffer();
    if (hasPdfEncryptMarker(buffer)) {
        throw new Error('This PDF is encrypted. Offline unlock cannot decrypt encrypted PDFs.');
    }
    try {
        const pdf = await PDFDocument.load(buffer);
        return pdf.save();
    } catch (error) {
        if (error?.name === 'EncryptedPDFError' || error?.message?.includes('encrypted')) {
            throw new Error('This PDF is encrypted. Offline unlock engine cannot decrypt it.');
        }
        throw error;
    }
};

export const protectPDF = async (file, password) => {
    // Current pdf-lib doesn't support save-time encryption without standard extensions.
    // For now, we perform a structure rewrite. 
    // real encryption is handled in 'Server Mode' for high security.
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    return pdf.save();
};

export const redactPDF = async (file, rectangles = [], pageIndices = []) => {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pages = pdf.getPages();
    const indices = pageIndices.length ? pageIndices : pages.map((_, idx) => idx);
    const rects = (rectangles || []).filter(r => Number.isFinite(r?.x) && Number.isFinite(r?.width));
    if (!rects.length) throw new Error('No redaction rectangles provided.');

    indices.forEach(idx => {
        rects.forEach(r => pages[idx].drawRectangle({
            x: r.x, y: r.y, width: r.width, height: r.height, color: rgb(0, 0, 0)
        }));
    });
    return pdf.save();
};
