import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import './JsonFormatter.css';

function JsonFormatter() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const formatJson = () => {
        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            setOutput(formatted);
            setError('');
        } catch (err) {
            setError('Invalid JSON: ' + err.message);
            setOutput('');
        }
    };

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setOutput(minified);
            setError('');
        } catch (err) {
            setError('Invalid JSON: ' + err.message);
            setOutput('');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="tool-container">
            <div className="tool-header">
                <h1>JSON Formatter & Validator</h1>
                <p>Beautify, minify, and validate your JSON data</p>
            </div>

            <div className="json-formatter-layout">
                <div className="json-panel">
                    <div className="panel-header">
                        <h3>Input JSON</h3>
                        <div className="button-group">
                            <button className="btn btn-primary" onClick={formatJson}>
                                Format
                            </button>
                            <button className="btn btn-secondary" onClick={minifyJson}>
                                Minify
                            </button>
                        </div>
                    </div>
                    <textarea
                        className="json-textarea"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='{"name": "John", "age": 30}'
                    />
                </div>

                <div className="json-panel">
                    <div className="panel-header">
                        <h3>Output</h3>
                        {output && (
                            <button className="btn btn-icon" onClick={copyToClipboard}>
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        )}
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <textarea
                        className="json-textarea"
                        value={output}
                        readOnly
                        placeholder="Formatted JSON will appear here..."
                    />
                </div>
            </div>
        </div>
    );
}

export default JsonFormatter;
