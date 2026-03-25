import React, { useState, useMemo } from 'react';
import { 
    Download, Trash2, Edit3, Plus, FileText, 
    Link as LinkIcon, Database, Share2, Search,
    FileSpreadsheet, FileJson, FileCode, Check, Copy, Activity, FileStack
} from 'lucide-react';
import { parseBibtex, exportToCsv, exportToBibtex } from '../../../../services/researcher/bibtexService';
import ToolWorkspace from '../common/ToolWorkspace';
import './BibtexManagerTool.css';

const BibtexManagerTool = ({ tool }) => {
    const [bibInput, setBibInput] = useState('');
    const [entries, setEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState(false);
    const [results, setResults] = useState([]);

    const handleImport = () => {
        if (!bibInput.trim()) return;
        const newEntries = parseBibtex(bibInput);
        if (newEntries.length === 0) {
            alert("No valid BibTeX entries found. Please check your syntax.");
            return;
        }
        setEntries(prev => [...prev, ...newEntries]);
        setBibInput('');
    };

    const handleAddMore = (files) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const newEntries = parseBibtex(text);
            if (newEntries.length > 0) {
                setEntries(prev => [...prev, ...newEntries]);
            }
        };
        if (files[0]) reader.readAsText(files[0]);
    };

    const filteredEntries = useMemo(() => {
        if (!searchTerm) return entries;
        const s = searchTerm.toLowerCase();
        return entries.filter(e => 
            e.key.toLowerCase().includes(s) || 
            e.type.toLowerCase().includes(s) ||
            Object.values(e.fields).some(v => String(v).toLowerCase().includes(s))
        );
    }, [entries, searchTerm]);

    const handleCopyAll = () => {
        const fullContent = exportToBibtex(entries);
        navigator.clipboard.writeText(fullContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const exportFile = (format) => {
        if (entries.length === 0) return;
        let content = '';
        let fileName = `indexed_citations.${format === 'bib' ? 'bib' : format === 'csv' ? 'csv' : 'json'}`;
        if (format === 'bib') content = exportToBibtex(entries);
        else if (format === 'csv') content = exportToCsv(entries);
        else if (format === 'json') content = JSON.stringify(entries, null, 2);

        const blob = new Blob([content], { type: 'text/plain' });
        
        setResults(prev => [...prev, {
            id: `bib-${Date.now()}`,
            name: fileName,
            data: blob,
            type: 'data'
        }]);
    };

    return (
        <ToolWorkspace
            tool={tool}
            layout="research"
            results={results}
            onFilesSelected={handleAddMore}
            sidebarTitle="BIB_ENGINE"
            onReset={() => { setEntries([]); setBibInput(''); setResults([]); setSearchTerm(''); }}
            sidebar={
                <div className="bib-sidebar flex flex-col gap-10 h-full p-2">
                    <div className="section">
                        <div className="flex items-center gap-3 mb-6 px-1">
                            <div className="p-2.5 bg-primary-500/10 rounded-xl"><FileStack size={18} className="text-primary-400"/></div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1">Source_Capture</h4>
                                <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-500">Live BibTeX Stream</p>
                            </div>
                        </div>
                        <textarea 
                            className="w-full bg-black/40 border border-white/5 rounded-[32px] p-8 text-xs font-mono text-primary-300 focus:border-primary-500/40 h-[280px] resize-none outline-none shadow-inner"
                            placeholder="@article{ref_id, author={...}, title={...}, year={...}}"
                            value={bibInput}
                            onChange={(e) => setBibInput(e.target.value)}
                        />
                        <button 
                            className="btn-primary-gradient w-full mt-6 py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
                            onClick={handleImport}
                            disabled={!bibInput.trim()}
                        >
                            <Plus size={18}/> 
                            <span className="font-black italic tracking-tighter uppercase">Commit_Buffer</span>
                        </button>
                    </div>

                    <div className="section mt-auto">
                        <div className="flex items-center gap-3 mb-6 px-1">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Download size={18} className="text-emerald-400"/></div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 leading-none">Export_Snapshot</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <button className="p-5 bg-white/5 hover:bg-white/10 rounded-[24px] border border-white/5 flex flex-col items-center gap-2 group transition-all" onClick={() => exportFile('bib')} title="BibTeX System">
                                <FileCode size={20} className="text-slate-500 group-hover:text-primary-400"/>
                                <span className="text-[8px] font-black uppercase text-slate-600 group-hover:text-white">BIB</span>
                            </button>
                            <button className="p-5 bg-white/5 hover:bg-white/10 rounded-[24px] border border-white/5 flex flex-col items-center gap-2 group transition-all" onClick={() => exportFile('csv')} title="Spreadsheet">
                                <FileSpreadsheet size={20} className="text-slate-500 group-hover:text-emerald-400"/>
                                <span className="text-[8px] font-black uppercase text-slate-600 group-hover:text-white">CSV</span>
                            </button>
                            <button className="p-5 bg-white/5 hover:bg-white/10 rounded-[24px] border border-white/5 flex flex-col items-center gap-2 group transition-all" onClick={() => exportFile('json')} title="JSON Structure">
                                <FileJson size={20} className="text-slate-500 group-hover:text-amber-400"/>
                                <span className="text-[8px] font-black uppercase text-slate-600 group-hover:text-white">JSON</span>
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="bib-manager-container h-full flex flex-col p-4 gap-8">
                <div className="manager-header flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="search-bar-wrapper flex-grow relative group w-full lg:w-auto">
                        <Search size={22} strokeWidth={2.5} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-500 transition-colors"/>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900/80 border border-white/10 rounded-[30px] py-6 pl-20 pr-8 text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 shadow-2xl transition-all" 
                            placeholder="Filter Citations Key / Author / Metadata..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-3 px-10 py-6 bg-slate-900 border border-white/5 rounded-[30px] text-[10px] font-black uppercase tracking-[2px] text-slate-200 transition-all hover:bg-slate-800 shadow-xl" onClick={handleCopyAll}>
                        {copied ? <Check size={18} className="text-emerald-400"/> : <Copy size={18}/>}
                        {copied ? 'CACHED' : 'Sync_Clipboard'}
                    </button>
                </div>

                <div className="entries-grid flex-grow overflow-auto no-scrollbar pb-10">
                    {filteredEntries.length === 0 ? (
                        <div className="empty-state h-full flex items-center justify-center flex-col opacity-20 p-20 text-center animate-in fade-in">
                            <Database size={80} className="mb-6 stroke-1 text-slate-500"/>
                            <p className="text-2xl font-black italic tracking-tighter uppercase text-white mb-2">Registry_Null</p>
                            <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-500">Feed the citation engine to begin indexing metadata.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {filteredEntries.map((e, idx) => (
                                <div key={idx} className="entry-card bg-slate-900/60 border border-white/10 rounded-[40px] p-8 flex flex-col gap-8 hover:border-primary-500/30 transition-all group relative overflow-hidden animate-in fade-in zoom-in-95">
                                     <div className="entry-header flex items-center justify-between">
                                         <div className="flex items-center gap-4">
                                             <div className="p-4 bg-primary-500/10 rounded-[20px] group-hover:scale-110 transition-transform">
                                                 <FileText size={24} className="text-primary-400"/>
                                             </div>
                                             <div className="flex flex-col">
                                                 <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest opacity-60">@{e.type}</span>
                                                 <span className="text-sm font-mono font-black text-white italic tracking-tighter">{e.key}</span>
                                             </div>
                                         </div>
                                         <div className="flex gap-2">
                                             <button className="p-3 bg-red-500/5 hover:bg-red-500 text-slate-600 hover:text-white rounded-xl transition-all" onClick={() => setEntries(entries.filter((_, i) => i !== idx))} title="Purge Record">
                                                 <Trash2 size={16}/>
                                             </button>
                                         </div>
                                     </div>

                                     <div className="entry-fields flex flex-col gap-3">
                                         {Object.entries(e.fields).slice(0, 5).map(([k, v]) => (
                                             <div key={k} className="field-row flex items-start gap-4 border-b border-white/[0.03] pb-2 last:border-0 group/field">
                                                 <span className="text-[8px] font-black uppercase text-slate-600 w-16 pt-1 tracking-widest">{k}</span>
                                                 <span className="text-[11px] font-medium text-slate-300 leading-relaxed group-hover/field:text-primary-200 transition-colors">{v}</span>
                                             </div>
                                         ))}
                                     </div>

                                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-[60px] rounded-full pointer-events-none group-hover:opacity-100 opacity-20 transition-all"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ToolWorkspace>
    );
};

export default BibtexManagerTool;
