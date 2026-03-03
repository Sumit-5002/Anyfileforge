import { loadImage } from './imageUtils';

export const upscaleImage = async (file, scale = 2, format = 'image/png', quality = 0.92) => {
    const img = await loadImage(file);
    const cv = document.createElement('canvas');
    cv.width = Math.round(img.width * scale);
    cv.height = Math.round(img.height * scale);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    return new Promise((res) => cv.toBlob(res, format, quality));
};

export const removeBackgroundByColor = async (file, options = {}) => {
    const { mode = 'auto', color = '#ffffff', tolerance = 40 } = options;
    const img = await loadImage(file);
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const idata = ctx.getImageData(0, 0, cv.width, cv.height);
    const data = idata.data;
    const target = mode === 'auto' ? { r: data[0], g: data[1], b: data[2] } : {
        r: parseInt(color.slice(1, 3), 16), g: parseInt(color.slice(3, 5), 16), b: parseInt(color.slice(5, 7), 16)
    };
    const tsq = tolerance * tolerance;
    for (let i = 0; i < data.length; i += 4) {
        if ((data[i] - target.r) ** 2 + (data[i + 1] - target.g) ** 2 + (data[i + 2] - target.b) ** 2 <= tsq) data[i + 3] = 0;
    }
    ctx.putImageData(idata, 0, 0);
    return new Promise((res) => cv.toBlob(res, 'image/png', 0.92));
};

export const autoDetectFaces = async (file, sensitivity = 'medium') => {
    // In a real app, this would use a WASM face detector or a server API.
    // For local-first demonstration, we'll simulate detection by blurring the center area
    const img = await loadImage(file);
    const radius = sensitivity === 'high' ? 30 : (sensitivity === 'low' ? 10 : 20);

    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Simulate detecting a face in the center
    const faceW = img.width * 0.3;
    const faceH = img.height * 0.3;
    const faceX = (img.width - faceW) / 2;
    const faceY = (img.height - faceH) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(img.width / 2, img.height / 2, Math.min(faceW, faceH) / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(cv, 0, 0);
    ctx.restore();

    return new Promise((res) => cv.toBlob(res, 'image/png', 0.92));
};

export const blurRegion = async (file, region = {}) => {
    const { x = 0, y = 0, width, height, radius = 20 } = region;
    const img = await loadImage(file);
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(cv, 0, 0);
    ctx.restore();
    return new Promise((res) => cv.toBlob(res, 'image/png', 0.92));
};
