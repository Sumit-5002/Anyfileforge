import { loadImage } from './imageUtils';

export const convertImage = async (file, format = 'image/jpeg', quality = 0.8) => {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return new Promise((res) => canvas.toBlob(res, format, quality));
};

export const resizeImage = async (file, mw, mh) => {
    const img = await loadImage(file);
    const scale = Math.min(mw / img.width, mh / img.height, 1);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.8));
};

export const resizeImageTo = async (file, w, h, options = {}) => {
    const { keep = true, fmt = 'image/jpeg', q = 0.9, noEnlarge = false, unit = 'px' } = options;
    const img = await loadImage(file);

    let tw, th;

    if (unit === 'percent') {
        const pct = (Number(w) || 100) / 100;
        tw = Math.round(img.width * pct);
        th = Math.round(img.height * pct);
    } else {
        tw = Number(w) || img.width;
        th = Number(h) || img.height;
        if (keep) {
            const r = img.width / img.height;
            if (w && !h) th = Math.round(tw / r);
            else if (!w && h) tw = Math.round(th * r);
            else {
                const fw = th * r; const fh = tw / r;
                if (fw <= tw) tw = Math.round(fw); else th = Math.round(fh);
            }
        }
    }

    if (noEnlarge && (tw > img.width || th > img.height)) {
        tw = img.width;
        th = img.height;
    }

    const canvas = document.createElement('canvas');
    canvas.width = tw; canvas.height = th;
    canvas.getContext('2d').drawImage(img, 0, 0, tw, th);
    return new Promise((res) => canvas.toBlob(res, fmt, q));
};
