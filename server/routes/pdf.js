import express from 'express';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OCR_SCRIPT_PATH = path.resolve(__dirname, '../scripts/ocr_pdf.py');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python';

let qpdfFactoryPromise = null;

const getQpdfFactory = async () => {
    if (!qpdfFactoryPromise) {
        qpdfFactoryPromise = import('qpdf-wasm-esm-embedded').then((m) => m.default || m);
    }
    return qpdfFactoryPromise;
};

const cleanupUploadedFiles = async (req) => {
    if (req.file?.path) {
        await fs.unlink(req.file.path).catch((err) => {
            if (err.code !== 'ENOENT') console.error('Failed to unlink file:', err.message);
        });
    }

    if (Array.isArray(req.files)) {
        await Promise.all(req.files.map((file) =>
            fs.unlink(file.path).catch((err) => {
                if (err.code !== 'ENOENT') console.error('Failed to unlink file:', file.path, err.message);
            })
        ));
    }
};

const runPythonOcr = async ({ inputPath, outputPdfPath, sidecarTextPath, language = 'eng' }) =>
    new Promise((resolve, reject) => {
        const args = [
            OCR_SCRIPT_PATH,
            '--input',
            inputPath,
            '--output-pdf',
            outputPdfPath,
            '--output-text',
            sidecarTextPath,
            '--language',
            language
        ];

        const proc = spawn(PYTHON_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (chunk) => {
            stdout += String(chunk);
        });

        proc.stderr.on('data', (chunk) => {
            stderr += String(chunk);
        });

        proc.on('error', (error) => {
            reject(new Error(`Failed to start OCR engine: ${error.message}`));
        });

        proc.on('close', (code) => {
            if (code === 0) return resolve({ stdout, stderr });
            reject(new Error(stderr || stdout || `OCR process failed with exit code ${code}`));
        });
    });

