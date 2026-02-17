/**
 * Service to handle image manipulations using Canvas API
 */
const imageService = {
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Image loading failed'));
            };
            img.src = url;
        });
    },
    /**
     * Converts an image to a different format
     * @param {File} file - Image file to convert
     * @param {string} targetFormat - Target format (e.g., 'image/jpeg', 'image/png', 'image/webp')
     * @param {number} quality - Quality for lossy formats (0 to 1)
     * @returns {Promise<Blob>} - Converted image Blob
     */
    async convertImage(file, targetFormat = 'image/jpeg', quality = 0.8) {
        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                },
                targetFormat,
                quality
            );
        });
    },

    /**
     * Resizes an image
     * @param {File} file - Image file to resize
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @returns {Promise<Blob>} - Resized image Blob
     */
    async resizeImage(file, maxWidth, maxHeight) {
        const img = await this.loadImage(file);
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
        });
    },

    async resizeImageTo(file, width, height, keepAspect = true, format = 'image/jpeg', quality = 0.9) {
        const img = await this.loadImage(file);
        let targetWidth = Number(width) || img.width;
        let targetHeight = Number(height) || img.height;

        if (keepAspect) {
            const ratio = img.width / img.height;
            if (targetWidth && !targetHeight) {
                targetHeight = Math.round(targetWidth / ratio);
            } else if (!targetWidth && targetHeight) {
                targetWidth = Math.round(targetHeight * ratio);
            } else if (targetWidth && targetHeight) {
                const fitWidth = targetHeight * ratio;
                const fitHeight = targetWidth / ratio;
                if (fitWidth <= targetWidth) targetWidth = Math.round(fitWidth);
                else targetHeight = Math.round(fitHeight);
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), format, quality);
        });
    },

    async rotateImage(file, angle, format = 'image/jpeg', quality = 0.9) {
        const img = await this.loadImage(file);
        const radians = (angle * Math.PI) / 180;
        const swap = angle % 180 !== 0;
        const canvas = document.createElement('canvas');
        canvas.width = swap ? img.height : img.width;
        canvas.height = swap ? img.width : img.height;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), format, quality);
        });
    },

    async cropImage(file, x, y, width, height, format = 'image/jpeg', quality = 0.9) {
        const img = await this.loadImage(file);
        const cropX = Math.max(0, Number(x) || 0);
        const cropY = Math.max(0, Number(y) || 0);
        const cropWidth = Math.min(Number(width) || img.width, img.width - cropX);
        const cropHeight = Math.min(Number(height) || img.height, img.height - cropY);
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), format, quality);
        });
    },

    async watermarkImage(file, text, options = {}) {
        const {
            position = 'bottom-right',
            opacity = 0.35,
            fontSize = 32,
            color = '#ffffff'
        } = options;
        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(text).width;
        const margin = 24;
        let x = margin;
        if (position === 'bottom-center') x = (canvas.width - textWidth) / 2;
        if (position === 'bottom-right') x = canvas.width - textWidth - margin;
        const y = canvas.height - margin;
        ctx.fillText(text, x, y);
        ctx.globalAlpha = 1;
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png', 0.9);
        });
    },

    async memeImage(file, topText, bottomText, options = {}) {
        const { fontSize = 42, color = '#ffffff', strokeColor = '#000000' } = options;
        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(2, Math.round(fontSize / 10));
        const margin = 24;
        if (topText) {
            ctx.strokeText(topText.toUpperCase(), canvas.width / 2, margin + fontSize);
            ctx.fillText(topText.toUpperCase(), canvas.width / 2, margin + fontSize);
        }
        if (bottomText) {
            ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - margin);
            ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - margin);
        }
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png', 0.9);
        });
    },

    async upscaleImage(file, scale = 2, format = 'image/png', quality = 0.92) {
        const img = await this.loadImage(file);
        const factor = Math.max(1, Number(scale) || 2);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * factor));
        canvas.height = Math.max(1, Math.round(img.height * factor));
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), format, quality);
        });
    },

    async removeBackgroundByColor(file, options = {}) {
        const { mode = 'auto', color = '#ffffff', tolerance = 40 } = options;
        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const parseHex = (hex) => {
            const raw = String(hex || '').replace('#', '').trim();
            if (raw.length !== 6) return { r: 255, g: 255, b: 255 };
            const r = parseInt(raw.slice(0, 2), 16);
            const g = parseInt(raw.slice(2, 4), 16);
            const b = parseInt(raw.slice(4, 6), 16);
            return { r: r || 0, g: g || 0, b: b || 0 };
        };

        const target =
            mode === 'auto'
                ? { r: data[0], g: data[1], b: data[2] }
                : parseHex(color);

        const tol = Math.min(255, Math.max(0, Number(tolerance) || 40));
        const tolSq = tol * tol;

        for (let i = 0; i < data.length; i += 4) {
            const dr = data[i] - target.r;
            const dg = data[i + 1] - target.g;
            const db = data[i + 2] - target.b;
            const distSq = dr * dr + dg * dg + db * db;
            if (distSq <= tolSq) {
                data[i + 3] = 0;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92);
        });
    },

    async blurRegion(file, region = {}) {
        const { x = 0, y = 0, width, height, radius = 12 } = region;
        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const w = Math.max(1, Math.round(Number(width) || 1));
        const h = Math.max(1, Math.round(Number(height) || 1));
        const rx = Math.max(0, Math.round(Number(x) || 0));
        const ry = Math.max(0, Math.round(Number(y) || 0));
        const blur = Math.max(0, Number(radius) || 12);

        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, w, h);
        ctx.clip();
        ctx.filter = `blur(${blur}px)`;
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92);
        });
    },

    async addTextOverlay(file, text, options = {}) {
        const {
            x = 24,
            y = 64,
            opacity = 0.9,
            fontSize = 42,
            color = '#ffffff'
        } = options;

        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        ctx.globalAlpha = Math.min(1, Math.max(0, Number(opacity) || 0.9));
        ctx.fillStyle = color;
        ctx.font = `bold ${Number(fontSize) || 42}px sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(String(text || ''), Number(x) || 0, Number(y) || 0);
        ctx.globalAlpha = 1;

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92);
        });
    },

    /**
     * Downloads a Blob as a file
     * @param {Blob} blob - Data to download
     * @param {string} filename - Desired filename
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

export default imageService;
