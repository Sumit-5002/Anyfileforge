import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as mammoth from 'mammoth';
import { safeText, downloadBlob } from './pdfUtils';
import pptxgen from 'pptxgenjs';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export const wordToPDF = async (filesInput, onProgress) => {
    const files = Array.isArray(filesInput) ? filesInput : [filesInput];
    const pdf = await PDFDocument.create();
    const fontN = await pdf.embedFont(StandardFonts.Helvetica);
    const margin = 50, fontSize = 11, lineH = 15;

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const file = files[fIdx];
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
        let page = pdf.addPage();
        let y = page.getHeight() - margin, maxW = page.getWidth() - (margin * 2);

        const blocks = html.split(/<\/p>|<br\s*\/?>|<\/h[1-6]>|<\/div>/i);

        for (let i = 0; i < blocks.length; i++) {
            if (onProgress) {
                const fileProgress = i / blocks.length;
                const totalProgress = ((fIdx + fileProgress) / files.length) * 100;
                onProgress(totalProgress);
            }
            const block = blocks[i];

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

                        const dims = pdfImg.scale(0.5);
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
    }
    if (onProgress) onProgress(100);
    return pdf.save();
};

import JSZip from 'jszip';

const normalizePptxPath = (path) => String(path || '').replace(/\\/g, '/');

const resolveRelTarget = (baseDir, target) => {
    const b = normalizePptxPath(baseDir);
    const t = normalizePptxPath(target);
    if (!t) return null;

    // Targets are typically relative paths like ../media/image1.png
    const combined = t.startsWith('/') ? t.replace(/^\/+/, '') : `${b}${t}`;
    const parts = combined.split('/');
    const out = [];
    for (const p of parts) {
        if (!p || p === '.') continue;
        if (p === '..') out.pop();
        else out.push(p);
    }
    return out.join('/');
};

const parseRelationships = (relsXml) => {
    const rels = [];
    const matches = String(relsXml || '').match(/<Relationship\b[^>]*?>/g) || [];
    for (const m of matches) {
        const id = (m.match(/\sId="([^"]+)"/) || [])[1];
        const type = (m.match(/\sType="([^"]+)"/) || [])[1];
        const target = (m.match(/\sTarget="([^"]+)"/) || [])[1];
        if (id && target) rels.push({ id, type: type || '', target });
    }
    return rels;
};

const drawBackgroundFromXml = async ({ xmlText, relsById, zip, pdf, page, slideW, slideH }) => {
    const bgBlock = String(xmlText || '').match(/<p:bg[\s\S]*?<\/p:bg>/);
    if (!bgBlock) return false;

    const rId = (bgBlock[0].match(/r:embed="([^"]+)"/) || [])[1];
    const mediaPath = rId ? relsById?.[rId] : null;
    if (!mediaPath || !zip.file(mediaPath)) return false;

    try {
        const imgData = await zip.file(mediaPath).async('uint8array');
        const img = mediaPath.toLowerCase().endsWith('.png') ? await pdf.embedPng(imgData) : await pdf.embedJpg(imgData);
        page.drawImage(img, { x: 0, y: 0, width: slideW, height: slideH });
        return true;
    } catch (e) {
        console.warn('Failed to embed background image:', mediaPath, e);
        return false;
    }
};

const drawPicsFromXml = async ({ xmlText, relsById, zip, pdf, page, emuToPt, slideH }) => {
    const picMatches = String(xmlText || '').match(/<p:pic>([\s\S]*?)<\/p:pic>/g) || [];
    let drawn = 0;

    for (const picXml of picMatches) {
        const offMatch = picXml.match(/<a:off\s+x="(\d+)"\s+y="(\d+)"/);
        const extMatch = picXml.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/);
        const rTitleMatch = picXml.match(/r:embed="([^"]+)"/);

        if (!offMatch || !extMatch || !rTitleMatch) continue;
        const rId = rTitleMatch[1];
        const mediaPath = relsById?.[rId];
        if (!mediaPath || !zip.file(mediaPath)) continue;

        try {
            const x = parseInt(offMatch[1]) * emuToPt;
            const y = slideH - (parseInt(offMatch[2]) * emuToPt);
            const w = parseInt(extMatch[1]) * emuToPt;
            const h = parseInt(extMatch[2]) * emuToPt;

            const imgData = await zip.file(mediaPath).async('uint8array');
            const pdfImg = mediaPath.toLowerCase().endsWith('.png') ? await pdf.embedPng(imgData) : await pdf.embedJpg(imgData);
            page.drawImage(pdfImg, { x, y: y - h, width: w, height: h });
            drawn += 1;
        } catch (e) {
            console.warn('Failed to embed image:', mediaPath, e);
        }
    }

    return drawn;
};

