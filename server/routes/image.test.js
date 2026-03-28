/**
 * Tests for server/routes/image.js
 *
 * Focused on the /html-to-image endpoint, which was modified in this PR to:
 *  - Remove the isInternalIP() SSRF protection function
 *  - Remove DNS resolution / DNS-rebinding protection
 *  - Fetch the URL directly using parsed.toString()
 *
 * Uses in-process request/response mocking (no TCP) because the sandbox
 * blocks loopback connections.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { IncomingMessage, ServerResponse } from 'node:http';
import { PassThrough, Readable } from 'node:stream';
import dns from 'dns';

// ---------------------------------------------------------------------------
// Build the app once at module level
// ---------------------------------------------------------------------------
const { default: imageRouter } = await import('./image.js');
const app = express();
app.use(express.json());
app.use('/api/image', imageRouter);

// ---------------------------------------------------------------------------
// In-process HTTP helper
// Invokes app.handle() with mock stream objects — no TCP required.
// ---------------------------------------------------------------------------
async function mockRequest(method, path, body = null) {
    const bodyStr = body !== null ? JSON.stringify(body) : '';
    const bodyBuf = Buffer.from(bodyStr, 'utf8');

    const req = Object.assign(
        new Readable({
            read() {
                if (bodyStr) this.push(bodyBuf);
                this.push(null);
            }
        }),
        {
            method: method.toUpperCase(),
            url: path,
            headers: {
                'content-type': 'application/json',
                'content-length': String(bodyBuf.length)
            }
        }
    );

    const chunks = [];
    const socket = new PassThrough();
    socket.on('data', chunk => chunks.push(chunk));

    const res = new ServerResponse(req);
    res.assignSocket(socket);

    await new Promise((resolve, reject) => {
        res.on('finish', resolve);
        res.on('error', reject);
        app.handle(req, res);
    });

    const rawResponse = Buffer.concat(chunks).toString('utf8');
    // HTTP response format: headers\r\n\r\nbody
    const headerBodySplit = rawResponse.indexOf('\r\n\r\n');
    const headerSection = rawResponse.slice(0, headerBodySplit);
    const rawBody = rawResponse.slice(headerBodySplit + 4);

    // Parse headers into a plain object (lower-cased)
    const headerLines = headerSection.split('\r\n').slice(1); // skip status line
    const headers = {};
    for (const line of headerLines) {
        const idx = line.indexOf(':');
        if (idx > -1) {
            headers[line.slice(0, idx).toLowerCase().trim()] = line.slice(idx + 1).trim();
        }
    }

    let parsedBody;
    try {
        parsedBody = JSON.parse(rawBody);
    } catch {
        parsedBody = null;
    }

    return {
        status: res.statusCode,
        headers,
        text: rawBody,
        body: parsedBody
    };
}

// ---------------------------------------------------------------------------
// Minimal HTML document returned by the mock fetch
// ---------------------------------------------------------------------------
const MOCK_HTML = '<html><head><title>Test Page</title></head><body><p>Hello world</p></body></html>';

function makeFetchMock({ ok = true, status = 200, text = MOCK_HTML } = {}) {
    return async () => ({
        ok,
        status,
        headers: new Map(),
        text: async () => text
    });
}

// ---------------------------------------------------------------------------
// /html-to-image — URL validation tests (no fetch required)
// ---------------------------------------------------------------------------

describe('/api/image/html-to-image – URL validation', () => {
    it('returns 400 when url is missing from body', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image', { format: 'svg' });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /valid url is required/i);
    });

    it('returns 400 when url is not a string (number)', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 12345 });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /valid url is required/i);
    });

    it('returns 400 when url is not a string (null)', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image', { url: null });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /valid url is required/i);
    });

    it('returns 400 for body-less request', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image');
        assert.equal(res.status, 400);
        assert.match(res.body.error, /valid url is required/i);
    });

    it('returns 400 when url is an unparseable string', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'not a url at all :::' });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /invalid url format/i);
    });

    it('returns 400 when protocol is file://', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'file:///etc/passwd' });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /only http\/https/i);
    });

    it('returns 400 when protocol is ftp://', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'ftp://example.com/resource' });
        assert.equal(res.status, 400);
        assert.match(res.body.error, /only http\/https/i);
    });

    it('returns 400 for javascript: pseudo-protocol', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'javascript:alert(1)' });
        assert.equal(res.status, 400);
    });
});

// ---------------------------------------------------------------------------
// /html-to-image — fetch behaviour tests (fetch is mocked)
// ---------------------------------------------------------------------------

describe('/api/image/html-to-image – fetch behaviour', () => {
    let originalFetch;
    let originalDnsLookup;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        originalDnsLookup = dns.promises.lookup;

        // Default DNS mock: resolve everything to a "safe" public IP
        dns.promises.lookup = async (hostname) => {
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '127.0.0.2') {
                return { address: '127.0.0.1' };
            }
            return { address: '93.184.216.34' }; // example.com
        };
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        dns.promises.lookup = originalDnsLookup;
    });

    it('returns 502 when the remote server responds with a non-OK status', async () => {
        globalThis.fetch = makeFetchMock({ ok: false, status: 404 });

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com/not-found' });

        assert.equal(res.status, 502);
        assert.match(res.body.error, /unable to fetch url/i);
        assert.match(res.body.error, /404/);
    });

    it('returns 500 when fetch throws a network error', async () => {
        globalThis.fetch = async () => { throw new Error('Network failure'); };

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com' });

        assert.equal(res.status, 500);
        assert.match(res.body.error, /failed to convert/i);
    });

    it('returns SVG content-type when format is "svg"', async () => {
        globalThis.fetch = makeFetchMock();

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com', format: 'svg' });

        assert.equal(res.status, 200);
        assert.match(res.headers['content-type'], /image\/svg\+xml/);
        assert.match(res.headers['content-disposition'], /webpage_capture\.svg/);
        assert.ok(res.text.includes('<svg'), 'Response body should contain <svg');
    });

    it('SVG output contains the page title extracted from HTML', async () => {
        globalThis.fetch = makeFetchMock({ text: '<html><head><title>My Cool Page</title></head><body>content</body></html>' });

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com', format: 'svg' });

        assert.equal(res.status, 200);
        assert.ok(res.text.includes('My Cool Page'), 'SVG should include page title');
    });

    it('uses hostname as title when <title> element is absent', async () => {
        globalThis.fetch = makeFetchMock({ text: '<html><body>No title here</body></html>' });

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://notitle.example.com', format: 'svg' });

        assert.equal(res.status, 200);
        assert.ok(res.text.includes('notitle.example.com'), 'SVG should fall back to hostname');
    });

    it('SVG escapes XML special characters in title to prevent injection', async () => {
        globalThis.fetch = makeFetchMock({ text: '<html><head><title><script>evil</script></title></head></html>' });

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com', format: 'svg' });

        assert.equal(res.status, 200);
        assert.ok(!res.text.includes('<script>'), 'Raw <script> tag must not appear in SVG output');
        assert.ok(res.text.includes('&lt;script&gt;'), 'Script tag should be XML-escaped');
    });

    it('format defaults to jpeg when format is omitted', async () => {
        globalThis.fetch = makeFetchMock();

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com' });

        assert.equal(res.status, 200);
        assert.match(res.headers['content-type'], /image\/jpeg/);
        assert.match(res.headers['content-disposition'], /webpage_capture\.jpg/);
    });

    it('format defaults to jpeg for an unrecognised format string', async () => {
        globalThis.fetch = makeFetchMock();

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com', format: 'png' });

        assert.equal(res.status, 200);
        assert.match(res.headers['content-type'], /image\/jpeg/);
    });

    // -----------------------------------------------------------------------
    // SSRF protection tests
    // -----------------------------------------------------------------------
    it('blocks requests to localhost (SSRF protection)', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image', {
            url: 'http://localhost:9999/api/health',
            format: 'svg'
        });

        assert.equal(res.status, 403, 'SSRF protection should return 403 for localhost');
        assert.match(res.body.error, /internal network is forbidden/i);
    });

    it('blocks requests to 127.x.x.x addresses', async () => {
        const res = await mockRequest('POST', '/api/image/html-to-image', {
            url: 'http://127.0.0.2/secret',
            format: 'svg'
        });

        assert.equal(res.status, 403, 'SSRF protection should return 403 for 127.0.0.2');
    });

    it('injects a Host header for DNS rebinding mitigation', async () => {
        let capturedHeaders;
        globalThis.fetch = async (_url, opts) => {
            capturedHeaders = opts?.headers ?? {};
            return { ok: true, status: 200, text: async () => MOCK_HTML };
        };

        await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com/page', format: 'svg' });

        assert.equal(capturedHeaders['Host'], 'example.com', 'Host header must be set to original hostname');
    });

    it('fetches using a resolved IP URL to mitigate DNS rebinding', async () => {
        let capturedUrl;
        globalThis.fetch = async (url, _opts) => {
            capturedUrl = url;
            return { ok: true, status: 200, text: async () => MOCK_HTML };
        };

        await mockRequest('POST', '/api/image/html-to-image', {
            url: 'http://example.com/some/path?q=1',
            format: 'svg'
        });

        assert.ok(capturedUrl.includes('93.184.216.34'), 'Should fetch using the resolved IP address');
    });

    it('SVG body text snippet is stripped of HTML tags', async () => {
        globalThis.fetch = makeFetchMock({
            text: '<html><head><title>Test</title></head><body><p>Plain text content</p><script>ignored</script></body></html>'
        });

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com', format: 'svg' });

        assert.equal(res.status, 200);
        // The snippet in the SVG should contain readable text, not raw HTML tags
        assert.ok(res.text.includes('Plain text content'), 'Text snippet should be included in SVG');
    });

    // -----------------------------------------------------------------------
    // New Security & DoS Protection Tests
    // -----------------------------------------------------------------------
    it('blocks redirects to prevent SSRF bypass (manual redirect handling)', async () => {
        globalThis.fetch = async () => ({
            status: 302,
            headers: new Map([['location', 'http://localhost/admin']]),
            type: 'opaqueredirect',
            ok: false
        });

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com/redirect' });

        assert.equal(res.status, 403, 'Should return 403 for redirects');
        assert.match(res.body.error, /redirects are forbidden/i);
    });

    it('enforces a 5-second timeout on fetch', async () => {
        let signal;
        globalThis.fetch = async (_url, opts) => {
            signal = opts.signal;
            // Simulate a timeout error
            const err = new Error('The operation was aborted');
            err.name = 'TimeoutError';
            throw err;
        };

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com' });

        assert.equal(res.status, 500);
        assert.ok(signal, 'AbortSignal should be passed to fetch');
    });

    it('enforces 512KB size limit via content-length header', async () => {
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            headers: new Map([['content-length', '600000']]),
            text: async () => 'some large content'
        });

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com' });

        assert.equal(res.status, 413, 'Should return 413 for oversized content (header check)');
        assert.match(res.body.error, /content too large/i);
    });

    it('enforces 512KB size limit via body content length', async () => {
        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            headers: new Map(),
            text: async () => 'a'.repeat(600000)
        });

        const res = await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com' });

        assert.equal(res.status, 413, 'Should return 413 for oversized content (body check)');
        assert.match(res.body.error, /content too large/i);
    });
});