// Merge PDFs
router.post('/merge', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.array('files', 10)(req, res, async (err) => {
            if (err) {
                console.error('PDF merge upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
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
                console.error('PDF split upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
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
                    return res.status(400).json({ error: 'Total page limit exceeded (max 1000 pages)' });
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
                console.error('PDF compress upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
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

// OCR PDF to searchable PDF
router.post('/ocr', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('PDF OCR upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'PDF file is required' });
            }

            try {
                const language = String(req.body?.language || 'eng').trim() || 'eng';
                const outputPdfPath = `${req.file.path}.ocr.pdf`;
                const outputTextPath = `${req.file.path}.ocr.txt`;

                try {
                    await runPythonOcr({
                        inputPath: req.file.path,
                        outputPdfPath,
                        sidecarTextPath: outputTextPath,
                        language
                    });

                    const ocrPdfBytes = await fs.readFile(outputPdfPath);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'attachment; filename=ocr_searchable.pdf');
                    res.send(ocrPdfBytes);
                } finally {
                    await fs.unlink(outputPdfPath).catch(() => { });
                    await fs.unlink(outputTextPath).catch(() => { });
                }
            } catch (error) {
                console.error('PDF OCR error:', error);

                // Fallback: if PDF already has a text layer, return original as searchable PDF.
                try {
                    const pdfBytes = await fs.readFile(req.file.path);
                    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) });
                    const doc = await loadingTask.promise;
                    let hasText = false;

                    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
                        const page = await doc.getPage(pageNumber);
                        const textContent = await page.getTextContent();
                        if (textContent.items.some((item) => String(item.str || '').trim())) {
                            hasText = true;
                            break;
                        }
                    }

                    if (hasText) {
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', 'attachment; filename=searchable_original.pdf');
                        return res.send(Buffer.from(pdfBytes));
                    }
                } catch (fallbackError) {
                    console.error('PDF OCR fallback error:', fallbackError);
                }

                return res.status(500).json({
                    error: 'OCR engine unavailable or failed',
                    message: 'Install Python OCR dependencies (tesseract + pytesseract + PyMuPDF + ocrmypdf) on the server and retry.'
                });
            } finally {
                await cleanupUploadedFiles(req);
            }
        });
    } catch (error) {
        console.error('PDF OCR outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Edit PDF (basic server editor: add text + optional rectangle)
router.post('/edit', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('PDF edit upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'PDF file is required' });
            }

            const {
                text = '',
                page = '1',
                x = '48',
                y = '760',
                size = '18',
                drawRect = 'false',
                rectX = '48',
                rectY = '700',
                rectWidth = '220',
                rectHeight = '80'
            } = req.body || {};

            try {
                const pdfBytes = await fs.readFile(req.file.path);
                const pdf = await PDFDocument.load(pdfBytes);
                const pages = pdf.getPages();
                if (!pages.length) return res.status(400).json({ error: 'PDF has no pages' });

                const pageIndex = Math.max(0, Math.min(pages.length - 1, Number(page) - 1 || 0));
                const targetPage = pages[pageIndex];

                const textValue = String(text || '').trim();
                if (textValue) {
                    targetPage.drawText(textValue, {
                        x: Number(x) || 48,
                        y: Number(y) || 760,
                        size: Math.max(8, Math.min(96, Number(size) || 18))
                    });
                }

                if (String(drawRect) === 'true') {
                    targetPage.drawRectangle({
                        x: Number(rectX) || 48,
                        y: Number(rectY) || 700,
                        width: Math.max(10, Number(rectWidth) || 220),
                        height: Math.max(10, Number(rectHeight) || 80)
                    });
                }

                const editedBytes = await pdf.save({ useObjectStreams: true });
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=edited.pdf');
                res.send(Buffer.from(editedBytes));
            } catch (error) {
                console.error('PDF edit error:', error);
                res.status(500).json({ error: 'Failed to edit PDF' });
            } finally {
                await cleanupUploadedFiles(req);
            }
        });
    } catch (error) {
        console.error('PDF edit outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PDF to PDF/A (compat rewrite)
router.post('/pdfa', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('PDF/A upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'PDF file is required' });
            }

            try {
                const pdfBytes = await fs.readFile(req.file.path);
                const pdf = await PDFDocument.load(pdfBytes);
                pdf.setProducer('AnyFileForge PDFA Compatibility Rewriter');
                pdf.setCreator('AnyFileForge');
                const out = await pdf.save({ useObjectStreams: true });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=pdfa_compatible.pdf');
                res.send(Buffer.from(out));
            } catch (error) {
                console.error('PDF/A conversion error:', error);
                res.status(500).json({ error: 'Failed to convert PDF' });
            } finally {
                await cleanupUploadedFiles(req);
            }
        });
    } catch (error) {
        console.error('PDF/A outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Protect PDF (password encryption using qpdf WASM)
router.post('/protect', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('PDF protect upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'PDF file is required' });
            }

            const password = String(req.body?.password || '');
            if (!password.trim()) {
                return res.status(400).json({ error: 'Password is required' });
            }

            try {
                const pdfBytes = await fs.readFile(req.file.path);
                const QPDF = await getQpdfFactory();
                const stderr = [];
                const qpdf = await QPDF({
                    noInitialRun: true,
                    print: () => { },
                    printErr: (line) => stderr.push(String(line))
                });

                qpdf.FS.writeFile('in.pdf', new Uint8Array(pdfBytes));
                qpdf.callMain([
                    '--encrypt',
                    password,
                    password,
                    '256',
                    '--',
                    'in.pdf',
                    'out.pdf'
                ]);

                const out = qpdf.FS.readFile('out.pdf');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=protected.pdf');
                res.send(Buffer.from(out));
            } catch (error) {
                console.error('PDF protect error:', error);
                res.status(500).json({ error: 'Failed to protect PDF with password' });
            } finally {
                await cleanupUploadedFiles(req);
            }
        });
    } catch (error) {
        console.error('PDF protect outer error:', error);
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
