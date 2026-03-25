import { loadImage } from './imageUtils';

const getFaceSettings = (sensitivity) => {
    if (sensitivity === 'low') return { minConfidence: 0.45, expansion: 0.18, radius: 14 };
    if (sensitivity === 'high') return { minConfidence: 0.12, expansion: 0.3, radius: 30 };
    return { minConfidence: 0.25, expansion: 0.24, radius: 22 };
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const expandBounds = (box, width, height, expansion) => {
    const xPad = box.width * expansion;
    const yPad = box.height * expansion;
    const x = clamp(Math.floor(box.x - xPad), 0, width);
    const y = clamp(Math.floor(box.y - yPad), 0, height);
    const right = clamp(Math.ceil(box.x + box.width + xPad), 0, width);
    const bottom = clamp(Math.ceil(box.y + box.height + yPad), 0, height);
    return {
        x,
        y,
        width: Math.max(1, right - x),
        height: Math.max(1, bottom - y)
    };
};

const detectFaces = async (img, minConfidence) => {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
        const detector = new window.FaceDetector({
            fastMode: false,
            maxDetectedFaces: 20
        });
        const faces = await detector.detect(img);
        return faces
            .filter((face) => (face?.confidence ?? 1) >= minConfidence && face?.boundingBox)
            .map((face) => face.boundingBox);
    }
    return [];
};

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
    const img = await loadImage(file);
    const { minConfidence, expansion, radius } = getFaceSettings(sensitivity);

    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d');

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = img.width;
    sourceCanvas.height = img.height;
    const sourceCtx = sourceCanvas.getContext('2d');
    sourceCtx.drawImage(img, 0, 0);

    ctx.drawImage(img, 0, 0);
    const faceBoxes = await detectFaces(img, minConfidence);

    // Fallback for browsers without FaceDetector: blur center region.
    const boxesToBlur = faceBoxes.length > 0
        ? faceBoxes.map((box) => expandBounds(box, img.width, img.height, expansion))
        : [expandBounds({
            x: img.width * 0.35,
            y: img.height * 0.2,
            width: img.width * 0.3,
            height: img.height * 0.45
        }, img.width, img.height, 0)];

    boxesToBlur.forEach((box) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.width, box.height);
        ctx.clip();
        ctx.filter = `blur(${radius}px)`;
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.restore();
    });
    ctx.filter = 'none';

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
