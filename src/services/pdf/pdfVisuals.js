import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export const addPageNumbers = async (file, options = {}, password) => {
    const { startAt = 1, position = 'bottom-right', fontSize = 12, color = rgb(0.6, 0.6, 0.6) } = options;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
    const pages = pdf.getPages();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    pages.forEach((page, idx) => {
        const { width } = page.getSize();
        const text = `${startAt + idx}`;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const margin = 24;
        let x = position === 'bottom-center' ? (width - textWidth) / 2 : margin;
        if (position === 'bottom-right') x = width - textWidth - margin;
        page.drawText(text, { x, y: margin, size: fontSize, font, color });
    });
    return pdf.save();
};

export const addWatermarkText = async (file, options = {}, password) => {
    const { text = 'CONFIDENTIAL', opacity = 0.2, angle = 30, fontSize = 48 } = options;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, password ? { password } : undefined);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    pdf.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(text, {
            x: (width - font.widthOfTextAtSize(text, fontSize)) / 2,
            y: height / 2, size: fontSize, font, color: rgb(0.2, 0.2, 0.2), rotate: degrees(angle), opacity
        });
    });
    return pdf.save();
};

export const addTextToPdf = async (file, options = {}) => {
    const { text = '', pageNum = 1, x = 50, y = 50, fontSize = 12 } = options;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const pageIndex = Math.max(0, Math.min(pageNum - 1, pages.length - 1));
    const page = pages[pageIndex];
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    
    page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0)
    });
    
    return pdf.save();
};
