import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
}

const blobFromCanvas = (canvas, type, quality) =>
    new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to encode rendered PDF page.'));
        }, type, quality);
    });

let qpdfModulePromise = null;

const loadQpdf = async () => {
    if (!qpdfModulePromise) {
        qpdfModulePromise = import('qpdf-wasm-esm-embedded').then((m) => m.default || m);
    }
    return qpdfModulePromise;
};

// Best-effort true decrypt using qpdf (WASM). Preserves text/layers.
// Throws on wrong password / unsupported encryption.
const decryptWithQpdf = async (buffer, password) => {
    if (!password || !String(password).trim()) {
        throw new Error('This PDF is password-protected. Enter the password to unlock it.');
    }

    const QPDF = await loadQpdf();

    const stderr = [];
    const qpdf = await QPDF({
        noInitialRun: true,
        print: () => {},
        printErr: (s) => stderr.push(String(s))
    });

    // Fresh FS state per run
    qpdf.FS.writeFile('in.pdf', new Uint8Array(buffer));

    try {
        // qpdf [options] infile outfile
        qpdf.callMain([
            `--password=${String(password)}`,
            '--decrypt',
            'in.pdf',
            'out.pdf'
        ]);
    } catch (e) {
        const errText = stderr.join('\n').toLowerCase();
        if (errText.includes('invalid password') || errText.includes('incorrect password') || errText.includes('password')) {
            throw new Error('Incorrect password. Please provide the correct password to unlock.');
        }
        throw new Error('Unable to decrypt this PDF offline (qpdf could not unlock it).');
    }

    return qpdf.FS.readFile('out.pdf'); // Uint8Array
};

// Offline unlock for encrypted PDFs:
// Use PDF.js to decrypt+render pages, then rebuild as an unencrypted image-based PDF with pdf-lib.
// Tradeoff: output text is not selectable/searchable.
const unlockEncryptedPdfOffline = async (buffer, password) => {
    if (!password || !String(password).trim()) {
        throw new Error('This PDF is password-protected. Enter the password to unlock it.');
    }

    let doc;
    try {
        doc = await pdfjs.getDocument({ data: buffer, password: String(password) }).promise;
    } catch (err) {
        const name = String(err?.name || '');
        const code = String(err?.code || '');
        const msg = String(err?.message || '');

        // PDF.js uses PasswordException with codes NEED_PASSWORD / INCORRECT_PASSWORD.
        if (name === 'PasswordException' || code === 'NEED_PASSWORD' || code === 'INCORRECT_PASSWORD' || /password/i.test(msg)) {
            throw new Error('Incorrect password. Please provide the correct password to unlock.');
        }
        throw new Error('Unable to open this encrypted PDF offline.');
    }

    const out = await PDFDocument.create();
    const maxDimPx = 2200; // cap to reduce memory spikes

    for (let i = 1; i <= doc.numPages; i += 1) {
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.max(0.2, Math.min(2.0, maxDimPx / Math.max(base.width, base.height)));
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport }).promise;

        const blob = await blobFromCanvas(canvas, 'image/jpeg', 0.92);
        const bytes = await blob.arrayBuffer();
        const img = await out.embedJpg(bytes);

        const outPage = out.addPage([canvas.width, canvas.height]);
        outPage.drawImage(img, { x: 0, y: 0, width: canvas.width, height: canvas.height });
    }

    return out.save({ useObjectStreams: true });
};

export const unlockPDF = async (file, password) => {
    const buffer = await file.arrayBuffer();
    try {
        // If we can load it with the password, saving it will produce an unencrypted version
        const pdf = await PDFDocument.load(buffer, password ? { password } : undefined);
        return pdf.save();
    } catch (error) {
        const msg = String(error?.message || '').toLowerCase();

        // pdf-lib cannot decrypt encrypted PDFs. If it's encrypted, try qpdf (true decrypt),
        // and only fall back to rasterize+rebuild if qpdf can't handle it.
        if (msg.includes('encrypted')) {
            try {
                const decrypted = await decryptWithQpdf(buffer, password);
                return decrypted;
            } catch (e) {
                // If qpdf fails for non-password reasons, fallback keeps the tool usable offline.
                const fallbackOk = !String(e?.message || '').toLowerCase().includes('incorrect password');
                if (fallbackOk) return unlockEncryptedPdfOffline(buffer, password);
                throw e;
            }
        }

        if (msg.includes('password') || error?.name === 'PasswordError') {
            throw new Error('Incorrect password. Please provide the correct password to unlock.');
        }
        throw error;
    }
};

export const protectPDF = async (file, _password) => {
    // Note: encryption in save() is not natively supported by pdf-lib.
    // Full encryption is handled in Server Mode. Here we perform a structural rewrite.
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    return pdf.save();
};

export const redactPDF = async (file, rectangles = [], pageIndices = [], password) => {
    const pdf = await PDFDocument.load(await file.arrayBuffer(), password ? { password } : undefined);
    const pages = pdf.getPages();
    const indices = pageIndices.length ? pageIndices : pages.map((_, idx) => idx);
    const rects = (rectangles || []).filter(r => Number.isFinite(r?.x) && Number.isFinite(r?.width));
    if (!rects.length) throw new Error('No redaction rectangles provided.');

    indices.forEach(idx => {
        rects.forEach(r => pages[idx].drawRectangle({
            x: r.x, y: r.y, width: r.width, height: r.height, color: rgb(0, 0, 0)
        }));
    });
    return pdf.save();
};
