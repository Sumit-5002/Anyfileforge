export const fetchBibtexFromDoi = async (doi) => {
    let cleanDoi = doi.trim();
    if (cleanDoi.startsWith('http://doi.org/')) cleanDoi = cleanDoi.replace('http://doi.org/', '');
    if (cleanDoi.startsWith('https://doi.org/')) cleanDoi = cleanDoi.replace('https://doi.org/', '');
    if (cleanDoi.startsWith('doi:')) cleanDoi = cleanDoi.replace('doi:', '');
    
    try {
        const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}/transform/application/x-bibtex`);
        if (!response.ok) {
            if (response.status === 404) throw new Error(`DOI not found: ${cleanDoi}`);
            throw new Error(`API returned ${response.status} for ${cleanDoi}`);
        }
        const text = await response.text();
        return text;
    } catch (err) {
        throw new Error(`${err.message}`);
    }
};

export const fetchBulkBibtex = async (dois, progressCallback) => {
    const results = [];
    const errors = [];
    
    const validDois = dois.map(d => d.trim()).filter(Boolean);
    
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
