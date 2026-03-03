import { PDFDocument } from 'pdf-lib';

/**
 * Reorders pages in a PDF document
 */
export const reorderPages = async (file, orderedIndices, password) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
    const output = await PDFDocument.create();
    const copiedPages = await output.copyPages(pdf, orderedIndices);
    copiedPages.forEach((page) => output.addPage(page));
    return output.save();
};

/**
 * Removes specific pages from a PDF document
 */
export const removePages = async (file, removeIndices, password) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
    const total = pdf.getPageCount();
    const removeSet = new Set(removeIndices);
    const keep = Array.from({ length: total }, (_, i) => i).filter(i => !removeSet.has(i));
    return reorderPages(file, keep, password);
};
