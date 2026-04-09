import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';
import { downloadBlob } from './pdfUtils';

export const imagesToPDF = async (files, onProgress) => {
    const pdf = await (await import('pdf-lib')).PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (onProgress) onProgress((i / files.length) * 100);
        const image = await (f.type === 'image/png' ? pdf.embedPng(await f.arrayBuffer()) : pdf.embedJpg(await f.arrayBuffer()));
        const { width, height } = image.size();
        pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
    }
    if (onProgress) onProgress(100);
    return pdf.save();
};

/**
 * Converts a PDF into individual JPG images and downloads them as a ZIP file.
 * Optimized with chunked parallel rendering and Blob usage (Bolt ⚡).
 */
export const pdfToJpg = async (file, onProgress) => {
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const zip = new JSZip();
    const numPages = pdf.numPages;
    const CHUNK_SIZE = 4;

    for (let i = 1; i <= numPages; i += CHUNK_SIZE) {
        const chunk = [];
        for (let j = i; j < i + CHUNK_SIZE && j <= numPages; j++) {
            chunk.push(j);
        }

        // Render pages in parallel chunks to optimize performance while controlling memory usage
        await Promise.all(chunk.map(async (pageNum) => {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport }).promise;

            // Use toBlob instead of toDataURL to avoid Base64 encoding overhead (Bolt ⚡)
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    zip.file(`page_${pageNum}.jpg`, blob);
                    resolve();
                }, 'image/jpeg', 0.9);
            });
        }));

        if (onProgress) {
            const completed = Math.min(i + CHUNK_SIZE - 1, numPages);
            onProgress((completed / numPages) * 100);
        }
    }

    if (onProgress) onProgress(95); // Zipping phase
    const blob = await zip.generateAsync({ type: 'blob' });
    if (onProgress) onProgress(100);
    downloadBlob(blob, file.name.replace('.pdf', '_images.zip'));
};
