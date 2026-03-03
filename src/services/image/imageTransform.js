import { loadImage } from './imageUtils';

export const rotateImage = async (file, angle, format = 'image/jpeg', quality = 0.9) => {
    const img = await loadImage(file);
    const rad = (angle * Math.PI) / 180;
    const swap = angle % 180 !== 0;
    const canvas = document.createElement('canvas');
    canvas.width = swap ? img.height : img.width;
    canvas.height = swap ? img.width : img.height;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    return new Promise((res) => canvas.toBlob(res, format, quality));
};

export const cropImage = async (file, x, y, width, height, format = 'image/jpeg', quality = 0.9) => {
    const img = await loadImage(file);
    const cx = Math.max(0, Number(x) || 0);
    const cy = Math.max(0, Number(y) || 0);
    const cw = Math.min(Number(width) || img.width, img.width - cx);
    const ch = Math.min(Number(height) || img.height, img.height - cy);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    canvas.getContext('2d').drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
    return new Promise((res) => canvas.toBlob(res, format, quality));
};
