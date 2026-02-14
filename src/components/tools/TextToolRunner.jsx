import React, { useMemo, useState } from 'react';
import './TextToolRunner.css';

const safeText = (text) =>
    text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

function TextToolRunner({ tool }) {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [regex, setRegex] = useState('');
    const [flags, setFlags] = useState('g');

    const handleRun = () => {
        setError('');
        setOutput('');

        try {
            if (tool.id === 'json-formatter') {
                const json = JSON.parse(input);
                setOutput(JSON.stringify(json, null, 2));
            } else if (tool.id === 'json-to-csv') {
                const data = JSON.parse(input);
                if (!Array.isArray(data)) throw new Error('JSON must be an array of objects');
                const keys = Array.from(
                    data.reduce((set, row) => {
                        Object.keys(row || {}).forEach((key) => set.add(key));
                        return set;
                    }, new Set())
                );
                const header = keys.join(',');
                const rows = data.map((row) =>
                    keys.map((key) => JSON.stringify(row?.[key] ?? '')).join(',')
                );
                setOutput([header, ...rows].join('\n'));
            } else if (tool.id === 'base64-encode') {
                const isBase64 = flags.includes('d');
                if (isBase64) {
                    setOutput(atob(input));
                } else {
                    setOutput(btoa(input));
                }
            } else if (tool.id === 'code-minifier') {
                const minified = input
                    .replace(/\/\*[\s\S]*?\*\//g, '')
                    .replace(/\/\/.*$/gm, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                setOutput(minified);
            } else if (tool.id === 'markdown-preview') {
                let html = safeText(input)
                    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
                    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
                    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br />');
                setOutput(html);
            } else if (tool.id === 'regex-tester') {
                const re = new RegExp(regex, flags);
                const matches = [];
                let match;
                while ((match = re.exec(input)) !== null) {
                    matches.push({ match: match[0], index: match.index });
                    if (!re.global) break;
                }
                setOutput(JSON.stringify(matches, null, 2));
            } else if (tool.id === 'csv-plotter') {
                const rows = input.trim().split('\n').map((row) => row.split(','));
                const header = rows.shift() || [];
                const preview = rows.slice(0, 10);
                setOutput(
                    JSON.stringify(
                        { header, preview, totalRows: rows.length },
                        null,
                        2
                    )
                );
            } else if (tool.id === 'latex-editor') {
                setOutput(input);
            } else if (tool.id === 'bibtex-manager') {
                const entries = input
                    .split('@')
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                    .map((entry) => entry.split('{')[0].trim());
                setOutput(JSON.stringify(entries, null, 2));
            }
        } catch (err) {
            setError(err.message || 'Processing failed');
        }
    };

    const markdownPreview = useMemo(() => {
        if (tool.id !== 'markdown-preview') return null;
        return output;
    }, [output, tool.id]);

    const showRegexInputs = tool.id === 'regex-tester';
    const showBase64Mode = tool.id === 'base64-encode';

    return (
        <div className="text-tool card">
            <div className="text-tool-header">
                <h3>{tool.name}</h3>
                <p>{tool.description}</p>
            </div>

            {showRegexInputs && (
                <div className="text-tool-row">
                    <input
                        type="text"
                        value={regex}
                        onChange={(e) => setRegex(e.target.value)}
                        placeholder="Regex pattern"
                    />
                    <input
                        type="text"
                        value={flags}
                        onChange={(e) => setFlags(e.target.value)}
                        placeholder="Flags (e.g. gi)"
                    />
                </div>
            )}

            {showBase64Mode && (
                <div className="text-tool-row">
                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={flags.includes('d')}
                            onChange={(e) => setFlags(e.target.checked ? 'd' : 'e')}
                        />
                        Decode mode
                    </label>
                </div>
            )}

            <textarea
                className="text-input"
                rows="10"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste or type here..."
            />

            <div className="text-tool-actions">
                <button className="btn btn-primary" onClick={handleRun}>Run</button>
                <button className="btn btn-secondary" onClick={() => { setInput(''); setOutput(''); setError(''); }}>
                    Clear
                </button>
            </div>

            {error && <p className="text-error">{error}</p>}

            {tool.id === 'markdown-preview' ? (
                <div
                    className="text-output markdown-output"
                    dangerouslySetInnerHTML={{ __html: markdownPreview || '' }}
                />
            ) : (
                <textarea
                    className="text-output"
                    rows="10"
                    value={output}
                    readOnly
                    placeholder="Output will appear here"
                />
            )}
        </div>
    );
}

export default TextToolRunner;
