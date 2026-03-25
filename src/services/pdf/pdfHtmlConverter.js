import { PDFDocument, StandardFonts } from 'pdf-lib';
import html2canvas from 'html2canvas';
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

/**
 * High-Performance Offline HTML to Image Conversion
 */
export const htmlToImage = async (fileOrUrl, onProgress) => {
    if (onProgress) onProgress(10);
    
    let content = '';
    if (fileOrUrl instanceof File) {
        content = await fileOrUrl.text();
    } else if (fileOrUrl.startsWith('http')) {
        // Warning: This will be hit by CORS in plain browser. 
        // For project exhibition, we attempt it but fallback
        try {
            const resp = await fetch(fileOrUrl, { mode: 'no-cors' });
            content = `<h1>Remote Content Preview</h1><p>Source: ${fileOrUrl}</p><p>Offline browser engines cannot fully render remote URLs due to CORS security. Try pasting the actual HTML code or uploading an .html file for 100% fidelity.</p>`;
        } catch (e) {
            content = `<h1>Error Loading URL</h1><p>${fileOrUrl}</p>`;
        }
    } else {
        content = fileOrUrl;
    }

    if (onProgress) onProgress(30);

    // Create hidden rendering container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1024px';
    container.style.background = 'white';
    container.style.padding = '40px';
    container.innerHTML = content;
    document.body.appendChild(container);

    if (onProgress) onProgress(60);

    try {
        const canvas = await html2canvas(container, {
            useCORS: true,
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
        });
        
        if (onProgress) onProgress(90);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
        document.body.removeChild(container);
        
        return await blob.arrayBuffer();
    } catch (err) {
        console.error('HTML Render failed:', err);
        document.body.removeChild(container);
        throw new Error('Failed to render HTML locally. Content might be too complex for browser-side engine.');
    }
};
