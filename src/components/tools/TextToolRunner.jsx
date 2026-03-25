import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Play, CornerDownRight, AlertCircle, FileCode2 } from 'lucide-react';
import './TextToolRunner.css';

const safeText = (text) =>
    (text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

function TextToolRunner({ tool }) {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');

    // Tool specific states
    const [regex, setRegex] = useState('');
    const [replace, setReplace] = useState('');
    const [flags, setFlags] = useState('g');
    const [isDecode, setIsDecode] = useState(false);

    // UI states
    const [copied, setCopied] = useState(false);

    const inputRef = useRef(null);
    const outputRef = useRef(null);

    // Auto-run for certain tools (like regex or markdown preview) if input is short, but let's stick to Run button for heavy ones or big text.
    // Actually, realtime processing is much more "premium".
    useEffect(() => {
        if (!input) {
            setOutput('');
            setError('');
            return;
        }

        // Let's debounce slightly for real-time feel
        const timer = setTimeout(() => {
            handleRun();
        }, 400);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input, regex, replace, flags, isDecode, tool.id]);


    const handleRun = () => {
        setError('');

        try {
            if (tool.id === 'json-formatter') {
                const json = JSON.parse(input);
                setOutput(JSON.stringify(json, null, 4));
            } else if (tool.id === 'json-to-csv') {
                const data = JSON.parse(input);
                const array = Array.isArray(data) ? data : [data];
                if (array.length === 0) { setOutput(''); return; }

                const keys = Array.from(array.reduce((s, r) => {
                    Object.keys(r || {}).forEach(k => s.add(k));
                    return s;
                }, new Set()));

                const header = keys.join(',');
                const rows = array.map(row => keys.map(k => {
                    let v = row[k] ?? '';
                    if (typeof v === 'object') v = JSON.stringify(v);
                    v = String(v).replace(/"/g, '""');
                    return (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${v}"` : v;
                }).join(','));
                setOutput([header, ...rows].join('\n'));
            } else if (tool.id === 'base64-encode') {
                if (isDecode) {
                    // UTF-8 safe decode
                    setOutput(decodeURIComponent(atob(input).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
                } else {
                    // UTF-8 safe encode
                    setOutput(btoa(encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p))));
                }
            } else if (tool.id === 'code-minifier') {
                const minified = input
                    .replace(/\/\*[\s\S]*?\*\//g, '')
                    .replace(/\/\/.*$/gm, '')
                    .replace(/\s+/g, ' ')
                    .replace(/ ?([{}()[\] ,;:=+-]) ?/g, '$1')
                    .trim();
                setOutput(minified);
            } else if (tool.id === 'markdown-preview') {
                let html = safeText(input)
                    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                    .replace(/^- (.*$)/gm, '<li>$1</li>')
                    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code>$1</code>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
                    .replace(/^---$/gm, '<hr />')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br />');
                setOutput(html.startsWith('<') ? html : `<p>${html}</p>`);
            } else if (tool.id === 'regex-tester') {
                if (!regex) { setOutput('Enter a regex pattern.'); return; }
                const re = new RegExp(regex, flags);
                const all = [...input.matchAll(re)];
                if (all.length === 0) { setOutput('No matches found.'); return; }

                const summary = all.map((m, i) => {
                    const groups = m.length > 1 ? `\n  Groups: ${JSON.stringify(m.slice(1))}` : '';
                    return `Match ${i + 1}: "${m[0]}" at index ${m.index}${groups}`;
                }).join('\n\n');

                let outStr = `Found ${all.length} matches:\n\n${summary}`;
                if (replace) {
                    const replaced = input.replace(re, replace);
                    outStr += `\n\n-------------------\nREPLACEMENT RESULT:\n\n${replaced}`;
                }
                setOutput(outStr);
            } else if (tool.id === 'csv-plotter') {
                const rows = input.trim().split('\n').filter(Boolean).map(r => r.split(','));
                if (rows.length < 2) throw new Error('CSV needs a header and at least one data row');
                const header = rows[0];
                const stats = header.map((h, i) => {
                    const values = rows.slice(1).map(r => parseFloat(r[i])).filter(v => !isNaN(v));
                    if (values.length === 0) return `${h}: (Non-numeric)`;
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    return `${h}: Avg=${avg.toFixed(2)}, Min=${Math.min(...values)}, Max=${Math.max(...values)}`;
                });
                setOutput(`CSV Insights:\n\nColumns: ${header.join(' | ')}\nRows: ${rows.length - 1}\n\nNumeric Analysis:\n${stats.join('\n')}`);
            } else if (tool.id === 'latex-editor') {
                setOutput(`% LaTeX Draft\n\\documentclass{article}\n\\begin{document}\n${input}\n\\end{document}`);
            } else if (tool.id === 'bibtex-manager') {
                const entries = input.split('@').filter(Boolean).map(e => {
                    const type = e.split('{')[0].trim();
                    const key = (e.match(/\{([^,]+)/) || [])[1];
                    const title = (e.match(/title\s*=\s*["{](.*?)["}]/i) || [])[1];
                    return `[${type.toUpperCase()}] ${key}: ${title || '(No Title)'}`;
                });
                setOutput(entries.length ? entries.join('\n') : 'No BibTeX entries detected.');
            }
        } catch (err) {
            setError(err.message || 'Processing failed');
            setOutput('');
        }
    };

    const handleCopy = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const showRegexInputs = tool.id === 'regex-tester';
    const showBase64Mode = tool.id === 'base64-encode';
    const isMarkdown = tool.id === 'markdown-preview';

    return (
        <div className="text-tool-container">

            <div className="text-tool-glass-card">
                <div className="text-tool-header">
                    <div className="text-tool-title-group">
                        <div className="icon-box">
                            <FileCode2 size={24} />
                        </div>
                        <div>
                            <h3>{tool.name}</h3>
                            <p>{tool.description}</p>
                        </div>
                    </div>

                </div>

                <div className="text-tool-controls">
                    {showRegexInputs && (
                        <div className="control-group">
                            <div className="regex-input-wrapper">
                                <span className="regex-slash">/</span>
                                <input
                                    type="text"
                                    value={regex}
                                    onChange={(e) => setRegex(e.target.value)}
                                    placeholder="pattern"
                                    className="regex-input"
                                />
                                <span className="regex-slash">/</span>
                                <input
                                    type="text"
                                    value={flags}
                                    onChange={(e) => setFlags(e.target.value)}
                                    placeholder="flags"
                                    className="flags-input"
                                />
                            </div>
                            <div className="regex-input-wrapper mt-2">
                                <label className="me-2 text-xs opacity-70">Replace with:</label>
                                <input
                                    type="text"
                                    value={replace}
                                    onChange={(e) => setReplace(e.target.value)}
                                    placeholder="replacement string"
                                    className="regex-input"
                                />
                            </div>
                        </div>
                    )}

                    {showBase64Mode && (
                        <div className="control-group switch-toggle">
                            <button
                                className={`toggle-btn ${!isDecode ? 'active' : ''}`}
                                onClick={() => setIsDecode(false)}
                            >
                                Encode
                            </button>
                            <button
                                className={`toggle-btn ${isDecode ? 'active' : ''}`}
                                onClick={() => setIsDecode(true)}
                            >
                                Decode
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-tool-split-view">
                    {/* INPUT PANE */}
                    <div className="pane input-pane">
                        <div className="pane-header">
                            <span>Input</span>
                            {error && (
                                <div className="error-badge">
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                        <div className="editor-container">
                            <div className="line-numbers">
                                {input.split('\n').map((_, i) => (
                                    <div key={i}>{i + 1}</div>
                                ))}
                                {!input && <div>1</div>}
                            </div>
                            <textarea
                                ref={inputRef}
                                className="code-textarea"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Paste or type your data here..."
                                spellCheck="false"
                            />
                        </div>
                    </div>

                    <div className="center-divider">
                        <div className="divider-icon">
                            <CornerDownRight size={16} />
                        </div>
                    </div>

                    {/* OUTPUT PANE */}
                    <div className="pane output-pane">
                        <div className="pane-header">
                            <span>Output</span>
                            <button
                                className="copy-btn"
                                onClick={handleCopy}
                                disabled={!output && !isMarkdown}
                                title="Copy to clipboard"
                            >
                                {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                                <span>{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>

                        <div className="editor-container output-container">
                            {isMarkdown ? (
                                <div
                                    className="markdown-preview-content"
                                    dangerouslySetInnerHTML={{ __html: output || '<div class="empty-state">Preview will appear here</div>' }}
                                />
                            ) : (
                                <>
                                    <div className="line-numbers">
                                        {output.split('\n').map((_, i) => (
                                            <div key={i}>{i + 1}</div>
                                        ))}
                                        {!output && <div>1</div>}
                                    </div>
                                    <textarea
                                        ref={outputRef}
                                        className="code-textarea output-textarea"
                                        value={output}
                                        readOnly
                                        placeholder="Result will appear here automatically..."
                                        spellCheck="false"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TextToolRunner;

