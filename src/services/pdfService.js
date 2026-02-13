import { PDFDocument } from 'pdf-lib';

/**
 * Service to handle PDF manipulations
 */
const pdfService = {
    /**
     * Merges multiple PDF files into one
     * @param {File[]} files - Array of File objects to merge
     * @returns {Promise<Uint8Array>} - Merged PDF as Uint8Array
     */
    async mergePDFs(files) {
        const mergedPdf = await PDFDocument.create();

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        return await mergedPdf.save();
    },

    /**
     * Splits a PDF into individual pages
     * @param {File} file - PDF file to split
     * @returns {Promise<Uint8Array[]>} - Array of individual PDF pages
     */
    async splitPDF(file) {
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
    },

    /**
     * Downloads a PDF file to the user's computer
     * @param {Uint8Array} data - PDF data
     * @param {string} filename - Desired filename
     */
    downloadPDF(data, filename) {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

export default pdfService;
