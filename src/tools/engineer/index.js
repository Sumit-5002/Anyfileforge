import { FileJson, FileSpreadsheet, FileText, Search, Hash, FileCode } from 'lucide-react';

const ENGINEER_TOOLS = [
    {
        category: 'Code Utilities',
        tools: [
            { 
                id: 'json-formatter', 
                name: 'JSON Formatter', 
                description: 'Validate and beautify JSON data.', 
                icon: FileJson, color: '#F7DF1E',
                about: 'A low-latency JSON engine for schema validation and tree expansion. It allows engineers to inspect high-load JSON payloads with syntactic highlighting.',
                privacy: 'JSON strings are beautified in the browser memory. No data is logged, and your API keys or sensitive fields remain private.'
            },
            { 
                id: 'code-minifier', 
                name: 'Code Minifier', 
                description: 'Minify JS, CSS, and HTML.', 
                icon: FileCode, color: '#3178C6',
                about: 'High-compression engine for web assets. It strips whitespace, comments, and optimizes code structure for deployment.',
                privacy: 'Source code minimization is calculated locally. No code snippets are cached or transmitted.'
            },
            { 
                id: 'regex-tester', 
                name: 'Regex Tester', 
                description: 'Test and debug regular expressions.', 
                icon: Search, color: '#DD0031',
                about: 'Syntax-aware regular expression debugger. It maps expression flags and quantifiers to help identify match failures.',
                privacy: 'All pattern matching occurs within the browser JavaScript engine.'
            }
        ]
    },
    {
        category: 'Conversion',
        tools: [
            { 
                id: 'json-to-csv', 
                name: 'JSON to CSV', 
                description: 'Convert JSON data to CSV format.', 
                icon: FileSpreadsheet, color: '#217346' 
            },
            { 
                id: 'markdown-preview', 
                name: 'Markdown Preview', 
                description: 'Visualize Markdown as HTML.', 
                icon: FileText, color: '#facc15' 
            },
            { 
                id: 'base64-encode', 
                name: 'Base64 Encoder', 
                description: 'Encode/Decode Base64 strings.', 
                icon: Hash, color: '#68217A' 
            }
        ]
    }
];

export default ENGINEER_TOOLS;
