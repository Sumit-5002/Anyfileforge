const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const buildUrl = (path) => `${SERVER_URL}${path}`;

/**
 * Internal helper to send multipart/form-data requests and receive a binary Blob response.
 */
const requestBinary = async (path, formData) => {
    const response = await fetch(buildUrl(path), {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const payload = await response.json();
            if (payload?.message || payload?.error) {
                message = payload.message || payload.error;
            }
        } catch {
            // Ignore JSON parse errors and keep default message.
        }
        throw new Error(message);
    }

    return response.blob();
};

/**
 * Service to handle file processing operations on the remote server.
 */
const serverProcessingService = {
    baseUrl: SERVER_URL,

    /**
     * Checks server health.
     */
    async health() {
        const response = await fetch(buildUrl('/api/health'));
        if (!response.ok) throw new Error('Server health check failed.');
        return response.json();
    },

    /**
     * Sends a keep-alive request to the server.
     */
    async keepAlive() {
        const url = buildUrl(`/api/health?ts=${Date.now()}`);
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Server keep-alive failed.');
        return response.json();
    },

    /**
     * Merges multiple PDF files.
     * @param {File[]} files - Array of PDF files to merge.
     */
    async mergePDFs(files = []) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return requestBinary('/api/pdf/merge', formData);
    },

    /**
     * Compresses a PDF file.
     * @param {File} file - PDF file to compress.
     */
    async compressPDF(file) {
        const formData = new FormData();
        formData.append('file', file);
        return requestBinary('/api/pdf/compress', formData);
    },

    /**
     * Splits a PDF file into specific pages.
     * @param {File} file - PDF file to split.
     * @param {string} pages - Page range string (e.g., "1-3, 5").
     */
    async splitPDF(file, pages) {
        const formData = new FormData();
        formData.append('file', file);
        if (pages) formData.append('pages', pages);
        return requestBinary('/api/pdf/split', formData);
    },

    /**
     * Converts an image to a different format.
     * @param {File} file - Image file to convert.
     * @param {Object} options - Conversion options { format, quality }.
     */
    async convertImage(file, { format = 'png', quality } = {}) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);
        if (quality) formData.append('quality', String(quality));
        return requestBinary('/api/image/convert', formData);
    },

    /**
     * Compresses an image.
     * @param {File} file - Image file to compress.
     * @param {Object} options - Compression options { quality, format }.
     */
    async compressImage(file, { quality = 80, format = 'jpeg' } = {}) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('quality', String(quality));
        formData.append('format', format);
        return requestBinary('/api/image/compress', formData);
    },

    /**
     * Resizes an image.
     * @param {File} file - Image file to resize.
     * @param {Object} options - Resize options { width, height, format }.
     */
    async resizeImage(file, { width, height, format = 'jpeg' } = {}) {
        const formData = new FormData();
        formData.append('file', file);
        if (width) formData.append('width', String(width));
        if (height) formData.append('height', String(height));
        formData.append('format', format);
        return requestBinary('/api/image/resize', formData);
    },

    /**
     * Crops an image.
     * @param {File} file - Image file to crop.
     * @param {Object} options - Crop options { x, y, width, height, format }.
     */
    async cropImage(file, { x, y, width, height, format = 'jpeg' } = {}) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('left', String(x ?? 0));
        formData.append('top', String(y ?? 0));
        formData.append('width', String(width));
        formData.append('height', String(height));
        formData.append('format', format);
        return requestBinary('/api/image/crop', formData);
    }
};

export default serverProcessingService;
