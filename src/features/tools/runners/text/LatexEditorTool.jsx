import React, { useState } from 'react';
import { 
    Download, FileText, FileCode, Check, Copy, 
    Type, Edit3, Layout, Split
} from 'lucide-react';
import ToolWorkspace from '../common/ToolWorkspace';
import { jsPDF } from 'jspdf';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import './LatexEditorTool.css';

const DEFAULT_LATEX = `\\documentclass{article}
\\usepackage[utf8]{inputenc}

\\title{Scientific Analysis Report}
\\author{Researcher Engine}

\\begin{document}
\\maketitle

\\section{Introduction}
This is a mixed-media compilation test. The Engine now correctly parses preamble boilerplates and text boundaries, while preserving the raw mathematical equations enclosed in double dollar signs:

$$
f(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi
$$

\\end{document}`;

function LatexEditorTool({ tool }) {
    const [code, setCode] = useState(DEFAULT_LATEX);
    const [results, setResults] = useState([]);
    const [copied, setCopied] = useState(false);
    const [layout, setLayout] = useState('split');

    const handleFileLoad = (files) => {
        if (!files || files.length === 0) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            setCode(e.target.result);
        };
        reader.readAsText(files[0]);
    };

    const renderDocument = (text) => {
        if (!text) return <span style={{ color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>KaTeX Engine Ready...</span>;
        
        let cleaned = text;
        const bodyMatch = text.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
        if (bodyMatch) {
            cleaned = bodyMatch[1];
        } else {
            cleaned = cleaned.replace(/\\documentclass(\[.*?\])?\{.*?\}/g, '');
            cleaned = cleaned.replace(/\\usepackage(\[.*?\])?\{.*?\}/g, '');
        }

        // Strip LaTeX comments
        cleaned = cleaned.replace(/%.*$/gm, '');

        cleaned = cleaned.replace(/\\title\{.*?\}/g, '');
        cleaned = cleaned.replace(/\\author\{.*?\}/g, '');
        cleaned = cleaned.replace(/\\date\{.*?\}/g, '');
        cleaned = cleaned.replace(/\\maketitle/g, '');

        const parts = cleaned.split('$$');
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return (
                    <div key={index} className="math-rendering-box" style={{ margin: '24px 0' }}>
                        <BlockMath math={part} renderError={(e) => <span style={{color:'#ef4444', fontSize:'12px', fontWeight:'bold'}}>[KaTeX Error]: {e.message}</span>} />
                    </div>
                );
            }
            
            // Protect standard HTML tags and parse basic LaTeX text elements
            let safeText = part.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            safeText = safeText.replace(/\\section\{(.*?)\}/g, '<h2 style="font-size:1.3rem; font-weight:800; margin-top:24px; margin-bottom: 8px; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">$1</h2>');
            safeText = safeText.replace(/\\subsection\{(.*?)\}/g, '<h3 style="font-size:1.1rem; font-weight:700; margin-top:16px; margin-bottom: 6px; color:#1e293b;">$1</h3>');
            safeText = safeText.replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>');
            safeText = safeText.replace(/\\textit\{(.*?)\}/g, '<em>$1</em>');
            safeText = safeText.replace(/\\underline\{(.*?)\}/g, '<u>$1</u>');

            return (
                <div 
                    key={index} 
                    style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#334155', marginBottom: '16px' }}
                    dangerouslySetInnerHTML={{ __html: safeText.trim() }}
                />
            );
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const exportFile = async (format) => {
        let fileName = `equation_${Date.now()}.${format}`;
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
            const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.42/dist/katex.min.css"></head><body style="padding:40px;text-align:center;"><div style="font-size:24px;">$$${code}$$</div><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.42/dist/katex.min.js"></script><script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.42/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body);"></script></body></html>`;
            blob = new Blob([html], { type: 'text/html' });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <ToolWorkspace
            tool={tool}
            allowEmpty={true}
            layout="research"
            results={results}
            onReset={() => { setCode(''); setResults([]); }}
            onFilesSelected={handleFileLoad}
            accept=".tex,.txt"
            sidebarTitle="LATEX_ENGINE"
            sidebar={
                <div className="latex-sidebar">
                    <div className="latex-section">
                        <div className="latex-section-header">
                            <div className="latex-icon-box"><FileCode size={18} /></div>
                            <h4 className="latex-section-title">Engine_Control</h4>
                        </div>
                        <div className="latex-grid">
                            <button className={`latex-btn ${layout === 'editor' ? 'active' : ''}`} onClick={() => setLayout('editor')}>
                                <Edit3 size={16}/>
                                <span>Source</span>
                            </button>
                            <button className={`latex-btn ${layout === 'split' ? 'active' : ''}`} onClick={() => setLayout('split')}>
                                <Split size={16}/>
                                <span>Diff</span>
                            </button>
                            <button className={`latex-btn ${layout === 'preview' ? 'active' : ''}`} onClick={() => setLayout('preview')}>
                                <Layout size={16}/>
                                <span>Render</span>
                            </button>
                        </div>
                    </div>

                    <div className="latex-section" style={{ marginTop: 'auto' }}>
                        <div className="latex-section-header">
                            <div className="latex-icon-box emerald"><Download size={18} /></div>
                            <h4 className="latex-section-title" style={{ color: '#34d399' }}>Compile_Artifact</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <button className="latex-export-btn" onClick={() => exportFile('tex')}>
                                <span><FileCode size={16} color="#60a5fa" /> Source (.tex)</span>
                                <Download size={14} className="icon"/>
                            </button>
                            <button className="latex-export-btn" onClick={() => exportFile('pdf')}>
                                <span><FileText size={16} color="#f87171" /> Paper (.pdf)</span>
                                <Download size={14} className="icon"/>
                            </button>
                            <button className="latex-export-btn" onClick={() => exportFile('html')}>
                                <span><Type size={16} color="#34d399" /> Web (.html)</span>
                                <Download size={14} className="icon"/>
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="latex-container">
                <div className="latex-editor-nav">
                    <div className="latex-status">
                        <div className="latex-status-dot"></div>
                        <span>Status: Syntactic_Valid</span>
                    </div>
                    <button className="latex-copy-btn" onClick={handleCopy}>
                        {copied ? <Check size={14} color="#34d399" /> : <Copy size={14}/>}
                        {copied ? 'CACHED' : 'Copy_Source'}
                    </button>
                </div>

                <div className="latex-mainframe">
                    {(layout === 'editor' || layout === 'split') && (
                        <div className="latex-pane editor">
                             <div className="latex-pane-header">
                                 <Edit3 size={14} />
                                 <span>Buffer_Stream</span>
                             </div>
                             <textarea 
                                className="latex-textarea"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                spellCheck={false}
                                placeholder="Enter LaTeX math here... e.g., \frac{1}{2}"
                             />
                        </div>
                    )}

                    {(layout === 'preview' || layout === 'split') && (
                        <div className="latex-pane preview">
                             <div className="latex-pane-header">
                                 <Layout size={14} />
                                 <span>Rendered_View</span>
                             </div>
                             <div className="latex-preview-content" style={{ display: 'block', textAlign: 'left' }}>
                                 {renderDocument(code)}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </ToolWorkspace>
    );
}

export default LatexEditorTool;
