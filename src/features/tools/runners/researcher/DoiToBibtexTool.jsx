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
        <div className="custom-tool-wrapper fade-in" style={{ height: '100%', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            <div className="doi-workspace max-w-7xl mx-auto p-4 md:p-8 h-full flex flex-col md:flex-row gap-8">
                <div className="doi-sidebar w-full md:w-96 flex flex-col gap-6 bg-slate-900/60 p-8 rounded-[40px] border border-white/5 shadow-2xl">
                    <div className="header-badge bg-primary-500/10 text-primary-400 border border-primary-500/20 px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest w-fit">Citation Engine</div>
                    <h2 className="text-3xl font-black tracking-tighter text-white">DOI <span className="opacity-40 font-thin">to</span> BibTeX</h2>
                    <p className="text-slate-400 text-xs leading-relaxed opacity-60">Paste multiple Digital Object Identifiers to generate bulk formatted citations.</p>
                    
                    <div className="flex-grow flex flex-col">
                        <textarea 
                            className="doi-textarea flex-grow bg-black/40 border border-white/10 rounded-3xl p-6 text-xs font-mono text-primary-300 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all scroll-premium placeholder:opacity-20"
                            placeholder="10.1038/nphys1170&#10;10.1126/science.1158658"
                            value={doiInput}
                            onChange={(e) => setDoiInput(e.target.value)}
                            disabled={isFetching}
                        ></textarea>
                    </div>

                    <div className="relative">
                        <button 
                            className={`btn-primary w-full py-4 text-[11px] font-black tracking-[0.2em] uppercase bg-gradient-to-br from-primary-600 to-indigo-600 border-none rounded-2xl shadow-xl hover:shadow-primary-500/20 active:scale-95 transition-all ${isFetching || !doiInput.trim() ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            onClick={handleFetch}
                            disabled={isFetching || !doiInput.trim()}
                        >
                            {isFetching ? (
                                <div className="flex items-center justify-center gap-3">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Syncing Meta {progress}%</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <span>GATHER CITATIONS</span>
                                </div>
                            )}
                        </button>
                    </div>

                    <div className="offline-badge flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Offline Cache Active</span>
                    </div>

                    {errors.length > 0 && (
                        <div className="doi-errors-panel mt-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <h4 className="text-[10px] font-black uppercase text-red-400 mb-2">Fetch Diagnostics</h4>
                            <div className="max-h-24 overflow-auto scroll-premium">
                                <ul className="text-[10px] text-red-300 font-mono list-disc pl-4 opacity-70">
                                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="doi-main flex-grow h-full bg-slate-900/40 rounded-[40px] border border-white/5 p-1 overflow-hidden">
                    <div className="h-full w-full bg-black/20 rounded-[38px] flex flex-col">
                        {!output && !isFetching && (
                            <div className="empty-state h-full flex items-center justify-center flex-col opacity-20 pointer-events-none p-12 text-center">
                                <div className="mb-4 p-8 bg-white/5 rounded-full"><Loader2 size={40} className="text-primary"/></div>
                                <p className="text-xl font-black italic tracking-tighter">BIBTEX_VAULT_EMPTY</p>
                                <p className="text-xs uppercase tracking-widest font-bold">Waiting for valid DOI pulse...</p>
                            </div>
                        )}

                        {isFetching && !output && (
                            <div className="empty-state h-full flex items-center justify-center flex-col p-12 text-center">
                                <Loader2 size={48} className="animate-spin text-primary-500 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"/>
                                <h3 className="text-lg font-black tracking-widest uppercase">Querying Registry</h3>
                                <p className="text-xs text-slate-500 mt-2 font-mono">ESTABLISHING HANDSHAKE WITH CROSSREF_API...</p>
                            </div>
                        )}
                        
                        {output && (
                            <div className="doi-output-container h-full flex flex-col p-8 fade-in">
                                <div className="doi-output-header flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-primary-500 rounded-full"></div>
                                        <h3 className="text-xl font-black tracking-tighter text-white uppercase italic">Reference Bundle</h3>
                                    </div>
                                    <div className="doi-actions flex gap-3">
                                        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-200 transition-all active:scale-95" onClick={handleCopy}>
                                            {copied ? <Check size={16} className="text-emerald-400"/> : <Copy size={16}/>}
                                            {copied ? 'CITATIONS_CACHED' : 'COPY_CLIPBOARD'}
                                        </button>
                                        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary-500/20 transition-all active:scale-95" onClick={handleDownload}>
                                            <Download size={16}/> DOWNLOAD .BIB
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-grow relative group">
                                    <textarea 
                                        className="doi-output-textarea w-full h-full bg-black/60 border border-white/5 rounded-[32px] p-8 text-xs font-mono text-emerald-400/80 leading-relaxed resize-none focus:outline-none scroll-premium selection:bg-primary-500/30 shadow-inner"
                                        readOnly
                                        value={output}
                                    />
                                    <div className="absolute bottom-6 right-8 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 group-hover:text-primary-500 transition-colors">READY_TO_IMPORT</div>
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