export const pptToPDF = async (file, onProgress) => {
    try {
        const name = String(file?.name || '').toLowerCase();
        if (name.endsWith('.ppt') && !name.endsWith('.pptx')) {
            throw new Error('Legacy .ppt files are not supported in browser mode. Please use a .pptx file (or convert using server mode).');
        }

        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const pdf = await PDFDocument.create();
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const emuToPt = 72 / 914400; // 914400 EMUs per inch, 72 points per inch

        // Slide size: read from ppt/presentation.xml (<p:sldSz cx="..." cy="...">) and convert EMU -> points.
        // Fallback is 16:9 (10 x 5.625 inches).
        let slideW = 9144000 * emuToPt; // 10 inches -> 720 pt
        let slideH = 5143500 * emuToPt; // 5.625 inches -> 405 pt

        const presFile = zip.file('ppt/presentation.xml');
        if (presFile) {
            const presXml = await presFile.async('text');
            const sldSz = presXml.match(/<p:sldSz[^>]*\scx="(\d+)"[^>]*\scy="(\d+)"/);
            if (sldSz) {
                const cx = Number(sldSz[1]);
                const cy = Number(sldSz[2]);
                if (Number.isFinite(cx) && cx > 0 && Number.isFinite(cy) && cy > 0) {
                    slideW = cx * emuToPt;
                    slideH = cy * emuToPt;
                }
            }
        }

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
            let slideLayoutPath = null;

            // Parse relationships for images
            if (zip.file(relsPath)) {
                const relsXml = await zip.file(relsPath).async('text');
                const rels = parseRelationships(relsXml);
                rels.forEach((r) => {
                    const resolved = resolveRelTarget('ppt/slides/', r.target);
                    if (resolved && r.type.toLowerCase().includes('/image')) relsMap[r.id] = resolved;
                    if (resolved && r.type.toLowerCase().includes('/slidelayout')) slideLayoutPath = resolved;
                });
            }

            const page = pdf.addPage([slideW, slideH]);

            // PPTX visuals often live in slide layouts/masters (backgrounds, decorative images).
            // Render order: master -> layout -> slide (then slide text).
            if (slideLayoutPath && zip.file(slideLayoutPath)) {
                try {
                    const layoutXml = await zip.file(slideLayoutPath).async('text');
                    const layoutNum = (slideLayoutPath.match(/slideLayout(\d+)\.xml/i) || [0, 0])[1];
                    const layoutRelsPath = layoutNum ? `ppt/slideLayouts/_rels/slideLayout${layoutNum}.xml.rels` : null;

                    let layoutImgs = {};
                    let slideMasterPath = null;
                    if (layoutRelsPath && zip.file(layoutRelsPath)) {
                        const layoutRelsXml = await zip.file(layoutRelsPath).async('text');
                        const rels = parseRelationships(layoutRelsXml);
                        rels.forEach((r) => {
                            const resolved = resolveRelTarget('ppt/slideLayouts/', r.target);
                            if (resolved && r.type.toLowerCase().includes('/image')) layoutImgs[r.id] = resolved;
                            if (resolved && r.type.toLowerCase().includes('/slidemaster')) slideMasterPath = resolved;
                        });
                    }

                    // Master (usually contains theme backgrounds / template art)
                    if (slideMasterPath && zip.file(slideMasterPath)) {
                        try {
                            const masterXml = await zip.file(slideMasterPath).async('text');
                            const masterNum = (slideMasterPath.match(/slideMaster(\d+)\.xml/i) || [0, 0])[1];
                            const masterRelsPath = masterNum ? `ppt/slideMasters/_rels/slideMaster${masterNum}.xml.rels` : null;

                            let masterImgs = {};
                            if (masterRelsPath && zip.file(masterRelsPath)) {
                                const masterRelsXml = await zip.file(masterRelsPath).async('text');
                                const rels = parseRelationships(masterRelsXml);
                                rels.forEach((r) => {
                                    const resolved = resolveRelTarget('ppt/slideMasters/', r.target);
                                    if (resolved && r.type.toLowerCase().includes('/image')) masterImgs[r.id] = resolved;
                                });
                            }

                            await drawBackgroundFromXml({ xmlText: masterXml, relsById: masterImgs, zip, pdf, page, slideW, slideH });
                            await drawPicsFromXml({ xmlText: masterXml, relsById: masterImgs, zip, pdf, page, emuToPt, slideH });
                        } catch (e) {
                            console.warn('Failed to render slide master for', slidePath, e);
                        }
                    }

                    await drawBackgroundFromXml({ xmlText: layoutXml, relsById: layoutImgs, zip, pdf, page, slideW, slideH });
                    await drawPicsFromXml({ xmlText: layoutXml, relsById: layoutImgs, zip, pdf, page, emuToPt, slideH });
                } catch (e) {
                    console.warn('Failed to render slide layout for', slidePath, e);
                }
            }

            await drawBackgroundFromXml({ xmlText, relsById: relsMap, zip, pdf, page, slideW, slideH });
            const picMatches = xmlText.match(/<p:pic>([\s\S]*?)<\/p:pic>/g) || [];
            await drawPicsFromXml({ xmlText, relsById: relsMap, zip, pdf, page, emuToPt, slideH });

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
