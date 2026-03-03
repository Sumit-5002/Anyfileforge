import { loadImage } from './imageUtils';

export const watermarkImage = async (file, options = {}) => {
    const { type = 'text', text = 'CONFIDENTIAL', watermarkFile, position = 'bottom-right', opacity = 0.35, fontSize = 32, color = '#ffffff' } = options;
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.globalAlpha = opacity;

    if (type === 'image' && watermarkFile) {
        const wmImg = await loadImage(watermarkFile);
        const wmWidth = Math.min(wmImg.width, canvas.width * 0.25);
        const wmHeight = (wmImg.height / wmImg.width) * wmWidth;
        const margin = 24;
        let x = margin, y = canvas.height - wmHeight - margin;
        if (position === 'bottom-center') x = (canvas.width - wmWidth) / 2;
        else if (position === 'bottom-right') x = canvas.width - wmWidth - margin;
        else if (position === 'center') { x = (canvas.width - wmWidth) / 2; y = (canvas.height - wmHeight) / 2; }

        ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
    } else {
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px sans-serif`;
        const tw = ctx.measureText(text).width;
        const margin = 24;
        let x = position === 'bottom-center' ? (canvas.width - tw) / 2 : margin;
        if (position === 'bottom-right') x = canvas.width - tw - margin;
        ctx.fillText(text, x, canvas.height - margin);
    }

    return new Promise((res) => canvas.toBlob(res, 'image/png', 0.9));
};

export const memeImage = async (file, topText, bottomText, options = {}) => {
    const { fontSize = 42, color = '#ffffff', strokeColor = '#000000' } = options;
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(2, Math.round(fontSize / 10));
    if (topText) {
        ctx.strokeText(topText.toUpperCase(), canvas.width / 2, 24 + fontSize);
        ctx.fillText(topText.toUpperCase(), canvas.width / 2, 24 + fontSize);
    }
    if (bottomText) {
        ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 24);
        ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 24);
    }
    return new Promise((res) => canvas.toBlob(res, 'image/png', 0.9));
};

export const addTextOverlay = async (file, text, options = {}) => {
    const { x = 0, y = 0, fontSize = 32, color = '#ffffff', opacity = 1.0 } = options;
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(text, x, y);
    return new Promise((res) => canvas.toBlob(res, 'image/png', 1.0));
};
export const applyImageFilter = async (file, filterType, options = {}) => {
    const { intensity = 1.0 } = options;
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    let filterStr = 'none';
    if (filterType === 'grayscale') filterStr = `grayscale(${intensity * 100}%)`;
    else if (filterType === 'sepia') filterStr = `sepia(${intensity * 100}%)`;
    else if (filterType === 'invert') filterStr = `invert(${intensity * 100}%)`;
    else if (filterType === 'blur') filterStr = `blur(${intensity * 20}px)`;
    else if (filterType === 'brightness') filterStr = `brightness(${intensity * 200}%)`;
    else if (filterType === 'contrast') filterStr = `contrast(${intensity * 200}%)`;

    ctx.filter = filterStr;
    ctx.drawImage(img, 0, 0);
    return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.95));
};
