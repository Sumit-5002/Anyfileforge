import { Presentation, FileEdit, FileSearch, Globe, Zap, Activity, FileCode, Link, Database, FileSpreadsheet } from 'lucide-react';

const RESEARCHER_TOOLS = [
    {
        category: 'Data Analysis',
        tools: [
            { 
                id: 'csv-plotter', 
                name: 'CSV Plotter', 
                description: 'Create instant charts from CSV.', 
                icon: Presentation, color: '#FF9900',
                about: 'The CSV Plotter engine performs on-the-fly row parsing and statistical distribution mapping. It supports high-density datasets by utilizing optimized render loops.',
                privacy: 'All spreadsheet data is processed in-memory using local workers. No data is cached or transmitted to any external API.'
            },
            { 
                id: 'latex-editor', 
                name: 'LaTeX Editor', 
                description: 'Write and compile LaTeX snippets.', 
                icon: FileEdit, color: '#008080',
                about: 'A standalone TeX environment featuring real-time preview and multi-system exports. Ideal for scientific manuscript drafting without requiring heavy local installations.',
                privacy: 'Your document source code remains strictly local to your browser session. Exports are generated via client-side PDF/HTML libraries.'
            },
            { 
                id: 'bibtex-manager', 
                name: 'BibTeX Manager', 
                description: 'Organize your citations easily.', 
                icon: FileSearch, color: '#777777',
                about: 'A specialized management engine for .bib databases. It validates citation syntax, parses entry fields, and enables bulk transformations to CSV and JSON formats.',
                privacy: 'Citation registry is stored in volatile memory and purged on refresh. No user-specific data is collected or tracked.'
            },
            { 
                id: 'netcdf-viewer', 
                name: 'NetCDF Viewer', 
                description: 'Plot NetCDF variables.', 
                icon: Globe, color: '#09c1d5', accept: '.nc',
                about: 'Scientific multidimensional array viewer. It reads NetCDF-3/4 binary formats to visualize atmospheric, oceanographic, and geospatial data variables.',
                privacy: 'Binary stream processing happens locally. Huge datasets are sliced via TypedArrays to prevent memory overflow and ensure data residency.'
            },
            { 
                id: 'fastq-viewer', 
                name: 'FASTQ QC', 
                description: 'Quality control for sequences.', 
                icon: Zap, color: '#ec4899', accept: '.fastq,.fq',
                about: 'High-throughput sequencing QA engine. It calculates Phred quality scores, GC bias, and sequence length distributions for genomic libraries.',
                privacy: 'Genomic sequences are processed via streaming readers. Sensitive genetic data never leaves your workstation.'
            },
            { 
                id: 'fasta-analyzer', 
                name: 'FASTA Analyzer', 
                description: 'Calculate sequence stats.', 
                icon: Activity, color: '#3b82f6', accept: '.fasta,.fa,.fna',
                about: 'Genomic assembly analytics. It provides N50/L50 metrics, base-pair composition, and structural distribution for FASTA-formatted sequences.',
                privacy: 'Sequence analysis is 100% offline. We do not store or transmit any biological sequence data.'
            },
            { 
                id: 'ipynb-to-pdf', 
                name: 'Jupyter to PDF', 
                description: 'Convert notebooks to clean PDFs.', 
                icon: FileCode, color: '#f59e0b', accept: '.ipynb' 
            },
            { 
                id: 'doi-to-bibtex', 
                name: 'DOI to BibTeX', 
                description: 'Fetch citations in bulk.', 
                icon: Link, color: '#14b8a6', accept: 'text/plain' 
            },
            { 
                id: 'hdf5-viewer', 
                name: 'HDF5 Viewer', 
                description: 'Browse HDF5 groups & arrays.', 
                icon: Database, color: '#10b981', accept: '.h5,.hdf5',
                about: 'HDF5 structure explorer. It navigates hierarchical datasets and visualizes large-scale numerical arrays using optimized canvas rendering.',
                privacy: 'Binary archive traversal is performed locally using jsfive. No internal data structures are exposed to the internet.'
            },
            { 
                id: 'parquet-viewer', 
                name: 'Parquet Viewer', 
                description: 'View columnar data locally.', 
                icon: FileSpreadsheet, color: '#f59e0b', accept: '.parquet',
                about: 'Columnar data analysis suite. It utilizes any SQL engine over Parquet streams to enable complex queries directly on huge flat-file datasets.',
                privacy: 'SQL execution and row extraction are performed using browser-bound WebAssembly. Your data privacy is guaranteed.'
            },
             { 
                id: 'pcap-analyzer', 
                name: 'PCAP Analyzer', 
                description: 'Analyze captures offline.', 
                icon: Activity, color: '#6366f1', accept: '.pcap,.cap',
                about: 'Network trace forensic tool. It performs deep packet inspection (DPI) on PCAP files to extract flow metadata and hex payloads.',
                privacy: 'Network traffic traces remain local. No packet headers or payloads are uploaded to external services.'
            },
            { id: 'mat-viewer', name: 'MAT Viewer', description: 'Load MATLAB workspaces.', icon: Database, color: '#ec4899', accept: '.mat' }
        ]
    }
];

export default RESEARCHER_TOOLS;
