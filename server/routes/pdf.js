import express from 'express';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Merge PDFs
router.post('/merge', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.array('files', 10)(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.files || req.files.length < 2) {
                return res.status(400).json({ error: 'At least 2 PDF files are required' });
            }

            try {
                const mergedPdf = await PDFDocument.create();

                // Load and process PDFs sequentially to prevent excessive memory usage and check limits early
                let totalPages = 0;
                for (const file of req.files) {
                    const pdfBytes = await fs.readFile(file.path);
                    const pdf = await PDFDocument.load(pdfBytes);

                    totalPages += pdf.getPageCount();
                    if (totalPages > 1000) {
                        return res.status(400).json({ error: 'Total page limit exceeded (max 1000 pages)' });
                    }

                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }

                const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
                res.send(Buffer.from(mergedPdfBytes));
            } catch (error) {
                console.error('PDF merge error:', error);
                res.status(500).json({ error: 'Failed to merge PDFs' });
            } finally {
                // Clean up ALL uploaded files in parallel
                if (req.files) {
                    await Promise.all(req.files.map(file =>
                        fs.unlink(file.path).catch(err => {
                            if (err.code !== 'ENOENT') console.error('Failed to unlink file:', file.path, err.message);
                        })
                    ));
                }
            }
        });
    } catch (error) {
        // This catch is for errors BEFORE the Multer callback starts
        console.error('PDF merge outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Split PDF
router.post('/split', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'PDF file is required' });
            }

            const { pages } = req.body; // e.g., "1,3,5" or "1-3,5"

            if (typeof pages !== 'string' || pages.length > 1000) {
                await fs.unlink(req.file.path).catch(() => {});
                return res.status(400).json({ error: 'Invalid or too long page range string' });
            }

            try {
                const pdfBytes = await fs.readFile(req.file.path);
                const pdf = await PDFDocument.load(pdfBytes);

                const newPdf = await PDFDocument.create();
                const pageIndices = parsePageRange(pages, pdf.getPageCount());

                if (pageIndices.length > 1000) {
                    return res.status(400).json({ error: 'Too many pages requested (max 1000)' });
                }

                const copiedPages = await newPdf.copyPages(pdf, pageIndices);
                copiedPages.forEach((page) => newPdf.addPage(page));

                const newPdfBytes = await newPdf.save({ useObjectStreams: true });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=split.pdf');
                res.send(Buffer.from(newPdfBytes));
            } catch (error) {
                console.error('PDF split error:', error);
                res.status(500).json({ error: 'Failed to split PDF' });
            } finally {
                await fs.unlink(req.file.path).catch(err => {
                    if (err.code !== 'ENOENT') console.error('Failed to unlink file:', err.message);
                });
            }
        });
    } catch (error) {
        console.error('PDF split outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Compress PDF
router.post('/compress', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'PDF file is required' });
            }

            try {
                const pdfBytes = await fs.readFile(req.file.path);
                const pdf = await PDFDocument.load(pdfBytes);

                // Basic compression by re-saving
                const compressedBytes = await pdf.save({
                    useObjectStreams: true,
                    addDefaultPage: false
                });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=compressed.pdf');
                res.send(Buffer.from(compressedBytes));
            } catch (error) {
                console.error('PDF compress error:', error);
                res.status(500).json({ error: 'Failed to compress PDF' });
            } finally {
                await fs.unlink(req.file.path).catch(err => {
                    if (err.code !== 'ENOENT') console.error('Failed to unlink file:', err.message);
                });
            }
        });
    } catch (error) {
        console.error('PDF compress outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to parse page ranges with a safety limit
function parsePageRange(rangeStr, totalPages, maxPages = 1000) {
    const indices = [];
    const parts = rangeStr.split(',');

    for (const part of parts) {
        if (part.includes('-')) {
            const rangeParts = part.split('-');
            if (rangeParts.length !== 2) continue;
            const start = parseInt(rangeParts[0].trim()) - 1;
            const end = parseInt(rangeParts[1].trim()) - 1;

            if (isNaN(start) || isNaN(end)) continue;

            for (let i = Math.max(0, start); i <= end && i < totalPages; i++) {
                indices.push(i);
                if (indices.length > maxPages) return indices;
            }
        } else {
            const page = parseInt(part.trim()) - 1;
            if (!isNaN(page) && page >= 0 && page < totalPages) {
                indices.push(page);
                if (indices.length > maxPages) return indices;
            }
        }
    }

    return indices;
}

export default router;
