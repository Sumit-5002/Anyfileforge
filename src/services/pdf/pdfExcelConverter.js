import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { safeText, downloadBlob } from './pdfUtils';
import * as pdfjs from 'pdfjs-dist';

export const excelToPDF = async (filesInput, onProgress) => {
    const files = Array.isArray(filesInput) ? filesInput : [filesInput];
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 40, fontSize = 9, rowHeight = 22;

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const file = files[fIdx];
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let page = pdfDoc.addPage();
        let y = page.getHeight() - margin;
        const pageWidth = page.getWidth();

        // Calculate column widths
        const colCount = Math.max(...data.map(r => r.length));
        if (colCount === 0 || colCount === -Infinity) continue;

        const rawWidths = Array(colCount).fill(0);
        data.slice(0, 100).forEach(row => row.forEach((c, i) => {
            if (i >= colCount) return;
            const w = font.widthOfTextAtSize(safeText(c), fontSize);
            if (w > rawWidths[i]) rawWidths[i] = w;
        }));

        const totalRaw = rawWidths.reduce((a, b) => a + b, 0) + (colCount * 12);
        const scale = Math.min(1.2, (pageWidth - (margin * 2)) / Math.max(1, totalRaw));
        const colWidths = rawWidths.map(w => (w + 12) * scale);
        const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);

        for (let rIdx = 0; rIdx < data.length; rIdx++) {
            if (onProgress) {
                const fileProgress = rIdx / data.length;
                onProgress(((fIdx + fileProgress) / files.length) * 100);
            }
            const row = data[rIdx];

            if (rIdx === 0) {
                page.drawRectangle({
                    x: margin, y: y - 2,
                    width: totalTableWidth, height: rowHeight,
                    color: rgb(0.95, 0.95, 0.95)
                });
            }

            let x = margin;
            for (let cIdx = 0; cIdx < colCount; cIdx++) {
                const cell = row[cIdx] || '';
                const txt = safeText(cell);
                const cw = colWidths[cIdx] || 50;
                const cellFont = rIdx === 0 ? fontBold : font;

                const avail = cw - 8;
                let disp = txt;
                if (font.widthOfTextAtSize(txt, fontSize) > avail) {
                    disp = txt.substring(0, Math.max(0, Math.floor(avail / (fontSize * 0.5)))) + '...';
                }

                page.drawText(disp, { x: x + 4, y: y + 5, size: fontSize, font: cellFont });

                page.drawLine({
                    start: { x, y: y - 2 },
                    end: { x, y: y + rowHeight - 2 },
                    thickness: 0.5,
                    color: rgb(0.8, 0.8, 0.8)
                });
                x += cw;
            }

            page.drawLine({
                start: { x: margin + totalTableWidth, y: y - 2 },
                end: { x: margin + totalTableWidth, y: y + rowHeight - 2 },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8)
            });

            page.drawLine({
                start: { x: margin, y: y - 2 },
                end: { x: margin + totalTableWidth, y: y - 2 },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8)
            });

            y -= rowHeight;
            if (y < margin + rowHeight) {
                page = pdfDoc.addPage();
                y = page.getHeight() - margin;
                page.drawLine({
                    start: { x: margin, y: y + rowHeight - 2 },
                    end: { x: margin + totalTableWidth, y: y + rowHeight - 2 },
                    thickness: 0.5,
                    color: rgb(0.8, 0.8, 0.8)
                });
            }
        }
    }

    if (onProgress) onProgress(100);
    return pdfDoc.save();
};

export const pdfToExcel = async (file) => {
    try {
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const allRows = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const items = textContent.items;

            // Group by approximate Y coordinate (rows)
            const rowsMap = {};
            items.forEach(item => {
                const y = Math.round(item.transform[5] / 5) * 5; // 5pt tolerance
                if (!rowsMap[y]) rowsMap[y] = [];
                rowsMap[y].push(item);
            });

            // Sort Y coordinates descending (top to bottom)
            const sortedYs = Object.keys(rowsMap).sort((a, b) => b - a);

            sortedYs.forEach(y => {
                // For each row, sort by X coordinate (left to right)
                const rowItems = rowsMap[y].sort((a, b) => a.transform[4] - b.transform[4]);
                const rowData = [];
                let currentX = -1;

                rowItems.forEach(item => {
                    const x = item.transform[4];
                    // If far enough, start new cell (approximate column detection)
                    if (currentX !== -1 && (x - currentX) > 40) {
                        // Empty cells could be added here if we wanted strictly fixed columns
                    }
                    rowData.push(item.str);
                    currentX = x + (item.width || 0);
                });

                if (rowData.length) allRows.push(rowData);
            });
        }

        const ws = XLSX.utils.aoa_to_sheet(allRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), file.name.replace('.pdf', '.xlsx'));
    } catch (error) {
        console.error("PDF to Excel Error:", error);
        alert("Failed to extract Excel data. " + error.message);
    }
};
