import { marked } from 'marked';
import hljs from 'highlight.js';

export const parseIpynb = async (file) => {
    const text = await file.text();
    let notebook;
    try {
        notebook = JSON.parse(text);
    } catch (err) {
        throw new Error("Invalid .ipynb file. Could not parse JSON.");
    }

    if (!notebook.cells || !Array.isArray(notebook.cells)) {
        throw new Error("Invalid notebook structure. No cells found.");
    }

    // Configure marked to use highlight.js
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'python';
            return hljs.highlight(code, { language }).value;
        }
    });

    const parsedCells = notebook.cells.map(cell => {
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
                    if (out.data && out.data['text/html']) {
                        return Array.isArray(out.data['text/html']) ? out.data['text/html'].join('') : out.data['text/html'];
                    }
                    if (out.data && out.data['image/png']) {
                        return `<img src="data:image/png;base64,${out.data['image/png'].replace(/\n/g, '')}" alt="output image" style="max-width:100%;" />`;
                    }
                    if (out.text) {
                        const textContent = Array.isArray(out.text) ? out.text.join('') : out.text;
                        return `<pre class="ipynb-output">${textContent}</pre>`;
                    }
                    if (out.traceback) {
                        return `<pre class="ipynb-error">${out.traceback.join('\n')}</pre>`;
                    }
                    return '';
                }).join('');
            }
            
            htmlContent = `
                <div class="ipynb-code-cell">
                    <pre><code class="hljs language-python">${highlighted}</code></pre>
                </div>
                ${outputHtml ? `<div class="ipynb-outputs">${outputHtml}</div>` : ''}
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
