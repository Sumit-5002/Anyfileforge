import { FileJson, FileSpreadsheet, FileText, Search, Hash, FileCode } from 'lucide-react';

const ENGINEER_TOOLS = [
    {
        category: 'Code Utilities',
        tools: [
            { id: 'json-formatter', name: 'JSON Formatter', description: 'Validate and beautify JSON data.', icon: FileJson, color: '#F7DF1E' },
            { id: 'code-minifier', name: 'Code Minifier', description: 'Minify JS, CSS, and HTML.', icon: FileCode, color: '#3178C6' },
            { id: 'regex-tester', name: 'Regex Tester', description: 'Test and debug regular expressions.', icon: Search, color: '#DD0031' }
        ]
    },
    {
        category: 'Conversion',
        tools: [
            { id: 'json-to-csv', name: 'JSON to CSV', description: 'Convert JSON data to CSV format.', icon: FileSpreadsheet, color: '#217346' },
            { id: 'markdown-preview', name: 'Markdown Preview', description: 'Visualize Markdown as HTML.', icon: FileText, color: '#facc15' },
            { id: 'base64-encode', name: 'Base64 Encoder', description: 'Encode/Decode Base64 strings.', icon: Hash, color: '#68217A' }
        ]
    }
];

export default ENGINEER_TOOLS;
