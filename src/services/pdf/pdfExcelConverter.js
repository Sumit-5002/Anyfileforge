import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { safeText, downloadBlob } from './pdfUtils';
import * as pdfjs from 'pdfjs-dist';

export const excelToPDF = async (file) => {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    const pdfDoc = await PDFDocument.create(), font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const margin = 40, fontSize = 10, rowHeight = 20;
    let page = pdfDoc.addPage(), y = page.getHeight() - margin;

    const colCount = Math.max(...data.map(r => r.length));
    const rawWidths = Array(colCount).fill(0);
    data.slice(0, 50).forEach(row => row.forEach((c, i) => {
        const w = font.widthOfTextAtSize(safeText(c), fontSize);
        if (w > rawWidths[i]) rawWidths[i] = w;
    }));
    const totalRaw = rawWidths.reduce((a, b) => a + b, 0) + (colCount * 15);
    const scale = Math.min(1, (page.getWidth() - (margin * 2)) / totalRaw);
    const colWidths = rawWidths.map(w => (w + 15) * scale);

    data.forEach(row => {
        let x = margin;
        row.forEach((cell, i) => {
            const txt = safeText(cell), cw = colWidths[i], avail = cw - 8;
            const disp = font.widthOfTextAtSize(txt, fontSize) > avail ? txt.substring(0, Math.floor(avail / (fontSize * 0.5))) + '..' : txt;
            page.drawText(disp, { x: x + 4, y, size: fontSize, font });
            x += cw;
        });
        y -= rowHeight;
        if (y < margin) { page = pdfDoc.addPage(); y = page.getHeight() - margin; }
    });
    return pdfDoc.save();
};

export const pdfToExcel = async (file) => {
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const rows = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i), text = await page.getTextContent();
        let currentY = -1, currentRow = [];
        text.items.forEach(item => {
            if (currentY !== -1 && Math.abs(item.transform[5] - currentY) > 5) {
                rows.push(currentRow); currentRow = [];
            }
            currentRow.push(item.str);
            currentY = item.transform[5];
        });
        if (currentRow.length) rows.push(currentRow);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data");
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadBlob(new Blob([out]), file.name.replace('.pdf', '.xlsx'));
};
