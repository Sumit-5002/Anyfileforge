import express from 'express';
import sharp from 'sharp';
import fs from 'fs/promises';
import dns from 'dns';

const router = express.Router();

const isInternalIP = (ip) => {
    if (!ip) return false;
    // Normalize IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1)
    const normalizedIP = ip.startsWith('::ffff:') ? ip.slice(7) : ip;

    // Check for loopback (127.0.0.0/8, ::1)
    if (normalizedIP === '::1' || normalizedIP.startsWith('127.')) return true;
    // Check for private ranges
    if (normalizedIP.startsWith('10.') ||
        normalizedIP.startsWith('192.168.') ||
        normalizedIP.startsWith('169.254.') ||
        (normalizedIP.startsWith('172.') && (() => {
            const second = parseInt(normalizedIP.split('.')[1], 10);
            return second >= 16 && second <= 31;
        })())) return true;
    // Check for IPv6 unique local/link-local addresses
    if (normalizedIP.startsWith('fe80:') || normalizedIP.startsWith('fc00:') || normalizedIP.startsWith('fd00:') || normalizedIP === '::' || normalizedIP === '0.0.0.0') return true;

    return false;
};

const escapeXml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const toPlainText = (html = '') =>
    String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

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
                res.status(500).json({ error: 'Failed to resize image', message: error.message });
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
                res.status(500).json({ error: 'Failed to compress image', message: error.message });
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

            const { format = 'png', quality } = req.body;
            const q = quality ? parseInt(quality) : null;

            if (q !== null && (isNaN(q) || q < 1 || q > 100)) {
                await fs.unlink(req.file.path);
                return res.status(400).json({ error: 'Invalid quality. Must be between 1 and 100.' });
            }

            try {
                const options = q ? { quality: q } : {};
                const buffer = await sharp(req.file.path)
                    .toFormat(format, options)
                    .toBuffer();

                res.setHeader('Content-Type', `image/${format}`);
                res.setHeader('Content-Disposition', `attachment; filename=converted.${format}`);
                res.send(buffer);
            } catch (error) {
                console.error('Image convert error:', error);
                res.status(500).json({ error: 'Failed to convert image', message: error.message });
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
                res.status(500).json({ error: 'Failed to crop image', message: error.message });
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

// Capture URL to image (lightweight server renderer)
router.post('/html-to-image', async (req, res) => {
    try {
        const { url, format = 'jpeg' } = req.body || {};
        const normalizedFormat = String(format).toLowerCase() === 'svg' ? 'svg' : 'jpeg';

        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'Valid URL is required.' });
        }

        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            return res.status(400).json({ error: 'Invalid URL format.' });
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return res.status(400).json({ error: 'Only http/https URLs are supported.' });
        }

        // SSRF protection: Resolve hostname and check for internal IPs
        let resolvedIP;
        try {
            const { address } = await dns.promises.lookup(parsed.hostname);
            if (isInternalIP(address)) {
                return res.status(403).json({ error: 'Access to internal network is forbidden.' });
            }
            resolvedIP = address;
        } catch (dnsErr) {
            return res.status(400).json({ error: 'Could not resolve hostname.' });
        }

        // Mitigate DNS rebinding: Fetch using the resolved IP and a Host header
        const targetUrl = `${parsed.protocol}//${resolvedIP}${parsed.pathname}${parsed.search}`;
        const response = await fetch(targetUrl, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'AnyFileForge-Server/1.0 (+html-to-image)',
                'Host': parsed.hostname
            }
        });

        if (!response.ok) {
            return res.status(502).json({ error: `Unable to fetch URL (${response.status}).` });
        }

        const html = await response.text();
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : parsed.hostname;
        const snippet = toPlainText(html).slice(0, 380);

        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1366" height="768">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="36" y="36" width="1294" height="696" rx="16" fill="#0b1220" stroke="#334155" />
  <text x="72" y="106" fill="#60a5fa" font-size="24" font-family="Arial, sans-serif">URL Snapshot</text>
  <text x="72" y="152" fill="#f8fafc" font-size="34" font-family="Arial, sans-serif">${escapeXml(title).slice(0, 80)}</text>
  <text x="72" y="198" fill="#94a3b8" font-size="18" font-family="Arial, sans-serif">${escapeXml(parsed.toString()).slice(0, 120)}</text>
  <foreignObject x="72" y="230" width="1222" height="440">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:#cbd5e1;font:16px/1.6 Arial,sans-serif;white-space:normal;">
      ${escapeXml(snippet || 'No readable text found on the target page.')}
    </div>
  </foreignObject>
</svg>`;

        if (normalizedFormat === 'svg') {
            res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=webpage_capture.svg');
            return res.send(Buffer.from(svg, 'utf8'));
        }

        const imageBuffer = await sharp(Buffer.from(svg, 'utf8'))
            .jpeg({ quality: 90 })
            .toBuffer();

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Disposition', 'attachment; filename=webpage_capture.jpg');
        return res.send(imageBuffer);
    } catch (error) {
        console.error('HTML to image error:', error);
        return res.status(500).json({ error: 'Failed to convert webpage to image' });
    }
});

export default router;
