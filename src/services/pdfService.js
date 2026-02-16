import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

/**
 * Service to handle PDF manipulations
 */
const pdfService = {
    async getPageCount(file, password) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        return pdf.getPageCount();
    },

    /**
     * Merges multiple PDF files into one
     * @param {File[]} files - Array of File objects to merge
     * @returns {Promise<Uint8Array>} - Merged PDF as Uint8Array
     */
    async mergePDFs(files) {
        const mergedPdf = await PDFDocument.create();

        // Load all PDFs in parallel for better performance (Bolt ⚡)
        const loadedPdfs = await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            return await PDFDocument.load(arrayBuffer);
        }));

        for (const pdf of loadedPdfs) {
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

    async extractPages(file, pageIndices, password) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        const results = [];

        for (const index of pageIndices) {
            const splitPdf = await PDFDocument.create();
            const [copiedPage] = await splitPdf.copyPages(pdf, [index]);
            splitPdf.addPage(copiedPage);
            results.push(await splitPdf.save());
        }

        return results;
    },

    async reorderPages(file, orderedIndices, password) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        const output = await PDFDocument.create();
        const copiedPages = await output.copyPages(pdf, orderedIndices);
        copiedPages.forEach((page) => output.addPage(page));
        return output.save();
    },

    async removePages(file, removeIndices, password) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        const total = pdf.getPageCount();
        const removeSet = new Set(removeIndices);
        const keep = [];
        for (let i = 0; i < total; i += 1) {
            if (!removeSet.has(i)) keep.push(i);
        }
        return this.reorderPages(file, keep, password);
    },

    async rotatePages(file, pageIndices, angle, password) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        const pages = pdf.getPages();
        const indices = pageIndices.length ? pageIndices : pages.map((_, idx) => idx);
        indices.forEach((idx) => {
            const page = pages[idx];
            const current = page.getRotation().angle || 0;
            page.setRotation(degrees(current + angle));
        });
        return pdf.save();
    },

    async addPageNumbers(file, options = {}, password) {
        const {
            startAt = 1,
            position = 'bottom-right',
            fontSize = 12,
            color = rgb(0.6, 0.6, 0.6)
        } = options;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        const pages = pdf.getPages();
        const font = await pdf.embedFont(StandardFonts.Helvetica);

        pages.forEach((page, idx) => {
            const { width } = page.getSize();
            const text = `${startAt + idx}`;
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const margin = 24;
            let x = margin;
            if (position === 'bottom-center') x = (width - textWidth) / 2;
            if (position === 'bottom-right') x = width - textWidth - margin;
            const y = margin;
            page.drawText(text, { x, y, size: fontSize, font, color });
        });

        return pdf.save();
    },

    async addWatermarkText(file, options = {}, password) {
        const {
            text = 'CONFIDENTIAL',
            opacity = 0.2,
            angle = 30,
            fontSize = 48
        } = options;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        const pages = pdf.getPages();
        const font = await pdf.embedFont(StandardFonts.HelveticaBold);
        const color = rgb(0.2, 0.2, 0.2);

        pages.forEach((page) => {
            const { width, height } = page.getSize();
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const x = (width - textWidth) / 2;
            const y = height / 2;
            page.drawText(text, {
                x,
                y,
                size: fontSize,
                font,
                color,
                rotate: degrees(angle),
                opacity
            });
        });

        return pdf.save();
    },

    async unlockPDF(file, password) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        return pdf.save();
    },

    async addSignatureImage(pdfFile, imageFile, options = {}, password) {
        const {
            pageNumber = 1,
            x = 50,
            y = 50,
            width = 160,
            height
        } = options;

        const pdfBuffer = await pdfFile.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBuffer, password ? { password } : undefined);
        const pages = pdf.getPages();
        if (!pages.length) throw new Error('PDF has no pages.');

        const pageIndex = Math.min(Math.max(0, (Number(pageNumber) || 1) - 1), pages.length - 1);
        const page = pages[pageIndex];

        const imgBuffer = await imageFile.arrayBuffer();
        const isPng = imageFile.type === 'image/png';
        const embedded = isPng ? await pdf.embedPng(imgBuffer) : await pdf.embedJpg(imgBuffer);
        const natural = embedded.scale(1);

        const targetWidth = Math.max(1, Number(width) || natural.width);
        const targetHeight = Number.isFinite(Number(height))
            ? Math.max(1, Number(height))
            : Math.max(1, Math.round((targetWidth * natural.height) / natural.width));

        page.drawImage(embedded, {
            x: Number(x) || 0,
            y: Number(y) || 0,
            width: targetWidth,
            height: targetHeight
        });

        return pdf.save();
    },

    async redactPDF(file, rectangles = [], pageIndices = [], password) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        const pages = pdf.getPages();
        const indices = pageIndices.length ? pageIndices : pages.map((_, idx) => idx);

        const rects = (rectangles || []).filter((r) =>
            Number.isFinite(r?.x) &&
            Number.isFinite(r?.y) &&
            Number.isFinite(r?.width) &&
            Number.isFinite(r?.height)
        );
        if (!rects.length) throw new Error('No redaction rectangles provided.');

        indices.forEach((idx) => {
            const page = pages[idx];
            rects.forEach((rect) => {
                page.drawRectangle({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    color: rgb(0, 0, 0)
                });
            });
        });

        return pdf.save();
    },

    async cropPages(file, margins = {}, pageIndices = [], password) {
        const { top = 0, right = 0, bottom = 0, left = 0 } = margins;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        const pages = pdf.getPages();
        const indices = pageIndices.length ? pageIndices : pages.map((_, idx) => idx);

        indices.forEach((idx) => {
            const page = pages[idx];
            const { width, height } = page.getSize();
            const newWidth = Math.max(1, width - left - right);
            const newHeight = Math.max(1, height - top - bottom);
            const x = Math.min(Math.max(left, 0), width - 1);
            const y = Math.min(Math.max(bottom, 0), height - 1);
            page.setCropBox(x, y, newWidth, newHeight);
            page.setTrimBox(x, y, newWidth, newHeight);
        });

        return pdf.save();
    },

    async imagesToPDF(files) {
        const pdf = await PDFDocument.create();

        // Embed all images in parallel for better performance (Bolt ⚡)
        const embeddedImages = await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            if (file.type === 'image/png') {
                return await pdf.embedPng(arrayBuffer);
            }
            return await pdf.embedJpg(arrayBuffer);
        }));

        for (const image of embeddedImages) {
            const { width, height } = image.size();
            const page = pdf.addPage([width, height]);
            page.drawImage(image, { x: 0, y: 0, width, height });
        }

        return pdf.save();
    },

    async rewritePDF(file, password) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
        return pdf.save();
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
