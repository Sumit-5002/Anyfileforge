import express from 'express';
import fs from 'fs/promises';

const router = express.Router();

// CSV to JSON converter
router.post('/csv-to-json', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'CSV file is required' });
            }

            try {
                const csvContent = await fs.readFile(req.file.path, 'utf-8');
                const lines = csvContent.split('\n').filter(line => line.trim());

                if (lines.length === 0) {
                    return res.status(400).json({ error: 'Empty CSV file' });
                }

                const headers = lines[0].split(',').map(h => h.trim());
                const data = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || '';
                    });
                    data.push(obj);
                }

                res.json({
                    success: true,
                    data,
                    rowCount: data.length,
                    columnCount: headers.length
                });
            } catch (error) {
                console.error('CSV to JSON error:', error);
                res.status(500).json({ error: 'Failed to convert CSV' });
            } finally {
                await fs.unlink(req.file.path).catch(err => {
                    if (err.code !== 'ENOENT') console.error('Failed to unlink file:', err.message);
                });
            }
        });
    } catch (error) {
        console.error('CSV to JSON outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CSV Plotter - Generate chart data
router.post('/csv-plot', async (req, res) => {
    try {
        const upload = req.app.get('upload');

        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'CSV file is required' });
            }

            const { xColumn, yColumn, chartType = 'line' } = req.body;

            const ALLOWED_CHART_TYPES = new Set(['line', 'bar', 'pie', 'scatter']);
            if (typeof xColumn !== 'string' || typeof yColumn !== 'string' || xColumn.length > 100 || yColumn.length > 100 || !ALLOWED_CHART_TYPES.has(chartType)) {
                await fs.unlink(req.file.path).catch(() => {});
                return res.status(400).json({ error: 'Invalid column names or chart type' });
            }

            try {
                const csvContent = await fs.readFile(req.file.path, 'utf-8');
                const lines = csvContent.split('\n').filter(line => line.trim());

                const headers = lines[0].split(',').map(h => h.trim());
                const xIndex = headers.indexOf(xColumn);
                const yIndex = headers.indexOf(yColumn);

                if (xIndex === -1 || yIndex === -1) {
                    return res.status(400).json({ error: 'Invalid column names' });
                }

                const chartData = {
                    labels: [],
                    datasets: [{
                        label: yColumn,
                        data: []
                    }]
                };

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    chartData.labels.push(values[xIndex]);
                    chartData.datasets[0].data.push(parseFloat(values[yIndex]) || 0);
                }

                res.json({
                    success: true,
                    chartData,
                    chartType,
                    headers
                });
            } catch (error) {
                console.error('CSV plot error:', error);
                res.status(500).json({ error: 'Failed to generate plot data' });
            } finally {
                await fs.unlink(req.file.path).catch(err => {
                    if (err.code !== 'ENOENT') console.error('Failed to unlink file:', err.message);
                });
            }
        });
    } catch (error) {
        console.error('CSV plot outer error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// BibTeX Parser (basic)
router.post('/bibtex-parse', (req, res) => {
    try {
        const { bibtex } = req.body;

        if (typeof bibtex !== 'string' || !bibtex) {
            return res.status(400).json({ error: 'BibTeX content is required and must be a string' });
        }

        if (bibtex.length > 100000) {
            return res.status(400).json({ error: 'BibTeX content too large' });
        }

        // Basic BibTeX parsing
        const entries = [];
        const entryRegex = /@(\w+)\{([^,]+),\s*([\s\S]*?)\n\}/g;
        let match;

        while ((match = entryRegex.exec(bibtex)) !== null) {
            const [, type, key, fields] = match;
            const entry = { type, key, fields: {} };

            const fieldRegex = /(\w+)\s*=\s*\{([^}]+)\}/g;
            let fieldMatch;

            while ((fieldMatch = fieldRegex.exec(fields)) !== null) {
                const [, fieldName, fieldValue] = fieldMatch;
                entry.fields[fieldName] = fieldValue.trim();
            }

            entries.push(entry);
        }

        res.json({
            success: true,
            entries,
            count: entries.length
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'BibTeX parsing failed'
        });
    }
});

// Statistical Analysis
router.post('/stats', (req, res) => {
    try {
        const { data } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ error: 'Data array is required' });
        }

        if (data.length > 10000) {
            return res.status(400).json({ error: 'Data array too large (max 10000 items)' });
        }

        const numbers = data.map(Number).filter(n => !isNaN(n));

        if (numbers.length === 0) {
            return res.status(400).json({ error: 'No valid numbers in data' });
        }

        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / numbers.length;

        const sorted = [...numbers].sort((a, b) => a - b);
        const median = numbers.length % 2 === 0
            ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
            : sorted[Math.floor(numbers.length / 2)];

        const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
        const stdDev = Math.sqrt(variance);

        res.json({
            success: true,
            statistics: {
                count: numbers.length,
                sum,
                mean,
                median,
                min: Math.min(...numbers),
                max: Math.max(...numbers),
                variance,
                standardDeviation: stdDev
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Statistical analysis failed'
        });
    }
});

export default router;
