import express from 'express';
import sharp from 'sharp';
import fs from 'fs/promises';

const router = express.Router();

const ALLOWED_OUTPUT_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp', 'gif']);

// Resize image
router.post('/resize', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('Image resize upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            const { width, height, format = 'jpeg' } = req.body;

            if (!ALLOWED_OUTPUT_FORMATS.has(format)) {
                await fs.unlink(req.file.path).catch(() => {});
                return res.status(400).json({ error: 'Invalid output format' });
            }

            const w = width ? parseInt(width) : null;
            const h = height ? parseInt(height) : null;

            if ((w !== null && (isNaN(w) || w <= 0 || w > 10000)) ||
                (h !== null && (isNaN(h) || h <= 0 || h > 10000))) {
                await fs.unlink(req.file.path);
                return res.status(400).json({ error: 'Invalid dimensions. Width and height must be between 1 and 10000.' });
            }

            try {
                const image = sharp(req.file.path);

                if (w || h) {
                    image.resize(w, h, {
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                }

                const buffer = await image.toFormat(format).toBuffer();

                res.setHeader('Content-Type', `image/${format}`);
                res.setHeader('Content-Disposition', `attachment; filename=resized.${format}`);
                res.send(buffer);
            } catch (error) {
                console.error('Image resize error:', error);
                res.status(500).json({ error: 'Failed to resize image' });
            } finally {
                await fs.unlink(req.file.path).catch(err => {
                    if (err.code !== 'ENOENT') console.error('Failed to unlink file:', err.message);
                });
            }
        });
    } catch (error) {
        console.error('Image resize outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Compress image
router.post('/compress', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('Image compress upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            const { quality = 80, format = 'jpeg' } = req.body;

            if (!ALLOWED_OUTPUT_FORMATS.has(format)) {
                await fs.unlink(req.file.path).catch(() => {});
                return res.status(400).json({ error: 'Invalid output format' });
            }

            const q = parseInt(quality);

            if (isNaN(q) || q < 1 || q > 100) {
                await fs.unlink(req.file.path);
                return res.status(400).json({ error: 'Invalid quality. Must be between 1 and 100.' });
            }

            try {
                const buffer = await sharp(req.file.path)
                    .toFormat(format, { quality: q })
                    .toBuffer();

                res.setHeader('Content-Type', `image/${format}`);
                res.setHeader('Content-Disposition', `attachment; filename=compressed.${format}`);
                res.send(buffer);
            } catch (error) {
                console.error('Image compress error:', error);
                res.status(500).json({ error: 'Failed to compress image' });
            } finally {
                await fs.unlink(req.file.path).catch(err => {
                    if (err.code !== 'ENOENT') console.error('Failed to unlink file:', err.message);
                });
            }
        });
    } catch (error) {
        console.error('Image compress outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Convert image format
router.post('/convert', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('Image convert upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            const { format = 'png' } = req.body;

            if (!ALLOWED_OUTPUT_FORMATS.has(format)) {
                await fs.unlink(req.file.path).catch(() => {});
                return res.status(400).json({ error: 'Invalid output format' });
            }

            try {
                const buffer = await sharp(req.file.path)
                    .toFormat(format)
                    .toBuffer();

                res.setHeader('Content-Type', `image/${format}`);
                res.setHeader('Content-Disposition', `attachment; filename=converted.${format}`);
                res.send(buffer);
            } catch (error) {
                console.error('Image convert error:', error);
                res.status(500).json({ error: 'Failed to convert image' });
            } finally {
                await fs.unlink(req.file.path).catch(err => {
                    if (err.code !== 'ENOENT') console.error('Failed to unlink file:', err.message);
                });
            }
        });
    } catch (error) {
        console.error('Image convert outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Crop image
router.post('/crop', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('Image crop upload error:', err);
                return res.status(400).json({ error: 'File upload failed' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            const { left, top, width, height, format = 'jpeg' } = req.body;

            if (!ALLOWED_OUTPUT_FORMATS.has(format)) {
                await fs.unlink(req.file.path).catch(() => {});
                return res.status(400).json({ error: 'Invalid output format' });
            }

            const l = parseInt(left);
            const t = parseInt(top);
            const w = parseInt(width);
            const h = parseInt(height);

            if (isNaN(l) || isNaN(t) || isNaN(w) || isNaN(h) || l < 0 || t < 0 || w <= 0 || h <= 0 || w > 10000 || h > 10000) {
                await fs.unlink(req.file.path);
                return res.status(400).json({ error: 'Invalid crop parameters.' });
            }

            try {
                const buffer = await sharp(req.file.path)
                    .extract({
                        left: l,
                        top: t,
                        width: w,
                        height: h
                    })
                    .toFormat(format)
                    .toBuffer();

                res.setHeader('Content-Type', `image/${format}`);
                res.setHeader('Content-Disposition', `attachment; filename=cropped.${format}`);
                res.send(buffer);
            } catch (error) {
                console.error('Image crop error:', error);
                res.status(500).json({ error: 'Failed to crop image' });
            } finally {
                await fs.unlink(req.file.path).catch(err => {
                    if (err.code !== 'ENOENT') console.error('Failed to unlink file:', err.message);
                });
            }
        });
    } catch (error) {
        console.error('Image crop outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
