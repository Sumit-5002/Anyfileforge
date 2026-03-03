import { PDFDocument, degrees } from 'pdf-lib';

export const rotatePages = async (file, pageIndices, angle) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const indices = pageIndices.length ? pageIndices : pages.map((_, idx) => idx);
    indices.forEach((idx) => {
        const page = pages[idx];
        const current = page.getRotation().angle || 0;
        page.setRotation(degrees(current + angle));
    });
    return pdf.save();
};

export const cropPages = async (file, margins = {}, pageIndices = []) => {
    const { top = 0, right = 0, bottom = 0, left = 0 } = margins;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const indices = pageIndices.length ? pageIndices : pages.map((_, idx) => idx);
    indices.forEach((idx) => {
        const page = pages[idx];
        const { width, height } = page.getSize();
        const nx = Math.min(Math.max(left, 0), width - 1);
        const ny = Math.min(Math.max(bottom, 0), height - 1);
        const nw = Math.max(1, width - left - right);
        const nh = Math.max(1, height - top - bottom);
        page.setCropBox(nx, ny, nw, nh);
        page.setTrimBox(nx, ny, nw, nh);
    });
    return pdf.save();
};
