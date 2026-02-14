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

            const image = sharp(req.file.path);

            if (width || height) {
                image.resize(parseInt(width) || null, parseInt(height) || null, {
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

            const buffer = await sharp(req.file.path)
                .toFormat(format, { quality: parseInt(quality) })
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

            const buffer = await sharp(req.file.path)
                .extract({
                    left: parseInt(left),
                    top: parseInt(top),
                    width: parseInt(width),
                    height: parseInt(height)
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
