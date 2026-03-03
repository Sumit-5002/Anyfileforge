import { PDFDocument } from 'pdf-lib';

/**
 * Common PDF utilities and helpers
 */

const ENCRYPT_MARKER_BYTES = [47, 69, 110, 99, 114, 121, 112, 116]; // '/Encrypt'

export const hasPdfEncryptMarker = (arrayBuffer) => {
    const bytes = new Uint8Array(arrayBuffer);
    const markerLength = ENCRYPT_MARKER_BYTES.length;
    const scanLimit = Math.max(0, bytes.length - markerLength);

    for (let i = 0; i <= scanLimit; i += 1) {
        let matched = true;
        for (let j = 0; j < markerLength; j += 1) {
            if (bytes[i + j] !== ENCRYPT_MARKER_BYTES[j]) {
                matched = false;
                break;
            }
        }
        if (matched) return true;
    }
    return false;
};

export const safeText = (text = '') => {
    return String(text)
        .replace(/₹/g, 'Rs.')
        .replace(/\t/g, '    ')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\u2026/g, "...")
        .replace(/[^\x20-\x7F\xA0-\xFF\n\r]/g, '?');
};

export const getPageCount = async (file, password) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
    return pdf.getPageCount();
};

export const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const downloadPDF = (data, filename) => {
    downloadBlob(new Blob([data], { type: 'application/pdf' }), filename);
};

export const rewritePDF = async (file) => {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    return pdf.save();
};
