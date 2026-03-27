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
    return async () => ({ ok, status, text: async () => text });
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

    beforeEach(() => { originalFetch = globalThis.fetch; });
    afterEach(() => { globalThis.fetch = originalFetch; });

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
    // Behaviour changes introduced by this PR: SSRF protection was removed.
    // The endpoint now accepts requests targeting internal/localhost addresses.
    // -----------------------------------------------------------------------
    it('no longer blocks requests to localhost (SSRF protection removed)', async () => {
        // Before this PR the endpoint returned 403 for internal addresses.
        // After this PR it proceeds to fetch; we mock fetch to simulate success.
        globalThis.fetch = makeFetchMock({ text: '<html><head><title>Local</title></head></html>' });

        const res = await mockRequest('POST', '/api/image/html-to-image', {
            url: 'http://localhost:9999/api/health',
            format: 'svg'
        });

        assert.notEqual(res.status, 403, 'SSRF protection removed — 403 must not be returned');
        assert.equal(res.status, 200);
    });

    it('no longer blocks requests to 127.x.x.x addresses', async () => {
        globalThis.fetch = makeFetchMock();

        const res = await mockRequest('POST', '/api/image/html-to-image', {
            url: 'http://127.0.0.2/secret',
            format: 'svg'
        });

        assert.notEqual(res.status, 403);
        assert.equal(res.status, 200);
    });

    it('does not inject a Host header (DNS rebinding mitigation removed)', async () => {
        let capturedHeaders;
        globalThis.fetch = async (_url, opts) => {
            capturedHeaders = opts?.headers ?? {};
            return { ok: true, status: 200, text: async () => MOCK_HTML };
        };

        await mockRequest('POST', '/api/image/html-to-image', { url: 'http://example.com/page', format: 'svg' });

        assert.ok(!capturedHeaders['Host'], 'Host header should not be set after PR change');
        assert.equal(capturedHeaders['User-Agent'], 'AnyFileForge-Server/1.0 (+html-to-image)');
    });

    it('fetches the original URL string directly, not a resolved-IP URL', async () => {
        let capturedUrl;
        globalThis.fetch = async (url, _opts) => {
            capturedUrl = url;
            return { ok: true, status: 200, text: async () => MOCK_HTML };
        };

        await mockRequest('POST', '/api/image/html-to-image', {
            url: 'http://example.com/some/path?q=1',
            format: 'svg'
        });

        // Before the PR, capturedUrl would be an IP-based URL.
        // After the PR, it should contain the original hostname.
        assert.ok(capturedUrl.includes('example.com'), 'Should fetch using the original hostname, not a raw IP');
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
});