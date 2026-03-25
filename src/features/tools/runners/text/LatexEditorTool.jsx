import React, { useState, useEffect } from 'react';
import { 
    Download, FileText, Share2, Search, 
    FileCode, Check, Copy, Activity, FileStack, 
    Type, Edit3, Trash2, Layout, Maximize2, Split
} from 'lucide-react';
import ToolWorkspace from '../common/ToolWorkspace';
import { jsPDF } from 'jspdf';
import './LatexEditorTool.css';

const DEFAULT_LATEX = `\\documentclass{article}
\\usepackage[utf8]{inputenc}

\\title{Scientific Analysis Report}
\\author{Researcher Engine}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This is a high-fidelity LaTeX document generated locally.
No servers were used in the creation of this manuscript.

\\section{Equations}
Analysis follows the standard model:
E = mc^2

\\end{document}`;

function LatexEditorTool({ tool }) {
    const [code, setCode] = useState(DEFAULT_LATEX);
    const [results, setResults] = useState([]);
    const [copied, setCopied] = useState(false);
    const [layout, setLayout] = useState('split'); // 'split', 'editor', 'preview'

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const exportFile = async (format) => {
        let fileName = `document_${Date.now()}.${format}`;
        let blob;

        if (format === 'tex') {
            blob = new Blob([code], { type: 'text/plain' });
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            const lines = code.split('\n');
            let y = 10;
            lines.forEach(line => {
                if (y > 280) { doc.addPage(); y = 10; }
                doc.text(line, 10, y);
                y += 7;
            });
            blob = doc.output('blob');
        } else if (format === 'html') {
            const html = `<!DOCTYPE html><html><body style="font-family:serif;white-space:pre-wrap;padding:40px">${code.replace(/</g, '&lt;')}</body></html>`;
            blob = new Blob([html], { type: 'text/html' });
        }

        setResults(prev => [...prev, {
            id: `latex-${Date.now()}`,
            name: fileName,
            data: blob,
            type: format === 'pdf' ? 'pdf' : 'data'
        }]);
    };

    return (
        <ToolWorkspace
            tool={tool}
            layout="research"
            results={results}
            onReset={() => { setCode(DEFAULT_LATEX); setResults([]); }}
            sidebarTitle="ENGINE_EDITOR"
            sidebar={
                <div className="latex-sidebar flex flex-col gap-10 p-2">
                    <div className="section">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-primary-500/10 rounded-xl"><FileCode size={18} className="text-primary-400"/></div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Manuscript_Control</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border ${layout === 'editor' ? 'bg-primary-500 border-primary-400 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`} onClick={() => setLayout('editor')}>
                                <Edit3 size={16}/>
                                <span className="text-[8px] font-black uppercase">Source</span>
                            </button>
                            <button className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border ${layout === 'split' ? 'bg-primary-500 border-primary-400 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`} onClick={() => setLayout('split')}>
                                <Split size={16}/>
                                <span className="text-[8px] font-black uppercase">Diff</span>
                            </button>
                            <button className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border ${layout === 'preview' ? 'bg-primary-500 border-primary-400 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`} onClick={() => setLayout('preview')}>
                                <Layout size={16}/>
                                <span className="text-[8px] font-black uppercase">Render</span>
                            </button>
                        </div>
                    </div>

                    <div className="section mt-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Download size={18} className="text-emerald-400"/></div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 leading-none">Compile_Artifact</h4>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-xs font-bold text-slate-300 group" onClick={() => exportFile('tex')}>
                                <span className="flex items-center gap-3"><FileCode size={16} className="text-primary-400"/> Source (.tex)</span>
                                <Download size={14} className="opacity-0 group-hover:opacity-100"/>
                            </button>
                            <button className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-xs font-bold text-slate-300 group" onClick={() => exportFile('pdf')}>
                                <span className="flex items-center gap-3"><FileText size={16} className="text-red-400"/> Paper (.pdf)</span>
                                <Download size={14} className="opacity-0 group-hover:opacity-100"/>
                            </button>
                            <button className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-xs font-bold text-slate-300 group" onClick={() => exportFile('html')}>
                                <span className="flex items-center gap-3"><Type size={16} className="text-emerald-400"/> Web (.html)</span>
                                <Download size={14} className="opacity-0 group-hover:opacity-100"/>
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <div className={`latex-container h-full flex flex-col p-4 gap-6 animate-in fade-in ${layout}-layout`}>
                <div className="editor-nav flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 bg-slate-900 border border-white/10 rounded-full px-6 py-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status: Syntactic_Valid</span>
                    </div>
                    <button className="flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-primary-500 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-all shadow-xl group" onClick={handleCopy}>
                        {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14}/>}
                        {copied ? 'CACHED' : 'Copy_Source'}
                    </button>
                </div>

                <div className={`editor-mainframe flex-grow flex flex-col md:flex-row gap-6 min-h-0`}>
                    {(layout === 'editor' || layout === 'split') && (
                        <div className="editor-pane flex-grow flex flex-col min-h-0 bg-slate-900/60 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
                             <div className="pane-header p-4 px-8 border-b border-white/5 flex items-center gap-3">
                                 <Edit3 size={14} className="text-primary-500"/>
                                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Buffer_Stream</span>
                             </div>
                             <textarea 
                                className="flex-grow bg-transparent p-10 text-sm font-mono text-primary-200 resize-none outline-none leading-relaxed no-scrollbar"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                spellCheck={false}
                             />
                        </div>
                    )}

                    {(layout === 'preview' || layout === 'split') && (
                        <div className="preview-pane flex-grow flex flex-col min-h-0 bg-white rounded-[40px] shadow-2xl overflow-hidden group">
                             <div className="pane-header p-4 px-8 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                                 <Layout size={14} className="text-slate-400"/>
                                 <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rendered_View (Draft)</span>
                             </div>
                             <div className="flex-grow p-12 overflow-auto font-serif text-slate-900 leading-normal no-scrollbar selection:bg-primary-100">
                                 <div className="max-w-3xl mx-auto whitespace-pre-wrap">
                                     {code}
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </ToolWorkspace>
    );
}

export default LatexEditorTool;
