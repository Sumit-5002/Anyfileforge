import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as mammoth from 'mammoth';
import { safeText, downloadBlob } from './pdfUtils';
import pptxgen from 'pptxgenjs';

export const wordToPDF = async (file, onProgress) => {
    const images = [];
    const options = {
        convertImage: mammoth.images.inline((element) => {
            return element.read("base64").then((imageBuffer) => {
                const id = `img-${images.length}`;
                images.push({ id, data: imageBuffer, contentType: element.contentType });
                return { src: id };
            });
        })
    };

    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, options);
    const pdf = await PDFDocument.create(),
        fontN = await pdf.embedFont(StandardFonts.Helvetica),
        fontB = await pdf.embedFont(StandardFonts.HelveticaBold),
        fontI = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const margin = 50, fontSize = 11, lineH = 15;
    let page = pdf.addPage(), y = page.getHeight() - margin, maxW = page.getWidth() - (margin * 2);

    // Split by block tags
    const blocks = html.split(/<\/p>|<br\s*\/?>|<\/h[1-6]>|<\/div>/i);

    for (let i = 0; i < blocks.length; i++) {
        if (onProgress) onProgress((i / blocks.length) * 100);
        const block = blocks[i];

        // Check for images in this block
        const imgMatch = block.match(/<img\s+src="([^"]+)"/i);
        if (imgMatch) {
            const imgId = imgMatch[1];
            const imgData = images.find(img => img.id === imgId);
            if (imgData) {
                try {
                    const bytes = Uint8Array.from(atob(imgData.data), c => c.charCodeAt(0));
                    let pdfImg;
                    if (imgData.contentType === 'image/png') pdfImg = await pdf.embedPng(bytes);
                    else pdfImg = await pdf.embedJpg(bytes);

                    const dims = pdfImg.scale(0.5); // scale down to fit
                    const fitW = Math.min(maxW, dims.width);
                    const fitH = (fitW / dims.width) * dims.height;

                    if (y - fitH < margin) { page = pdf.addPage(); y = page.getHeight() - margin; }
                    page.drawImage(pdfImg, { x: margin, y: y - fitH, width: fitW, height: fitH });
                    y -= (fitH + lineH);
                } catch (e) {
                    console.warn("Failed to embed image in Word conversion", e);
                }
            }
        }

        const cleanPara = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!cleanPara) { y -= (lineH * 0.5); continue; }

        let curX = margin;
        const text = safeText(cleanPara);
        const words = text.split(/\s+/);

        for (const word of words) {
            if (!word) continue;
            const wTxt = word + ' ', wW = fontN.widthOfTextAtSize(wTxt, fontSize);
            if (curX + wW > margin + maxW) {
                curX = margin; y -= lineH;
                if (y < margin) { page = pdf.addPage(); y = page.getHeight() - margin; }
            }
            page.drawText(wTxt, { x: curX, y, size: fontSize, font: fontN });
            curX += wW;
        }
        y -= (lineH * 1.2);
        if (y < margin) { page = pdf.addPage(); y = page.getHeight() - margin; }
    }
    if (onProgress) onProgress(100);
    return pdf.save();
};

import JSZip from 'jszip';

