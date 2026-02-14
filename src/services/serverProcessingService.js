const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const buildUrl = (path) => `${SERVER_URL}${path}`;

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

const serverProcessingService = {
    baseUrl: SERVER_URL,

    async health() {
        const response = await fetch(buildUrl('/api/health'));
        if (!response.ok) throw new Error('Server health check failed.');
        return response.json();
    },

    async keepAlive() {
        const url = buildUrl(`/api/health?ts=${Date.now()}`);
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store'
        });
        if (!response.ok) throw new Error('Server keep-alive failed.');
        return response.json();
    },

    async mergePDFs(files = []) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return requestBinary('/api/pdf/merge', formData);
    },

    async compressPDF(file) {
        const formData = new FormData();
        formData.append('file', file);
        return requestBinary('/api/pdf/compress', formData);
    },

    async splitPDF(file, pages) {
        const formData = new FormData();
        formData.append('file', file);
        if (pages) formData.append('pages', pages);
        return requestBinary('/api/pdf/split', formData);
    },

    async convertImage(file, { format = 'png' } = {}) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);
        return requestBinary('/api/image/convert', formData);
    },

    async compressImage(file, { quality = 80, format = 'jpeg' } = {}) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('quality', String(quality));
        formData.append('format', format);
        return requestBinary('/api/image/compress', formData);
    },

    async resizeImage(file, { width, height, format = 'jpeg' } = {}) {
        const formData = new FormData();
        formData.append('file', file);
        if (width) formData.append('width', String(width));
        if (height) formData.append('height', String(height));
        formData.append('format', format);
        return requestBinary('/api/image/resize', formData);
    },

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
