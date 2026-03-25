import React, { useState } from 'react';
import { Copy, Check, Loader2, Download, BookOpen } from 'lucide-react';
import { fetchBulkBibtex } from '../../../../services/researcher/doiService';
import './DoiToBibtexTool.css';

const DoiToBibtexTool = () => {
    const [doiInput, setDoiInput] = useState('');
    const [output, setOutput] = useState('');
    const [errors, setErrors] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);

    const handleFetch = async () => {
        if (!doiInput.trim()) return;
        const dois = doiInput.split(/[\n,;]+/).map(d => d.trim()).filter(Boolean);
        if (dois.length === 0) return;

        setIsFetching(true);
        setErrors([]);
        setOutput('');
        setProgress(0);

        try {
            const result = await fetchBulkBibtex(dois, (fraction) => {
                setProgress(Math.round(fraction * 100));
            });
            setOutput(result.bibtex);
            setErrors(result.errors);
        } catch (err) {
            setErrors([err.message]);
        } finally {
            setIsFetching(false);
            setProgress(100);
        }
    };

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!output) return;
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'citations.bib';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="doi-wrapper fade-in">
            <div className="doi-layout">

                {/* ── Sidebar ── */}
                <aside className="doi-sidebar">
                    <div className="doi-brand">
                        <span className="doi-badge">Citation Engine</span>
                        <h2 className="doi-title">DOI <span className="doi-title-sep">to</span> BibTeX</h2>
                        <p className="doi-desc">Paste multiple Digital Object Identifiers to generate bulk formatted citations.</p>
                    </div>

                    <div className="doi-input-section">
                        <label className="doi-input-label">DOI Input</label>
                        <textarea
                            className="doi-textarea"
                            placeholder={"10.1038/nphys1170\n10.1126/science.1158658"}
                            value={doiInput}
                            onChange={(e) => setDoiInput(e.target.value)}
                            disabled={isFetching}
                        />
                    </div>

                    <button
                        className={`doi-fetch-btn${isFetching || !doiInput.trim() ? ' disabled' : ''}`}
                        onClick={handleFetch}
                        disabled={isFetching || !doiInput.trim()}
                    >
                        {isFetching ? (
                            <>
                                <Loader2 size={15} className="doi-btn-spinner" />
                                <span>Syncing Meta {progress}%</span>
                            </>
                        ) : (
                            <>
                                <BookOpen size={15} />
                                <span>GATHER CITATIONS</span>
                            </>
                        )}
                    </button>

                    <div className="doi-offline-badge">
                        <span className="doi-online-dot" />
                        <span>Offline Cache Active</span>
                    </div>

                    {errors.length > 0 && (
                        <div className="doi-errors-panel">
                            <h4 className="doi-errors-title">Fetch Diagnostics</h4>
                            <div className="doi-errors-scroll">
                                <ul className="doi-errors-list">
                                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </aside>

                {/* ── Main Panel ── */}
                <div className="doi-main">
                    <div className="doi-main-inner">

                        {!output && !isFetching && (
                            <div className="doi-empty-state">
                                <div className="doi-empty-icon-wrap">
                                    <BookOpen size={36} />
                                </div>
                                <p className="doi-empty-title">BIBTEX_VAULT_EMPTY</p>
                                <p className="doi-empty-sub">Waiting for valid DOI pulse…</p>
                            </div>
                        )}

                        {isFetching && !output && (
                            <div className="doi-loading-state">
                                <Loader2 size={48} className="doi-loading-spinner" />
                                <h3 className="doi-loading-title">Querying Registry</h3>
                                <p className="doi-loading-sub">ESTABLISHING HANDSHAKE WITH CROSSREF_API…</p>
                                <div className="doi-loading-bar-track">
                                    <div className="doi-loading-bar-fill" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        {output && (
                            <div className="doi-output-container fade-in">
                                <div className="doi-output-header">
                                    <div className="doi-output-title-row">
                                        <span className="doi-output-accent-bar" />
                                        <h3 className="doi-output-title">Reference Bundle</h3>
                                    </div>
                                    <div className="doi-output-actions">
                                        <button className={`doi-action-copy${copied ? ' copied' : ''}`} onClick={handleCopy}>
                                            {copied
                                                ? <Check size={14} />
                                                : <Copy size={14} />}
                                            {copied ? 'CACHED' : 'COPY'}
                                        </button>
                                        <button className="doi-action-download" onClick={handleDownload}>
                                            <Download size={14} />
                                            DOWNLOAD .BIB
                                        </button>
                                    </div>
                                </div>
                                <div className="doi-output-body">
                                    <textarea
                                        className="doi-output-textarea"
                                        readOnly
                                        value={output}
                                    />
                                    <span className="doi-ready-label">READY_TO_IMPORT</span>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default DoiToBibtexTool;
