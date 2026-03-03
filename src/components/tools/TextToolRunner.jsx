import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Play, CornerDownRight, AlertCircle, FileCode2, Maximize2, Minimize2 } from 'lucide-react';
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
    const [flags, setFlags] = useState('g');
    const [isDecode, setIsDecode] = useState(false);

    // UI states
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

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
    }, [input, regex, flags, isDecode, tool.id]);


    const handleRun = () => {
        setError('');

        try {
            if (tool.id === 'json-formatter') {
                const json = JSON.parse(input);
                setOutput(JSON.stringify(json, null, 4));
            } else if (tool.id === 'json-to-csv') {
                const data = JSON.parse(input);
                if (!Array.isArray(data)) throw new Error('JSON must be an array of objects');
                if (data.length === 0) {
                    setOutput('');
                    return;
                }
                const keys = Array.from(
                    data.reduce((set, row) => {
                        Object.keys(row || {}).forEach((key) => set.add(key));
                        return set;
                    }, new Set())
                );
                const header = keys.join(',');
                const rows = data.map((row) =>
                    keys.map((key) => {
                        let val = row?.[key] ?? '';
                        if (typeof val === 'object') val = JSON.stringify(val);
                        // Escape quotes and wrapp in quotes if contains comma
                        val = String(val).replace(/"/g, '""');
                        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                            return `"${val}"`;
                        }
                        return val;
                    }).join(',')
                );
                setOutput([header, ...rows].join('\n'));
            } else if (tool.id === 'base64-encode') {
                if (isDecode) {
                    setOutput(atob(input));
                } else {
                    setOutput(btoa(input));
                }
            } else if (tool.id === 'code-minifier') {
                // A better regex-based basic minifier
                const minified = input
                    .replace(/\/\*[\s\S]*?\*\//g, '') // remove multi-line comments
                    .replace(/\/\/.*$/gm, '') // remove single-line comments
                    .replace(/\s+/g, ' ') // collapse whitespace
                    .replace(/{\s+/g, '{')
                    .replace(/\s+}/g, '}')
                    .replace(/;\s+/g, ';')
                    .replace(/,\s+/g, ',')
                    .trim();
                setOutput(minified);
            } else if (tool.id === 'markdown-preview') {
                // Advanced regex based simple markdown parser
                let html = safeText(input)
                    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
                    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
                    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code>$1</code>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br />');

                if (!html.startsWith('<h') && !html.startsWith('<p>')) {
                    html = `<p>${html}</p>`;
                }
                setOutput(html);
            } else if (tool.id === 'regex-tester') {
                if (!regex) {
                    setOutput('Please enter a regex pattern.');
                    return;
                }
                try {
                    const re = new RegExp(regex, flags);
                    let matches = [];
                    if (flags.includes('g')) {
                        const all = [...input.matchAll(re)];
                        matches = all.map(m => ({
                            match: m[0],
                            index: m.index,
                            groups: m.groups || m.slice(1)
                        }));
                    } else {
                        const m = input.match(re);
                        if (m) {
                            matches = [{ match: m[0], index: m.index, groups: m.groups || m.slice(1) }];
                        }
                    }
                    setOutput(matches.length > 0 ? JSON.stringify(matches, null, 4) : 'No matches found.');
                } catch {
                    throw new Error('Invalid Regular Expression');
                }
            } else if (tool.id === 'csv-plotter') {
                const rows = input.trim().split('\n').map((row) => row.split(','));
                const header = rows.shift() || [];
                const preview = rows.slice(0, 10);
                setOutput(JSON.stringify({ header, preview, totalRows: rows.length }, null, 4));
            } else if (tool.id === 'latex-editor') {
                setOutput(input);
            } else if (tool.id === 'bibtex-manager') {
                const entries = input
                    .split('@')
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                    .map((entry) => entry.split('{')[0].trim());
                setOutput(JSON.stringify(entries, null, 4));
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
        <div className={`text-tool-container ${isFullscreen ? 'fullscreen' : ''}`}>

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

                    <button className="btn-icon" onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen">
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
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

