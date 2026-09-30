import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import {
    FileText, Eye, Columns, Upload, Download, Copy, Check,
    Bold, Italic, Code, Link, List, ListOrdered, Quote,
    Table, Minus, Hash, FileCode, Type, RotateCcw, Maximize2, X,
    FileUp, PenLine, Trash2
} from 'lucide-react';
import './MarkdownViewerTool.css';

/* ────────────────────────────────────────────────────────────────
   Configure marked with GFM, task lists, syntax highlighting
   ──────────────────────────────────────────────────────────────── */
const renderer = new marked.Renderer();

// Custom code block renderer with language badge
renderer.code = function(arg1, arg2) {
    const text = (typeof arg1 === 'object' && arg1 !== null) ? (arg1.text || '') : (arg1 || '');
    const lang = (typeof arg1 === 'object' && arg1 !== null) ? (arg1.lang || '') : (arg2 || '');
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    let highlighted;
    try {
        highlighted = lang
            ? hljs.highlight(text, { language, ignoreIllegals: true }).value
            : hljs.highlightAuto(text).value;
    } catch {
        highlighted = text;
    }
    const escapedLang = (lang || 'text').replace(/"/g, '&quot;');
    return `<div class="mdv-code-block-wrap">
  <pre data-lang="${escapedLang}"><code class="hljs language-${escapedLang}">${highlighted}</code></pre>
  <button class="mdv-copy-code-btn" onclick="(function(btn){var pre=btn.parentNode.querySelector('pre');navigator.clipboard.writeText(pre.innerText).then(function(){btn.textContent='Copied!';btn.classList.add('copied');setTimeout(function(){btn.textContent='Copy';btn.classList.remove('copied');},2000);});})(this)">Copy</button>
</div>`;
};

// Checkbox list items
renderer.listitem = function(item) {
    const text = typeof item === 'string' ? item : (item?.text || '');
    const task = typeof item === 'object' && item !== null ? Boolean(item.task) : false;
    const checked = typeof item === 'object' && item !== null ? Boolean(item.checked) : false;
    if (task) {
        return `<li style="list-style:none;margin-left:-1.5em"><input type="checkbox" ${checked ? 'checked' : ''} disabled style="margin-right:6px">${text}</li>`;
    }
    return `<li>${text}</li>`;
};

marked.setOptions({
    renderer,
    gfm: true,
    breaks: true,
    pedantic: false,
});

/* ─── Starter template ─────────────────────── */
const STARTER_TEMPLATE = `# 📝 Markdown Viewer

Welcome to **AnyFileForge Markdown Viewer** — a powerful, GitHub-style Markdown editor with live preview.

## ✨ Features

- 🔤 **GitHub-Flavored Markdown** (GFM) rendering
- 🎨 **Syntax highlighting** for code blocks
- 📊 **Tables**, task lists, blockquotes
- ↕️ **Split view**, Editor-only, or Preview-only
- 📂 **Open .md files** or start from scratch
- 💾 **Export** as HTML or Markdown
- 🔢 **Live word count** and character stats

---

## 🔥 Syntax Examples

### Code Block

\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}! Welcome to Markdown Viewer.\`;
}
console.log(greet('World'));
\`\`\`

### Task List

- [x] Open a Markdown file
- [x] Live preview rendering
- [ ] Export to PDF *(coming soon)*

### Table

| Feature       | Status    | Notes              |
|---------------|-----------|-------------------|
| GFM Tables    | ✅ Active  | Full support       |
| Task Lists    | ✅ Active  | Checkboxes render  |
| Code Highlight| ✅ Active  | 190+ languages     |
| LaTeX Math    | 🔜 Soon   | In development     |

### Blockquote

> _"Markdown is not a replacement for HTML… Markdown's design goal is readability."_
> — John Gruber

---

**Start editing** to see live preview updates! ➡️
`;

/* ─── Stats helper ─────────────────────────── */
const computeStats = (text) => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    const readTime = Math.max(1, Math.round(words / 200));
    return { chars, words, lines, readTime };
};

