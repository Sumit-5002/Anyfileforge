export function parsePageRange(input, maxPages) {
    if (!input) return [];
    const parts = input.split(',').map((p) => p.trim()).filter(Boolean);
    const pages = new Set();

    parts.forEach((part) => {
        if (part.includes('-')) {
            const [startRaw, endRaw] = part.split('-');
            const start = parseInt(startRaw, 10);
            const end = parseInt(endRaw, 10);
            if (!Number.isFinite(start) || !Number.isFinite(end)) return;
            const s = Math.max(1, Math.min(start, end));
            const e = Math.min(maxPages, Math.max(start, end));
            for (let i = s; i <= e; i += 1) pages.add(i);
        } else {
            const num = parseInt(part, 10);
            if (!Number.isFinite(num)) return;
            if (num >= 1 && num <= maxPages) pages.add(num);
        }
    });

    return Array.from(pages).sort((a, b) => a - b);
}
