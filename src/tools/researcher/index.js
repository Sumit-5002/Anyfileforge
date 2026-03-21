import { Presentation, FileEdit, FileSearch, Globe, Zap, Activity, FileCode, Link, Database, FileSpreadsheet } from 'lucide-react';

const RESEARCHER_TOOLS = [
    {
        category: 'Data Analysis',
        tools: [
            { id: 'csv-plotter', name: 'CSV Plotter', description: 'Create instant charts from CSV.', icon: Presentation, color: '#FF9900' },
            { id: 'latex-editor', name: 'LaTeX Editor', description: 'Write and compile LaTeX snippets.', icon: FileEdit, color: '#008080' },
            { id: 'bibtex-manager', name: 'BibTeX Manager', description: 'Organize your citations easily.', icon: FileSearch, color: '#777777' },
            { id: 'netcdf-viewer', name: 'NetCDF Viewer', description: 'Plot NetCDF variables.', icon: Globe, color: '#09c1d5', accept: '.nc' },
            { id: 'fastq-viewer', name: 'FASTQ QC', description: 'Quality control for sequences.', icon: Zap, color: '#ec4899', accept: '.fastq,.fq' },
            { id: 'fasta-analyzer', name: 'FASTA Analyzer', description: 'Calculate sequence stats.', icon: Activity, color: '#3b82f6', accept: '.fasta,.fa,.fna' },
            { id: 'ipynb-to-pdf', name: 'Jupyter to PDF', description: 'Convert notebooks to clean PDFs.', icon: FileCode, color: '#f59e0b', accept: '.ipynb' },
            { id: 'doi-to-bibtex', name: 'DOI to BibTeX', description: 'Fetch citations in bulk.', icon: Link, color: '#14b8a6', accept: 'text/plain' },
            { id: 'hdf5-viewer', name: 'HDF5 Viewer', description: 'Browse HDF5 groups & arrays.', icon: Database, color: '#10b981', accept: '.h5,.hdf5' },
            { id: 'parquet-viewer', name: 'Parquet Viewer', description: 'View columnar data locally.', icon: FileSpreadsheet, color: '#f59e0b', accept: '.parquet' },
            { id: 'pcap-analyzer', name: 'PCAP Analyzer', description: 'Analyze captures offline.', icon: Activity, color: '#6366f1', accept: '.pcap,.cap' },
            { id: 'mat-viewer', name: 'MAT Viewer', description: 'Load MATLAB workspaces.', icon: Database, color: '#ec4899', accept: '.mat' }
        ]
    }
];

export default RESEARCHER_TOOLS;
