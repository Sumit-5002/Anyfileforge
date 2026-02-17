import express from 'express';
import sharp from 'sharp';
import fs from 'fs/promises';

const router = express.Router();

// Resize image
router.post('/resize', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            const { width, height, format = 'jpeg' } = req.body;

            const w = width ? parseInt(width) : null;
            const h = height ? parseInt(height) : null;

            if ((w !== null && (isNaN(w) || w <= 0 || w > 10000)) ||
                (h !== null && (isNaN(h) || h <= 0 || h > 10000))) {
                await fs.unlink(req.file.path);
                return res.status(400).json({ error: 'Invalid dimensions. Width and height must be between 1 and 10000.' });
            }

            const image = sharp(req.file.path);

            if (w || h) {
                image.resize(w, h, {
                    fit: 'inside',
                    withoutEnlargement: false
                });
            }

            const buffer = await image.toFormat(format).toBuffer();

            await fs.unlink(req.file.path);

            res.setHeader('Content-Type', `image/${format}`);
            res.setHeader('Content-Disposition', `attachment; filename=resized.${format}`);
            res.send(buffer);
        });
    } catch (error) {
        console.error('Image resize error:', error);
        res.status(500).json({ error: 'Failed to resize image', message: error.message });
    }
});

// Compress image
router.post('/compress', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            const { quality = 80, format = 'jpeg' } = req.body;
            const q = parseInt(quality);

            if (isNaN(q) || q < 1 || q > 100) {
                await fs.unlink(req.file.path);
                return res.status(400).json({ error: 'Invalid quality. Must be between 1 and 100.' });
            }

            const buffer = await sharp(req.file.path)
                .toFormat(format, { quality: q })
                .toBuffer();

            await fs.unlink(req.file.path);

            res.setHeader('Content-Type', `image/${format}`);
            res.setHeader('Content-Disposition', `attachment; filename=compressed.${format}`);
            res.send(buffer);
        });
    } catch (error) {
        console.error('Image compress error:', error);
        res.status(500).json({ error: 'Failed to compress image', message: error.message });
    }
});

// Convert image format
router.post('/convert', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            const { format = 'png' } = req.body;

            const buffer = await sharp(req.file.path)
                .toFormat(format)
                .toBuffer();

            await fs.unlink(req.file.path);

            res.setHeader('Content-Type', `image/${format}`);
            res.setHeader('Content-Disposition', `attachment; filename=converted.${format}`);
            res.send(buffer);
        });
    } catch (error) {
        console.error('Image convert error:', error);
        res.status(500).json({ error: 'Failed to convert image', message: error.message });
    }
});

// Crop image
router.post('/crop', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Image file is required' });
            }

            const { left, top, width, height, format = 'jpeg' } = req.body;

            const l = parseInt(left);
            const t = parseInt(top);
            const w = parseInt(width);
            const h = parseInt(height);

            if (isNaN(l) || isNaN(t) || isNaN(w) || isNaN(h) || l < 0 || t < 0 || w <= 0 || h <= 0 || w > 10000 || h > 10000) {
                await fs.unlink(req.file.path);
                return res.status(400).json({ error: 'Invalid crop parameters.' });
            }

            const buffer = await sharp(req.file.path)
                .extract({
                    left: l,
                    top: t,
                    width: w,
                    height: h
                })
                .toFormat(format)
                .toBuffer();

            await fs.unlink(req.file.path);

            res.setHeader('Content-Type', `image/${format}`);
            res.setHeader('Content-Disposition', `attachment; filename=cropped.${format}`);
            res.send(buffer);
        });
    } catch (error) {
        console.error('Image crop error:', error);
        res.status(500).json({ error: 'Failed to crop image', message: error.message });
    }
});

export default router;
