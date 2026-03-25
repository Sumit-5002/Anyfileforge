/**
 * Enhanced BibTeX Parser & Management Service
 */
export const parseBibtex = (text) => {
    const entries = [];
    // More robust entry regex that handles most standard BibTeX formats
    const entryRegex = /@(\w+)\s*\{\s*([^, \t\n\r]+)\s*,\s*([\s\S]*?)\n\s*\}/g;
    
    let match;
    while ((match = entryRegex.exec(text)) !== null) {
        const type = match[1].toLowerCase();
        const key = match[2].trim();
        const fieldsRaw = match[3];
        const fields = {};

        // Improved field regex to handle content in braces {} or quotes "" properly
        const fieldRegex = /([a-zA-Z0-9_\-]+)\s*=\s*(?:\{([\s\S]*?)\}|"([\s\S]*?)"|([^\s,}]+))/g;
        
        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(fieldsRaw)) !== null) {
            const key = fieldMatch[1].toLowerCase();
            const value = (fieldMatch[2] || fieldMatch[3] || fieldMatch[4] || '').trim();
            fields[key] = value;
        }

        if (key && type) {
            entries.push({ type, key, fields });
        }
    }
    return entries;
};

export const exportToCsv = (entries) => {
    if (entries.length === 0) return '';
    const allFields = new Set(['key', 'type']);
    entries.forEach(e => Object.keys(e.fields).forEach(f => allFields.add(f)));
    const headers = Array.from(allFields);
    
    const rows = entries.map(e => {
        return headers.map(h => {
            let val = h === 'key' ? e.key : h === 'type' ? e.type : (e.fields[h] || '');
            // Escape double quotes and handle multi-line content
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
};

export const exportToBibtex = (entries) => {
    return entries.map(e => {
        const fieldsLines = Object.entries(e.fields)
            .map(([k, v]) => `  ${k} = {${v}}`)
            .join(',\n');
        return `@${e.type}{${e.key},\n${fieldsLines}\n}`;
    }).join('\n\n');
};
