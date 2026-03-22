import { marked } from 'marked';
import hljs from 'highlight.js';

export const parseIpynb = async (file) => {
    const text = await file.text();
    let notebook;
    try {
        let cleanText = text.trim();
        // Handle potential BOM or weird encoding bytes at the start
        if (cleanText.charCodeAt(0) === 0xFEFF) {
            cleanText = cleanText.slice(1);
        }
        notebook = JSON.parse(cleanText);
        
        // If it got double-stringified (common PowerShell artifact)
        if (typeof notebook === 'string') {
            notebook = JSON.parse(notebook);
        }
        
    } catch {
        throw new Error("Invalid .ipynb file. Could not parse JSON. Is the text encoding correct?");
    }

    // Support Jupyter v3 (worksheets) and v4 (cells)
    let cellsToParse = [];
    if (notebook.cells && Array.isArray(notebook.cells)) {
        cellsToParse = notebook.cells;
    } else if (notebook.worksheets && Array.isArray(notebook.worksheets) && notebook.worksheets[0].cells) {
        cellsToParse = notebook.worksheets[0].cells;
    }

    if (cellsToParse.length === 0) {
        throw new Error(`Invalid notebook structure. No cells found. (Type: ${typeof notebook})`);
    }

    // Configure marked to use highlight.js
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'python';
            return hljs.highlight(code, { language }).value;
        }
    });

    const parsedCells = cellsToParse.map(cell => {
        const source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '');
        
        let htmlContent = '';
        if (cell.cell_type === 'markdown') {
            htmlContent = marked.parse(source);
        } else if (cell.cell_type === 'code') {
            const highlighted = hljs.highlight(source, { language: 'python' }).value;
            // Grab outputs if they exist
            let outputHtml = '';
            if (cell.outputs && Array.isArray(cell.outputs)) {
                outputHtml = cell.outputs.map(out => {
                    if (out.data) {
                        // Handle HTML graphs
                        if (out.data['text/html']) {
                            return Array.isArray(out.data['text/html']) ? out.data['text/html'].join('') : out.data['text/html'];
                        }
                        // Handle SVG graphs
                        if (out.data['image/svg+xml']) {
                            const svgData = Array.isArray(out.data['image/svg+xml']) ? out.data['image/svg+xml'].join('') : out.data['image/svg+xml'];
                            return `<div class="ipynb-svg-wrapper">${svgData}</div>`;
                        }
                        // Handle PNG images / arrays
                        if (out.data['image/png']) {
                            const b64 = Array.isArray(out.data['image/png']) ? out.data['image/png'].join('') : out.data['image/png'];
                            return `<img src="data:image/png;base64,${b64.replace(/\\n/g, '')}" alt="output png" style="max-width:100%; height:auto;" />`;
                        }
                        // Handle JPEG images
                        if (out.data['image/jpeg']) {
                            const b64 = Array.isArray(out.data['image/jpeg']) ? out.data['image/jpeg'].join('') : out.data['image/jpeg'];
                            return `<img src="data:image/jpeg;base64,${b64.replace(/\\n/g, '')}" alt="output jpeg" style="max-width:100%; height:auto;" />`;
                        }
                    }
                    if (out.text) {
                        const textContent = Array.isArray(out.text) ? out.text.join('') : out.text;
                        return `<pre class="ipynb-output">${textContent}</pre>`;
                    }
                    if (out.traceback) {
                        return `<pre class="ipynb-error">${out.traceback.join('\\n')}</pre>`;
                    }
                    return '';
                }).join('');
            }
            const execCount = cell.execution_count !== null && cell.execution_count !== undefined ? cell.execution_count : ' ';
            
            htmlContent = `
                <div class="ipynb-code-flex-container">
                    <div class="ipynb-prompt in-prompt">In [${execCount}]:</div>
                    <div class="ipynb-code-cell">
                        <pre><code class="hljs language-python">${highlighted}</code></pre>
                    </div>
                </div>
                ${outputHtml ? `
                <div class="ipynb-output-flex-container">
                    <div class="ipynb-prompt out-prompt">Out[${execCount}]:</div>
                    <div class="ipynb-outputs">${outputHtml}</div>
                </div>` : ''}
            `;
        } else {
            // raw or other
            htmlContent = `<pre>${source}</pre>`;
        }

        return {
            type: cell.cell_type,
            html: htmlContent
        };
    });

    return {
        cells: parsedCells,
        metadata: notebook.metadata || {}
    };
};
