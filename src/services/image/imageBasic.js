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

export const resizeImageTo = async (file, w, h, keep = true, fmt = 'image/jpeg', q = 0.9) => {
    const img = await loadImage(file);
    let tw = Number(w) || img.width;
    let th = Number(h) || img.height;
    if (keep) {
        const r = img.width / img.height;
        if (tw && !th) th = Math.round(tw / r);
        else if (!tw && th) tw = Math.round(th * r);
        else {
            const fw = th * r; const fh = tw / r;
            if (fw <= tw) tw = Math.round(fw); else th = Math.round(fh);
        }
    }
    const canvas = document.createElement('canvas');
    canvas.width = tw; canvas.height = th;
    canvas.getContext('2d').drawImage(img, 0, 0, tw, th);
    return new Promise((res) => canvas.toBlob(res, fmt, q));
};