/* ─── Line numbers ─────────────────────────── */
const LineNums = React.memo(({ text }) => {
    const count = (text || ' ').split('\n').length;
    const nums = useMemo(
        () => Array.from({ length: count }, (_, i) => i + 1).join('\n') + '\n',
        [count]
    );
    return <div className="mdv-line-nums">{nums}</div>;
});
LineNums.displayName = 'LineNums';

/* ════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════ */
export default function MarkdownViewerTool({ tool }) {
    const [content, setContent] = useState(STARTER_TEMPLATE);
    const [view, setView] = useState('split'); // 'editor' | 'split' | 'preview'
    const [filename, setFilename] = useState('welcome.md');
    const [isDragging, setIsDragging] = useState(false);
    const [copied, setCopied] = useState(false);
    // Debounced content for preview — only re-renders after 150ms pause in typing
    const [debouncedContent, setDebouncedContent] = useState(STARTER_TEMPLATE);
    const [isRendering, setIsRendering] = useState(false);

    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    // Debounce: update preview 150ms after the user stops typing
    useEffect(() => {
        setIsRendering(true);
        const timer = setTimeout(() => {
            setDebouncedContent(content);
            setIsRendering(false);
        }, 150);
        return () => clearTimeout(timer);
    }, [content]);

    // Render markdown → HTML (only recalculates when debounced content changes)
    const renderedHtml = useMemo(() => {
        if (!debouncedContent) return '';
        try {
            return marked.parse(debouncedContent);
        } catch {
            return '<p style="color:#f87171">Render error</p>';
        }
    }, [debouncedContent]);

    const stats = useMemo(() => computeStats(content), [content]);

    /* ── File load ─────────────────────────── */
    const loadFile = useCallback((file) => {
        if (!file) return;
        if (!file.name.match(/\.(md|markdown|txt|mdx)$/i)) {
            alert('Please open a .md, .markdown, .txt or .mdx file');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setContent(e.target.result);
            setFilename(file.name);
        };
        reader.readAsText(file);
    }, []);

    /* ── Drag & drop ───────────────────────── */
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) loadFile(file);
    }, [loadFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => setIsDragging(false), []);

    /* ── New doc ───────────────────────────── */
    const handleNew = useCallback(() => {
        if (content && !window.confirm('Discard current content and start fresh?')) return;
        setContent(STARTER_TEMPLATE);
        setFilename('untitled.md');
    }, [content]);

    /* ── Insert text at cursor ─────────────── */
    const insertAt = useCallback((before, after = '') => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = content.slice(start, end);
        const newText = content.slice(0, start) + before + selected + after + content.slice(end);
        setContent(newText);
        setTimeout(() => {
            ta.focus();
            ta.selectionStart = start + before.length;
            ta.selectionEnd = start + before.length + selected.length;
        }, 0);
    }, [content]);

    /* ── Copy to clipboard ─────────────────── */
    const handleCopy = useCallback(async () => {
        if (!content) return;
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [content]);

    /* ── Export HTML ───────────────────────── */
    const exportHtml = useCallback(() => {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${filename || 'Markdown Export'}</title>
<style>
body { max-width: 800px; margin: 40px auto; padding: 20px; font-family: system-ui, sans-serif; line-height: 1.7; color: #24292f; }
code { background: #f6f8fa; border-radius: 4px; padding: 0.2em 0.4em; font-family: monospace; }
pre { background: #f6f8fa; border-radius: 6px; padding: 16px; overflow: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #d1d5db; margin: 0; padding: 0 1em; color: #6b7280; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #d1d5db; padding: 8px 12px; }
th { background: #f6f8fa; font-weight: 600; }
img { max-width: 100%; }
hr { border: none; border-top: 1px solid #d1d5db; margin: 24px 0; }
</style>
</head>
<body>
${renderedHtml}
</body>
</html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (filename || 'document').replace(/\.(md|markdown)$/i, '') + '.html';
        a.click();
        URL.revokeObjectURL(url);
    }, [renderedHtml, filename]);

    /* ── Export Markdown ───────────────────── */
    const exportMd = useCallback(() => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'document.md';
        a.click();
        URL.revokeObjectURL(url);
    }, [content, filename]);

    /* ── Toolbar actions ───────────────────── */
    const TOOLBAR_ACTIONS = [
        { icon: <Bold size={14} />, label: 'Bold', action: () => insertAt('**', '**') },
        { icon: <Italic size={14} />, label: 'Italic', action: () => insertAt('*', '*') },
        { icon: <Code size={14} />, label: 'Inline Code', action: () => insertAt('`', '`') },
        { icon: <Hash size={14} />, label: 'Heading', action: () => insertAt('## ') },
        { icon: <Link size={14} />, label: 'Link', action: () => insertAt('[', '](url)') },
        { icon: <Quote size={14} />, label: 'Blockquote', action: () => insertAt('> ') },
        { icon: <List size={14} />, label: 'Bullet List', action: () => insertAt('- ') },
        { icon: <ListOrdered size={14} />, label: 'Numbered List', action: () => insertAt('1. ') },
        { icon: <Table size={14} />, label: 'Table', action: () => insertAt('\n| Col 1 | Col 2 | Col 3 |\n|-------|-------|-------|\n| Cell  | Cell  | Cell  |\n') },
        { icon: <Minus size={14} />, label: 'Divider', action: () => insertAt('\n---\n') },
        { icon: <FileCode size={14} />, label: 'Code Block', action: () => insertAt('\n```js\n', '\n```\n') },
    ];

    /* ── No content → upload zone ─────────── */
    if (!content) {
        return (
            <div
                className="mdv-root"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {isDragging && (
                    <div className="mdv-drop-overlay">
                        <div className="mdv-drop-overlay-inner">
                            <FileUp size={48} />
                            <h3>Drop Markdown File</h3>
                            <p>.md · .markdown · .txt · .mdx</p>
                        </div>
                    </div>
                )}
                <div className="mdv-upload-zone">
                    <div className="mdv-upload-card">
                        <div className="mdv-upload-icon">
                            <FileText size={34} />
                        </div>
                        <h3>Markdown Viewer</h3>
                        <p>Open a Markdown file to view and edit with live GitHub-style preview, or start a new document.</p>
                        <div>
                            <button
                                className="mdv-upload-btn"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={14} />
                                Open File
                            </button>
                            <button className="mdv-new-doc-btn" onClick={handleNew}>
                                <PenLine size={13} />
                                New Doc
                            </button>
                        </div>
                        <p style={{ marginTop: 16, fontSize: 11, color: '#334155' }}>
                            or drag &amp; drop a file anywhere
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".md,.markdown,.txt,.mdx"
                            hidden
                            onChange={(e) => loadFile(e.target.files[0])}
                        />
                    </div>
                </div>
            </div>
        );
    }

    /* ── Main editor ───────────────────────── */
    return (
        <div
            className="mdv-root"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {isDragging && (
                <div className="mdv-drop-overlay">
                    <div className="mdv-drop-overlay-inner">
                        <FileUp size={48} />
                        <h3>Drop to Open</h3>
                        <p>.md · .markdown · .txt · .mdx</p>
                    </div>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="mdv-toolbar">
                <div className="mdv-toolbar-title">
                    <div className="tool-icon"><FileText size={15} /></div>
                    <span>Markdown</span>
                </div>

                <div className="mdv-toolbar-sep" />

                {/* Formatting buttons */}
                {TOOLBAR_ACTIONS.map((act, i) => (
                    <button
                        key={i}
                        className="mdv-tool-btn icon-only"
                        onClick={act.action}
                        title={act.label}
                        aria-label={act.label}
                    >
                        {act.icon}
                    </button>
                ))}

                <div className="mdv-toolbar-sep" />

                {/* Open file */}
                <button
                    className="mdv-tool-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Open Markdown file"
                >
                    <Upload size={13} />
                    Open
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.markdown,.txt,.mdx"
                    hidden
                    onChange={(e) => loadFile(e.target.files[0])}
                />

                {/* Export */}
                <button className="mdv-tool-btn" onClick={exportMd} title="Download as .md">
                    <Download size={13} />
                    .md
                </button>
                <button className="mdv-tool-btn" onClick={exportHtml} title="Export as HTML">
                    <Download size={13} />
                    HTML
                </button>

                {/* Copy */}
                <button
                    className={`mdv-tool-btn ${copied ? 'success' : ''}`}
                    onClick={handleCopy}
                    title="Copy markdown source"
                >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>

                {/* New / Clear */}
                <button
                    className="mdv-tool-btn danger"
                    onClick={() => { if (window.confirm('Clear content?')) { setContent(''); setFilename(''); } }}
                    title="Clear content"
                >
                    <Trash2 size={13} />
                    Clear
                </button>

                {/* View switcher */}
                <div className="mdv-view-switcher">
                    {[
                        { id: 'editor', label: 'Editor', icon: <PenLine size={13} /> },
                        { id: 'split',  label: 'Split',  icon: <Columns size={13} /> },
                        { id: 'preview',label: 'Preview',icon: <Eye size={13} /> },
                    ].map(v => (
                        <button
                            key={v.id}
                            id={`mdv-view-${v.id}`}
                            className={`mdv-view-btn ${view === v.id ? 'active' : ''}`}
                            onClick={() => setView(v.id)}
                            aria-pressed={view === v.id}
                        >
                            {v.icon}
                            <span>{v.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Stats Bar ── */}
            <div className="mdv-stats-bar">
                {filename && (
                    <div className="mdv-filename-badge">
                        <FileText size={10} />
                        {filename}
                    </div>
                )}
                <div className="mdv-stat-item">
                    Words: <span className="val">{stats.words.toLocaleString()}</span>
                </div>
                <div className="mdv-stat-item">
                    Chars: <span className="val">{stats.chars.toLocaleString()}</span>
                </div>
                <div className="mdv-stat-item">
                    Lines: <span className="val">{stats.lines.toLocaleString()}</span>
                </div>
                <div className="mdv-stat-item">
                    Read: <span className="val">{stats.readTime} min</span>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="mdv-body">
                {/* Editor pane */}
                {(view === 'editor' || view === 'split') && (
                    <div className="mdv-editor-pane">
                        <div className="mdv-pane-header">
                            <div className="mdv-pane-title">
                                <PenLine size={12} />
                                Editor
                            </div>
                            <span style={{ fontSize: 10, color: '#1e293b', fontWeight: 700 }}>
                                .MD SOURCE
                            </span>
                        </div>
                        <div className="mdv-editor-inner">
                            <LineNums text={content} />
                            <textarea
                                ref={textareaRef}
                                id="mdv-editor-textarea"
                                className="mdv-textarea"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="# Start writing Markdown here..."
                                spellCheck={false}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                            />
                        </div>
                    </div>
                )}

                {/* Preview pane */}
                {(view === 'preview' || view === 'split') && (
                    <div className="mdv-preview-pane">
                        <div className="mdv-pane-header">
                            <div className="mdv-pane-title mdv-pane-title-preview">
                                <Eye size={12} />
                                Preview
                            </div>
                            <span style={{ fontSize: 10, color: isRendering ? '#facc15' : '#1e293b', fontWeight: 700, transition: 'color 0.2s' }}>
                                {isRendering ? 'Updating…' : 'GFM RENDER'}
                            </span>
                        </div>
                        <div className="mdv-preview-scroll">
                            {renderedHtml ? (
                                <div
                                    className="mdv-preview-content"
                                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                />
                            ) : (
                                <div className="mdv-empty-preview">
                                    <Eye size={48} style={{ opacity: 0.15 }} />
                                    <h4>Preview is empty</h4>
                                    <p>Start typing in the editor to see a live render here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
