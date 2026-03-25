import React, { useState, useMemo } from 'react';
import { 
    Download, Trash2, Plus, FileText, 
    Database, Search,
    FileSpreadsheet, FileJson, FileCode, Check, Copy, FileStack
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
            onFilesSelected={handleAddMore}
            sidebarTitle="BIB_ENGINE"
            onReset={() => { setEntries([]); setBibInput(''); setResults([]); setSearchTerm(''); }}
            sidebar={
                <div className="bib-sidebar">
                    {/* Source Capture */}
                    <div className="section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FileStack size={18} />
                            </div>
                            <div>
                                <h4 className="section-title">Source_Capture</h4>
                                <p className="section-subtitle">Live BibTeX Stream</p>
                            </div>
                        </div>
                        <textarea
                            className="bib-textarea"
                            placeholder="@article{ref_id, author={...}, title={...}, year={...}}"
                            value={bibInput}
                            onChange={(e) => setBibInput(e.target.value)}
                        />
                        <button
                            className="bib-commit-btn"
                            onClick={handleImport}
                            disabled={!bibInput.trim()}
                        >
                            <Plus size={18} />
                            <span>Commit_Buffer</span>
                        </button>
                    </div>

                    {/* Export Snapshot */}
                    <div className="section" style={{ marginTop: 'auto' }}>
                        <div className="section-header">
                            <div className="section-icon emerald">
                                <Download size={18} />
                            </div>
                            <h4 className="export-section-title">Export_Snapshot</h4>
                        </div>
                        <div className="bib-export-grid">
                            <button className="bib-export-btn" onClick={() => exportFile('bib')} title="BibTeX System">
                                <FileCode size={20} className="export-icon-bib" />
                                <span className="bib-export-label">BIB</span>
                            </button>
                            <button className="bib-export-btn" onClick={() => exportFile('csv')} title="Spreadsheet">
                                <FileSpreadsheet size={20} className="export-icon-csv" />
                                <span className="bib-export-label">CSV</span>
                            </button>
                            <button className="bib-export-btn" onClick={() => exportFile('json')} title="JSON Structure">
                                <FileJson size={20} className="export-icon-json" />
                                <span className="bib-export-label">JSON</span>
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="bib-manager-container">
                {/* Header: Search + Sync Clipboard */}
                <div className="manager-header">
                    <div className="search-bar-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            className="bib-search-input"
                            placeholder="Filter Citations — Key / Author / Metadata..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className={`bib-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyAll}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'CACHED' : 'Sync_Clipboard'}
                    </button>
                </div>

                {/* Entries */}
                <div className="entries-grid">
                    {filteredEntries.length === 0 ? (
                        <div className="bib-empty-state">
                            <Database size={72} strokeWidth={1} />
                            <p className="bib-empty-state-title">Registry_Null</p>
                            <p className="bib-empty-state-sub">Feed the citation engine to begin indexing metadata.</p>
                        </div>
                    ) : (
                        <div className="entries-list">
                            {filteredEntries.map((e, idx) => (
                                <div key={idx} className="entry-card">
                                    <div className="entry-header">
                                        <div className="entry-meta">
                                            <div className="entry-icon-box">
                                                <FileText size={20} />
                                            </div>
                                            <div className="entry-id-group">
                                                <span className="entry-type-badge">@{e.type}</span>
                                                <span className="entry-key">{e.key}</span>
                                            </div>
                                        </div>
                                        <div className="entry-actions">
                                            <button
                                                className="btn-delete-entry"
                                                onClick={() => setEntries(entries.filter((_, i) => i !== idx))}
                                                title="Purge Record"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="entry-fields">
                                        {Object.entries(e.fields).slice(0, 5).map(([k, v]) => (
                                            <div key={k} className="field-row">
                                                <span className="field-key">{k}</span>
                                                <span className="field-value">{v}</span>
                                            </div>
                                        ))}
                                    </div>
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
