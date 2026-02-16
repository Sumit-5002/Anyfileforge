import express from 'express';
import { createHash } from 'crypto';
import vm from 'vm';

const router = express.Router();

// JSON Formatter & Validator
router.post('/json-format', (req, res) => {
    try {
        const { input, action } = req.body;

        if (!input) {
            return res.status(400).json({ error: 'Input JSON is required' });
        }

        const parsed = JSON.parse(input);

        let output;
        if (action === 'minify') {
            output = JSON.stringify(parsed);
        } else {
            output = JSON.stringify(parsed, null, 2);
        }

        res.json({
            success: true,
            output,
            valid: true
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid JSON',
            message: error.message
        });
    }
});

// Base64 Encoder/Decoder
router.post('/base64', (req, res) => {
    try {
        const { input, action } = req.body;

        if (!input) {
            return res.status(400).json({ error: 'Input is required' });
        }

        let output;
        if (action === 'encode') {
            output = Buffer.from(input).toString('base64');
        } else if (action === 'decode') {
            output = Buffer.from(input, 'base64').toString('utf-8');
        } else {
            return res.status(400).json({ error: 'Invalid action. Use "encode" or "decode"' });
        }

        res.json({ success: true, output });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Base64 operation failed',
            message: error.message
        });
    }
});

// Regex Tester
router.post('/regex-test', (req, res) => {
    try {
        const { pattern, flags, testString } = req.body;

        if (typeof pattern !== 'string' || typeof testString !== 'string') {
            return res.status(400).json({ error: 'Pattern and test string are required and must be strings' });
        }

        if (pattern.length > 1024) {
            return res.status(400).json({ error: 'Pattern is too long (max 1024 characters)' });
        }

        if (testString.length > 10240) {
            return res.status(400).json({ error: 'Test string is too long (max 10240 characters)' });
        }

        if (flags && typeof flags !== 'string') {
            return res.status(400).json({ error: 'Flags must be a string' });
        }

        // Use vm module to run regex with a timeout to prevent ReDoS (Regular Expression Denial of Service)
        // This ensures that even catastrophic backtracking doesn't hang the event loop
        const script = `
            const regex = new RegExp(pattern, flags || '');
            const matches = testString.match(regex);
            result = {
                matches: matches || [],
                test: matches !== null,
                matchCount: matches ? matches.length : 0
            };
        `;

        const context = { pattern, flags, testString, result: null };
        vm.runInNewContext(script, context, { timeout: 2000 }); // 2 second timeout

        if (!context.result) {
            throw new Error('Regex execution failed to produce a result');
        }

        res.json({
            success: true,
            ...context.result
        });
    } catch (error) {
        const isTimeout = error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' ||
            (error.message && error.message.includes('timed out'));
        res.status(isTimeout ? 408 : 400).json({
            success: false,
            error: isTimeout ? 'Regex operation timed out' : 'Invalid regex pattern',
            message: error.message
        });
    }
});

// Code Minifier (basic)
router.post('/minify', (req, res) => {
    try {
        const { code, type } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }

        let minified;

        if (type === 'json') {
            const parsed = JSON.parse(code);
            minified = JSON.stringify(parsed);
        } else if (type === 'css') {
            // Basic CSS minification
            minified = code
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\s+/g, ' ')
                .replace(/\s*{\s*/g, '{')
                .replace(/\s*}\s*/g, '}')
                .replace(/\s*:\s*/g, ':')
                .replace(/\s*;\s*/g, ';')
                .trim();
        } else if (type === 'js') {
            // Basic JS minification (remove comments and extra spaces)
            minified = code
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\/\/.*/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        } else {
            return res.status(400).json({ error: 'Invalid type. Use "json", "css", or "js"' });
        }

        res.json({
            success: true,
            output: minified,
            originalSize: code.length,
            minifiedSize: minified.length,
            reduction: ((1 - minified.length / code.length) * 100).toFixed(2) + '%'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Minification failed',
            message: error.message
        });
    }
});

// Hash Generator
router.post('/hash', (req, res) => {
    try {
        const { input, algorithm = 'sha256' } = req.body;

        if (!input) {
            return res.status(400).json({ error: 'Input is required' });
        }

        const hash = createHash(algorithm).update(input).digest('hex');

        res.json({
            success: true,
            hash,
            algorithm
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Hash generation failed',
            message: error.message
        });
    }
});

export default router;
