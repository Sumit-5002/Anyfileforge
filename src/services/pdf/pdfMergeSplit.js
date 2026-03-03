import { PDFDocument } from 'pdf-lib';

/**
 * Merges multiple PDF files into one
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

/**
 * Splits a PDF into individual pages
 */
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
/**
 * Extracts specific pages into individual documents
 */
export const extractPages = async (file, indices) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const results = [];
    for (const idx of indices) {
        const splitPdf = await PDFDocument.create();
        const [copiedPage] = await splitPdf.copyPages(pdf, [idx]);
        splitPdf.addPage(copiedPage);
        results.push(await splitPdf.save());
    }
    return results;
};
