import { Presentation, FileEdit, FileSearch } from 'lucide-react';

const RESEARCHER_TOOLS = [
    {
        category: 'Data Analysis',
        tools: [
            { id: 'csv-plotter', name: 'CSV Plotter', description: 'Create instant charts from CSV.', icon: Presentation, color: '#FF9900' },
            { id: 'latex-editor', name: 'LaTeX Editor', description: 'Write and compile LaTeX snippets.', icon: FileEdit, color: '#008080' },
            { id: 'bibtex-manager', name: 'BibTeX Manager', description: 'Organize your citations easily.', icon: FileSearch, color: '#777777' }
        ]
    }
];

export default RESEARCHER_TOOLS;
