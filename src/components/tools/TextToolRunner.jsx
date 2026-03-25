import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Copy, Check, Play, CornerDownRight, AlertCircle, FileCode2, BarChart3, Calculator, Eye, Upload, FileText } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import './TextToolRunner.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const safeText = (text) =>
    (text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

function TextToolRunner({ tool }) {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [chartData, setChartData] = useState(null);

    // Tool specific states
    const [regex, setRegex] = useState('');
    const [replace, setReplace] = useState('');
    const [flags, setFlags] = useState('g');
    const [isDecode, setIsDecode] = useState(false);

    // UI states
    const [copied, setCopied] = useState(false);

    const inputRef = useRef(null);
    const outputRef = useRef(null);

    useEffect(() => {
        if (!input) {
            setOutput('');
            setError('');
            setChartData(null);
            return;
        }

        const timer = setTimeout(() => {
            handleRun();
        }, 400);

        return () => clearTimeout(timer);
    }, [input, regex, replace, flags, isDecode, tool.id]);


    const handleRun = () => {
        setError('');
        setChartData(null);

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
                    setOutput(decodeURIComponent(atob(input).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
                } else {
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
                const labels = rows.slice(1).map(r => r[0]); 
                
                const stats = header.map((h, i) => {
                    const values = rows.slice(1).map(r => parseFloat(r[i])).filter(v => !isNaN(v));
                    if (values.length === 0) return `${h}: (Non-numeric)`;
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    return `${h}: Avg=${avg.toFixed(2)}, Min=${Math.min(...values)}, Max=${Math.max(...values)}`;
                });

                const dataIndices = header.map((h, i) => {
                    if (i === 0) return -1;
                    const val = parseFloat(rows[1][i]);
                    return !isNaN(val) ? i : -1;
                }).filter(i => i !== -1);

                if (dataIndices.length > 0) {
                    const datasets = dataIndices.map(idx => {
                        const colors = [
                            'rgba(59, 130, 246, 0.5)', 
                            'rgba(16, 185, 129, 0.5)', 
                            'rgba(245, 158, 11, 0.5)', 
                            'rgba(139, 92, 246, 0.5)'
                        ];
                        return {
                            label: header[idx],
                            data: rows.slice(1).map(r => parseFloat(r[idx])),
                            backgroundColor: colors[idx % colors.length],
                            borderColor: colors[idx % colors.length].replace('0.5', '1'),
                            borderWidth: 1,
                            tension: 0.4
                        };
                    });
                    setChartData({ labels, datasets });
                }

                setOutput(`CSV Insights:\n\nColumns: ${header.join(' | ')}\nRows: ${rows.length - 1}\n\nNumeric Analysis:\n${stats.join('\n')}`);
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
    const isChart = tool.id === 'csv-plotter' && chartData;

    return (
        <div className="text-tool-container">

            <div className="text-tool-glass-card">
                <div className="text-tool-header">
                    <div className="text-tool-title-group">
                        <div className="icon-box">
                            {isChart ? <BarChart3 size={24} className="text-primary" /> : <FileCode2 size={24} />}
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
                            <div className="regex-input-wrapper flex items-center">
                                <span className="regex-slash text-xl opacity-30">/</span>
                                <input
                                    type="text"
                                    value={regex}
                                    onChange={(e) => setRegex(e.target.value)}
                                    placeholder="pattern"
                                    className="regex-input bg-transparent border-none outline-none px-2 font-mono"
                                />
                                <span className="regex-slash text-xl opacity-30">/</span>
                                <div className="regex-flags-toggles flex items-center gap-1 ml-3">
                                    {['g', 'i', 'm', 's', 'u', 'y'].map(f => {
                                        const isActive = flags.includes(f);
                                        const labels = { g: 'Global', i: 'Case', m: 'Multi', s: 'DotAll', u: 'Uni', y: 'Sticky' };
                                        return (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => setFlags(isActive ? flags.replace(f, '') : flags + f)}
                                                className={`flag-badge-pro ${isActive ? 'active' : ''}`}
                                                title={labels[f]}
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: '9px',
                                                    fontFamily: 'monospace',
                                                    fontWeight: '900',
                                                    borderRadius: '6px',
                                                    backgroundColor: isActive ? 'var(--primary-500)' : 'rgba(255,255,255,0.05)',
                                                    color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                                                    border: '1px solid ' + (isActive ? 'var(--primary-500)' : 'rgba(255,255,255,0.1)'),
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {f}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="regex-input-wrapper mt-3 flex items-center">
                                <label className="me-3 text-[10px] font-black uppercase tracking-widest opacity-40">Replace with:</label>
                                <input
                                    type="text"
                                    value={replace}
                                    onChange={(e) => setReplace(e.target.value)}
                                    placeholder="replacement string"
                                    className="regex-input bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {showBase64Mode && (
                        <div className="control-group switch-toggle">
                            <button className={`toggle-btn ${!isDecode ? 'active' : ''}`} onClick={() => setIsDecode(false)}>Encode</button>
                            <button className={`toggle-btn ${isDecode ? 'active' : ''}`} onClick={() => setIsDecode(true)}>Decode</button>
                        </div>
                    )}
                </div>

                <div className="text-tool-split-view">
                    <div className="pane input-pane">
                        <div className="pane-header flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span>Input Editor</span>
                            </div>
                            {error && <div className="error-badge flex items-center gap-1.5 text-xs text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-full"><AlertCircle size={12} /> {error}</div>}
                        </div>
                        <div className="editor-container">
                            <div className="line-numbers">
                                {(input || ' ').split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
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
                        <div className="divider-icon"><CornerDownRight size={16} /></div>
                    </div>

                    <div className="pane output-pane">
                        <div className="pane-header flex justify-between items-center">
                            <span>Visual Result</span>
                            <button className="copy-btn flex items-center gap-2 group" onClick={handleCopy} disabled={!output && !isMarkdown}>
                                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="group-hover:text-primary" />}
                                <span className="text-xs font-bold">{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>

                        <div className="editor-container output-container">
                            {isChart ? (
                                <div className="chart-preview-content p-4 overflow-y-auto">
                                    <div className="flex items-center gap-2 mb-4 opacity-60">
                                        <BarChart3 size={14} />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Visual Plot</h4>
                                    </div>
                                    <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 mb-8 text-slate-100">
                                        <Bar 
                                            data={chartData} 
                                            options={{
                                                responsive: true,
                                                plugins: {
                                                    legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { family: 'monospace', size: 10 } } },
                                                },
                                                scales: {
                                                    y: { ticks: { color: '#445566' }, grid: { color: 'rgba(255,255,255,0.03)' } },
                                                    x: { ticks: { color: '#445566' }, grid: { display: false } }
                                                }
                                            }} 
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-4 opacity-60">
                                        <Calculator size={14} />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Numeric Insights</h4>
                                    </div>
                                    <pre className="p-4 bg-black/20 rounded-xl border border-white/5 font-mono text-[11px] text-slate-400 overflow-x-auto whitespace-pre">
                                        {output}
                                    </pre>
                                </div>
                            ) : isMarkdown ? (
                                <div className="markdown-preview-content p-8" dangerouslySetInnerHTML={{ __html: output || '<div class="empty-state">Preview will appear here</div>' }} />
                            ) : (
                                <>
                                    <div className="line-numbers">
                                        {(output || ' ').split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
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
