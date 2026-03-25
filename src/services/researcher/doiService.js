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
    // Aggressive cleaning
    cleanDoi = cleanDoi.replace(/^(https?:\/\/)?(www\.)?doi\.org\//i, '');
    cleanDoi = cleanDoi.replace(/^doi:/i, '');
    cleanDoi = cleanDoi.trim();
    
    // Check Cache
    const cache = getCache();
    if (cache[cleanDoi.toLowerCase()]) {
        console.log("Serving BibTeX from local cache for:", cleanDoi);
        return cache[cleanDoi.toLowerCase()].data;
    }

    try {
        // Using standard DOI Content Negotiation (Works for Crossref, DataCite, mEDRA, etc.)
        const response = await fetch(`https://doi.org/${encodeURIComponent(cleanDoi)}`, {
            headers: {
                'Accept': 'application/x-bibtex'
            }
        });

        if (!response.ok) {
            if (response.status === 404) throw new Error(`DOI not found: ${cleanDoi}`);
            throw new Error(`Registry returned ${response.status} for ${cleanDoi}`);
        }

        const text = await response.text();
        
        // Basic validation that we actually got BibTeX (should start with @)
        if (!text.trim().startsWith('@')) {
            throw new Error(`Invalid BibTeX format returned for ${cleanDoi}`);
        }

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
