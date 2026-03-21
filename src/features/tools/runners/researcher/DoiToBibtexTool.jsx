import React, { useState } from 'react';
import { Copy, Check, Loader2, Download } from 'lucide-react';
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
        <div className="custom-tool-wrapper fade-in" style={{ height: '100%' }}>
            <div className="doi-workspace">
                <div className="doi-sidebar">
                    <h3>Enter DOIs</h3>
                    <p className="doi-help">Paste DOIs separated by newlines, commas, or semicolons.</p>
                    <textarea 
                        className="doi-textarea"
                        placeholder="10.1038/nphys1170&#10;10.1126/science.1158658"
                        value={doiInput}
                        onChange={(e) => setDoiInput(e.target.value)}
                        disabled={isFetching}
                    ></textarea>

                    <button 
                        className={`btn-primary w-full mt-4 ${isFetching || !doiInput.trim() ? 'opacity-75 cursor-not-allowed' : ''}`}
                        onClick={handleFetch}
                        disabled={isFetching || !doiInput.trim()}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {isFetching ? <Loader2 size={18} className="spin" /> : null}
                        {isFetching ? `Fetching... ${progress}%` : 'Fetch BibTeX'}
                    </button>

                    {errors.length > 0 && (
                        <div className="doi-errors">
                            <h4>Errors</h4>
                            <ul>
                                {errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                
                <div className="doi-main">
                    {!output && !isFetching && (
                        <div className="empty-state">
                            <p>Generated BibTeX will appear here.</p>
                        </div>
                    )}

                    {isFetching && !output && (
                        <div className="empty-state">
                            <Loader2 size={32} className="spin text-primary" style={{ margin: '0 auto 16px', display: 'block' }}/>
                            <p>Fetching data from CrossRef...</p>
                        </div>
                    )}
                    
                    {output && (
                        <div className="doi-output-container">
                            <div className="doi-output-header">
                                <h3>BibTeX Citations</h3>
                                <div className="doi-actions">
                                    <button className="btn-secondary btn-sm" onClick={handleCopy}>
                                        {copied ? <Check size={16}/> : <Copy size={16}/>}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button className="btn-secondary btn-sm" onClick={handleDownload}>
                                        <Download size={16}/> Save .bib
                                    </button>
                                </div>
                            </div>
                            <textarea 
                                className="doi-output-textarea"
                                readOnly
                                value={output}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoiToBibtexTool;
