const CACHE_KEY = 'anyfileforge_bibtex_cache';

const getCache = () => {
    try {
        const stored = localStorage.getItem(CACHE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
};

const setCache = (doi, bibtex) => {
    try {
        const cache = getCache();
        cache[doi.toLowerCase()] = {
            data: bibtex,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) { console.warn("Cache write failed (Storage Limit?):", e); }
};

export const fetchBibtexFromDoi = async (doi) => {
    let cleanDoi = doi.trim();
    if (cleanDoi.startsWith('http://doi.org/')) cleanDoi = cleanDoi.replace('http://doi.org/', '');
    if (cleanDoi.startsWith('https://doi.org/')) cleanDoi = cleanDoi.replace('https://doi.org/', '');
    if (cleanDoi.startsWith('doi:')) cleanDoi = cleanDoi.replace('doi:', '');
    
    // Check Cache
    const cache = getCache();
    if (cache[cleanDoi.toLowerCase()]) {
        console.log("Serving BibTeX from local cache for:", cleanDoi);
        return cache[cleanDoi.toLowerCase()].data;
    }

    try {
        const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}/transform/application/x-bibtex`);
        if (!response.ok) {
            if (response.status === 404) throw new Error(`DOI not found: ${cleanDoi}`);
            throw new Error(`API returned ${response.status} for ${cleanDoi}`);
        }
        const text = await response.text();
        setCache(cleanDoi, text);
        return text;
    } catch (err) {
        throw new Error(`${err.message}`);
    }
};

export const fetchBulkBibtex = async (dois, progressCallback) => {
    const results = [];
    const errors = [];
    const validDois = [...new Set(dois.map(d => d.trim()).filter(Boolean))];
    
    for (let i = 0; i < validDois.length; i++) {
        const doi = validDois[i];
        try {
            const bibtex = await fetchBibtexFromDoi(doi);
            results.push(bibtex);
        } catch (err) {
            errors.push(err.message);
        }
        if (progressCallback) progressCallback((i + 1) / validDois.length);
    }
    
    return {
        bibtex: results.join('\n\n'),
        errors
    };
};