export const pptToPDF = async (file, onProgress) => {
    try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const pdf = await PDFDocument.create();
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const emuToPt = 72 / 914400; // 914400 EMUs per inch, 72 points per inch

        // Default PPTX slide size in EMUs (10x7.5 inches for 4:3, or 10x5.625 for 16:9)
        // We'll try to detect it from ppt/presentation.xml later, or just use 16:9 defaults
        const slideW = 960, slideH = 540;

        const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
        slideFiles.sort((a, b) => {
            const numA = parseInt((a.match(/slide(\d+)\.xml/) || [0, 0])[1]);
            const numB = parseInt((b.match(/slide(\d+)\.xml/) || [0, 0])[1]);
            return numA - numB;
        });

        for (let i = 0; i < slideFiles.length; i++) {
            if (onProgress) onProgress(((i + 1) / slideFiles.length) * 100);
            const slidePath = slideFiles[i];
            const slideNum = (slidePath.match(/slide(\d+)\.xml/) || [0, 0])[1];
            const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;

            const xmlText = await zip.file(slidePath).async('text');
            let relsMap = {};

            // Parse relationships for images
            if (zip.file(relsPath)) {
                const relsXml = await zip.file(relsPath).async('text');
                const relationshipMatches = relsXml.match(/<Relationship\s+Id="([^"]+)"\s+Type="[^"]+image"\s+Target="([^"]+)"/g) || [];
                relationshipMatches.forEach(rel => {
                    const id = rel.match(/Id="([^"]+)"/)[1];
                    const target = rel.match(/Target="([^"]+)"/)[1];
                    // Target is usually ../media/image1.png
                    relsMap[id] = target.replace('../', 'ppt/');
                });
            }

            const page = pdf.addPage([slideW, slideH]);

            // Handle Images (<p:pic>)
            const picMatches = xmlText.match(/<p:pic>([\s\S]*?)<\/p:pic>/g) || [];
            for (const picXml of picMatches) {
                const offMatch = picXml.match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/);
                const extMatch = picXml.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
                const rTitleMatch = picXml.match(/r:embed="([^"]+)"/);

                if (offMatch && extMatch && rTitleMatch) {
                    const rId = rTitleMatch[1];
                    const mediaPath = relsMap[rId];
                    if (mediaPath && zip.file(mediaPath)) {
                        try {
                            const x = parseInt(offMatch[1]) * emuToPt;
                            const y = slideH - (parseInt(offMatch[2]) * emuToPt);
                            const w = parseInt(extMatch[1]) * emuToPt;
                            const h = parseInt(extMatch[2]) * emuToPt;

                            const imgData = await zip.file(mediaPath).async('uint8array');
                            let pdfImg;
                            if (mediaPath.toLowerCase().endsWith('.png')) pdfImg = await pdf.embedPng(imgData);
                            else pdfImg = await pdf.embedJpg(imgData);

                            page.drawImage(pdfImg, { x, y: y - h, width: w, height: h });
                        } catch (e) {
                            console.warn("Failed to embed image:", mediaPath, e);
                        }
                    }
                }
            }

            // Simple XML parsing for shapes and text boxes (<p:sp>)
            const shapeMatches = xmlText.match(/<p:sp>([\s\S]*?)<\/p:sp>/g) || [];

            for (const shapeXml of shapeMatches) {
                const offMatch = shapeXml.match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/);
                const extMatch = shapeXml.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);

                if (offMatch && extMatch) {
                    const x = parseInt(offMatch[1]) * emuToPt;
                    const y = slideH - (parseInt(offMatch[2]) * emuToPt);
                    const w = parseInt(extMatch[1]) * emuToPt;
                    const h = parseInt(extMatch[2]) * emuToPt;

                    const textMatches = shapeXml.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
                    const text = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim();

                    if (text) {
                        const fontSize = 18;
                        const words = safeText(text).split(/\s+/);
                        let curLine = '', curY = y - fontSize;

                        for (const word of words) {
                            const testLine = curLine ? `${curLine} ${word}` : word;
                            if (font.widthOfTextAtSize(testLine, fontSize) > w && curLine) {
                                page.drawText(curLine, { x, y: curY, size: fontSize, font });
                                curY -= (fontSize * 1.2);
                                if (curY < y - h) break;
                                curLine = word;
                            } else curLine = testLine;
                        }
                        if (curLine && curY >= y - h) page.drawText(curLine, { x, y: curY, size: fontSize, font });
                    }
                }
            }

            if (shapeMatches.length === 0 && picMatches.length === 0) {
                const textMatches = xmlText.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
                const allText = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
                if (allText.trim()) {
                    page.drawText(safeText(allText), { x: 50, y: slideH - 100, size: 14, font });
                }
            }
        }

        if (slideFiles.length === 0) {
            const page = pdf.addPage([slideW, slideH]);
            page.drawText("No slides found in this PPTX file.", { x: 50, y: 300, font });
        }

        return pdf.save();
    } catch (error) {
        console.error("PPT to PDF Error:", error);
        throw new Error("Failed to parse PowerPoint slides. " + error.message);
    }
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
