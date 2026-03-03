import { PDFDocument } from 'pdf-lib';

/**
 * Organizes and splits PDF pages
 */

export const mergePDFs = async (files) => {
    const mergedPdf = await PDFDocument.create();
    const loadedPdfs = await Promise.all(files.map(async (f) => {
        const arrayBuffer = await f.arrayBuffer();
        return await PDFDocument.load(arrayBuffer);
    }));
    for (const pdf of loadedPdfs) {
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save();
};

export const splitPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = [];
    for (let i = 0; i < pdf.getPageCount(); i++) {
        const splitPdf = await PDFDocument.create();
        const [copiedPage] = await splitPdf.copyPages(pdf, [i]);
        splitPdf.addPage(copiedPage);
        pages.push(await splitPdf.save());
    }
    return pages;
};

export const reorderPages = async (file, orderedIndices, password) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
    const output = await PDFDocument.create();
    const copiedPages = await output.copyPages(pdf, orderedIndices);
    copiedPages.forEach((page) => output.addPage(page));
    return output.save();
};

export const removePages = async (file, removeIndices, password) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
    const total = pdf.getPageCount();
    const removeSet = new Set(removeIndices);
    const keep = Array.from({ length: total }, (_, i) => i).filter(i => !removeSet.has(i));
    return reorderPages(file, keep, password);
};
