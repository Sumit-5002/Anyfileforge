import { PDFDocument, StandardFonts } from 'pdf-lib';
import { safeText } from './pdfUtils';

/**
 * Converts HTML content/file to PDF (Simplified offline version)
 */
export const htmlToPDF = async (fileOrContent, onProgress) => {
    let html = '';
    if (fileOrContent instanceof File) {
        html = await fileOrContent.text();
    } else {
        html = String(fileOrContent);
    }

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const margin = 50, baseSize = 10, lineH = 14;
    let page = pdf.addPage(), y = page.getHeight() - margin;
    const maxW = page.getWidth() - (margin * 2);

    // Strip scripts and styles
    const cleanHtml = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '');

    // Improved tag parsing - looking for H1-H6, P, DIV, BR
    const paras = cleanHtml.split(/<\/p>|<br\s*\/?>|<\/div>|<\/h[1-6]>/i);

    for (let i = 0; i < paras.length; i++) {
        if (onProgress) onProgress((i / paras.length) * 100);
        const p = paras[i];

        // Determine if it's a heading
        let fontSize = baseSize;
        let activeFont = font;
        if (/<h1/i.test(p)) { fontSize = 24; activeFont = fontBold; }
        else if (/<h2/i.test(p)) { fontSize = 20; activeFont = fontBold; }
        else if (/<h3/i.test(p)) { fontSize = 16; activeFont = fontBold; }
        else if (/<h[4-6]/i.test(p)) { fontSize = 14; activeFont = fontBold; }

        // Strip remaining tags but keep text
        let text = p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        text = safeText(text);

        if (!text) {
            y -= (lineH * 0.5);
            continue;
        }

        const words = text.split(/\s+/);
        let curLine = '';

        for (const word of words) {
            const testLine = curLine ? `${curLine} ${word}` : word;
            if (activeFont.widthOfTextAtSize(testLine, fontSize) > maxW && curLine) {
                page.drawText(curLine, { x: margin, y, size: fontSize, font: activeFont });
                y -= (fontSize * 1.2);
                if (y < margin) { page = pdf.addPage(); y = page.getHeight() - margin; }
                curLine = word;
            } else curLine = testLine;
        }
        if (curLine) {
            page.drawText(curLine, { x: margin, y, size: fontSize, font: activeFont });
            y -= (fontSize * 1.2);
        }
        y -= (fontSize * 0.4);
        if (y < margin) { page = pdf.addPage(); y = page.getHeight() - margin; }
    }

    return pdf.save();
};
