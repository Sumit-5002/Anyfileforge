import { PDFDocument } from 'pdf-lib';

export const addSignatureImage = async (pdfFile, imageFile, options = {}, password) => {
    const { pageNumber = 1, x = 50, y = 50, width = 160, height } = options;
    const pdf = await PDFDocument.load(await pdfFile.arrayBuffer(), password ? { password } : undefined);
    const pages = pdf.getPages();
    const page = pages[Math.min(Math.max(0, (Number(pageNumber) || 1) - 1), pages.length - 1)];

    const imgBuffer = await imageFile.arrayBuffer();
    const embedded = imageFile.type === 'image/png' ? await pdf.embedPng(imgBuffer) : await pdf.embedJpg(imgBuffer);
    const nat = embedded.scale(1);
    const tw = Math.max(1, Number(width) || nat.width);
    const th = Number.isFinite(Number(height)) ? Number(height) : Math.round((tw * nat.height) / nat.width);

    page.drawImage(embedded, { x: Number(x) || 0, y: Number(y) || 0, width: tw, height: th });
    return pdf.save();
};
