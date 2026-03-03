import { loadImage } from './imageUtils';

export const watermarkImage = async (file, text, options = {}) => {
    const { position = 'bottom-right', opacity = 0.35, fontSize = 32, color = '#ffffff' } = options;
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const tw = ctx.measureText(text).width;
    const margin = 24;
    let x = position === 'bottom-center' ? (canvas.width - tw) / 2 : margin;
    if (position === 'bottom-right') x = canvas.width - tw - margin;
    ctx.fillText(text, x, canvas.height - margin);
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
