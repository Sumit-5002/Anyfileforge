import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as mammoth from 'mammoth';
import { safeText, downloadBlob } from './pdfUtils';
import pptxgen from 'pptxgenjs';

export const wordToPDF = async (file) => {
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const pdf = await PDFDocument.create(), fontN = await pdf.embedFont(StandardFonts.Helvetica), fontB = await pdf.embedFont(StandardFonts.HelveticaBold);
    const margin = 50, fontSize = 11, lineH = 15;
    let page = pdf.addPage(), y = page.getHeight() - margin, maxW = page.getWidth() - (margin * 2);

    // Basic HTML tag parsing for <strong> and <em>
    const paras = html.split(/<\/p>|<br\s*\/?>/i);
    for (const para of paras) {
        const cleanPara = para.replace(/<p>/gi, '').trim();
        if (!cleanPara) { y -= lineH; continue; }

        let curX = margin;
        // Split by <strong> and <em> tags
        const tokens = cleanPara.split(/(<strong>.*?<\/strong>|<em>.*?<\/em>)/gi);

        for (const token of tokens) {
            const isBold = /<strong>/i.test(token);
            const text = safeText(token.replace(/<[^>]+>/g, ''));
            const font = isBold ? fontB : fontN;
            const words = text.split(/\s+/);

            for (const word of words) {
                if (!word) continue;
                const wTxt = word + ' ', wW = font.widthOfTextAtSize(wTxt, fontSize);
                if (curX + wW > margin + maxW) {
                    curX = margin; y -= lineH;
                    if (y < margin) { page = pdf.addPage(); y = page.getHeight() - margin; }
                }
                page.drawText(wTxt, { x: curX, y, size: fontSize, font });
                curX += wW;
            }
        }
        y -= (lineH * 1.2); // Paragraph spacing
        if (y < margin) { page = pdf.addPage(); y = page.getHeight() - margin; }
    }
    return pdf.save();
};

export const pptToPDF = async (file) => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    page.drawText(`Converted PPT: ${file.name}`, { x: 50, y: 500 });
    page.drawText("PowerPoint to PDF conversion is basic in offline mode.", { x: 50, y: 450 });
    return pdf.save();
};

export const pdfToPPT = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const pres = new pptxgen();
        pres.layout = 'LAYOUT_16x9';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const slide = pres.addSlide();

            let fullText = textContent.items.map(item => item.str).join(' ');
            if (!fullText.trim()) fullText = "(No selectable text on this page)";

            slide.addText(fullText, {
                x: 0.5,
                y: 0.5,
                w: '90%',
                h: '80%',
                fontSize: 12,
                color: '363636',
                valign: 'top',
                breakLine: true
            });
        }

        const buffer = await pres.write({ outputType: 'arraybuffer' });
        downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), file.name.replace('.pdf', '.pptx'));
    } catch (error) {
        console.error("PDF to PPT Error:", error);
        alert("Failed to convert PDF to PPT. " + error.message);
    }
};
