import express from 'express';
import { createHash } from 'crypto';
import vm from 'vm';

const router = express.Router();

const ALLOWED_MINIFY_TYPES = new Set(['json', 'css', 'js']);
const ALLOWED_HASH_ALGORITHMS = new Set(['sha256', 'sha512', 'sha1', 'md5']);
const WEAK_HASH_ALGORITHMS = new Set(['sha1', 'md5']);

// JSON Formatter & Validator
router.post('/json-format', (req, res) => {
    try {
        const { input, action } = req.body;

        if (typeof input !== 'string' || !input) {
            return res.status(400).json({ error: 'Input JSON is required and must be a string' });
        }

        if (input.length > 5000000) { // 5MB limit for JSON string
            return res.status(400).json({ error: 'Input JSON too large' });
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
        console.error('JSON format error:', error.message);
        res.status(400).json({
            success: false,
            error: 'Invalid JSON'
        });
    }
});

// Base64 Encoder/Decoder
router.post('/base64', (req, res) => {
    try {
        const { input, action } = req.body;

        if (typeof input !== 'string' || !input) {
            return res.status(400).json({ error: 'Input is required and must be a string' });
        }

        if (input.length > 5000000) {
            return res.status(400).json({ error: 'Input too large' });
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
        console.error('Base64 error:', error.message);
        res.status(400).json({
            success: false,
            error: 'Base64 operation failed'
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
            const results = [];
            let match;
            if (regex.global) {
                while ((match = regex.exec(testString)) !== null) {
                    results.push({ match: match[0], index: match.index });
                    if (regex.lastIndex === match.index) regex.lastIndex++;
                }
            } else {
                match = regex.exec(testString);
                if (match) results.push({ match: match[0], index: match.index });
            }
            result = {
                matches: results,
                test: results.length > 0,
                matchCount: results.length
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
        console.error('Regex test error:', error.message);
        res.status(isTimeout ? 408 : 400).json({
            success: false,
            error: isTimeout ? 'Regex operation timed out' : 'Invalid regex pattern'
        });
    }
});

// Code Minifier (basic)
router.post('/minify', (req, res) => {
    try {
        const { code, type } = req.body;

        // Input validation: ensure types and length are safe
        if (typeof code !== 'string' || !code) {
            return res.status(400).json({ error: 'Code is required and must be a string' });
        }

        if (code.length > 1000000) { // 1MB limit to prevent DoS
            return res.status(400).json({ error: 'Code too large (max 1MB)' });
        }

        if (typeof type !== 'string') {
            return res.status(400).json({ error: 'Type must be a string' });
        }

        // Type whitelist
        if (!ALLOWED_MINIFY_TYPES.has(type)) {
            return res.status(400).json({ error: 'Invalid type. Use "json", "css", or "js"' });
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
        }

        res.json({
            success: true,
            output: minified,
            originalSize: code.length,
            minifiedSize: minified.length,
            reduction: ((1 - minified.length / code.length) * 100).toFixed(2) + '%'
        });
    } catch (error) {
        // Log error internally and return generic message
        console.error('Minify error:', error.message);
        res.status(400).json({
            success: false,
            error: 'Minification failed'
        });
    }
});

// Hash Generator
router.post('/hash', (req, res) => {
    try {
        const { input, algorithm = 'sha256', allowWeakAlgos = false } = req.body;

        // Input validation: ensure types and length are safe
        if (typeof input !== 'string' || !input) {
            return res.status(400).json({ error: 'Input is required and must be a string' });
        }

        if (input.length > 1000000) { // 1MB limit to prevent DoS
            return res.status(400).json({ error: 'Input too large (max 1MB)' });
        }

        if (typeof algorithm !== 'string') {
            return res.status(400).json({ error: 'Algorithm must be a string' });
        }

        // Algorithm whitelist: restrict to known supported types
        const selectedAlgo = algorithm.toLowerCase();

        if (!ALLOWED_HASH_ALGORITHMS.has(selectedAlgo)) {
            return res.status(400).json({ error: 'Unsupported algorithm' });
        }

        // MD5 and SHA1 are cryptographically broken and unsafe for security-sensitive uses.
        // We require an explicit opt-in to use them for non-security purposes.
        if (WEAK_HASH_ALGORITHMS.has(selectedAlgo) && allowWeakAlgos !== true) {
            return res.status(400).json({
                error: 'Weak algorithm',
                message: 'MD5 and SHA1 are cryptographically broken and unsafe for security-sensitive uses. Use a stronger algorithm like SHA256, or set allowWeakAlgos: true for non-security checksums.'
            });
        }

        const hash = createHash(selectedAlgo).update(input).digest('hex');

        res.json({
            success: true,
            hash,
            algorithm: selectedAlgo
        });
    } catch (error) {
        // Log the error internally but return a generic message to the client
        console.error('Hash error:', error.message);
        res.status(400).json({
            success: false,
            error: 'Hash generation failed'
        });
    }
});

export default router;
