import { PDFDocument, StandardFonts } from 'pdf-lib';
import { safeText } from './pdfUtils';

/**
 * Converts HTML content/file to PDF (Simplified offline version)
 */
export const htmlToPDF = async (fileOrContent) => {
    let html = '';
    if (fileOrContent instanceof File) {
        html = await fileOrContent.text();
    } else {
        html = String(fileOrContent);
    }

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const margin = 50, fontSize = 10, lineH = 14;
    let page = pdf.addPage(), y = page.getHeight() - margin;
    const maxW = page.getWidth() - (margin * 2);

    // Strip scripts and styles
    const cleanHtml = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '');

    // Extract text from common tags
    const paras = cleanHtml.split(/<\/p>|<br\s*\/?>|<\/div>|<\/h[1-6]>/i);

    for (const p of paras) {
        const text = safeText(p.replace(/<[^>]+>/g, ' ').trim());
        if (!text) {
            if (p.includes('<p') || p.includes('<div')) y -= (lineH * 0.5);
            continue;
        }

        const words = text.split(/\s+/);
        let curLine = '';

        for (const word of words) {
            const testLine = curLine ? `${curLine} ${word}` : word;
            if (font.widthOfTextAtSize(testLine, fontSize) > maxW && curLine) {
                page.drawText(curLine, { x: margin, y, size: fontSize, font });
                y -= lineH;
                if (y < margin) { page = pdf.addPage(); y = page.getHeight() - margin; }
                curLine = word;
            } else curLine = testLine;
        }
        if (curLine) {
            page.drawText(curLine, { x: margin, y, size: fontSize, font });
            y -= lineH;
        }
        y -= (lineH * 0.5);
        if (y < margin) { page = pdf.addPage(); y = page.getHeight() - margin; }
    }

    return pdf.save();
};
