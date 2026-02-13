import React from 'react';
import {
    FileText, Image, FileSpreadsheet, FileCode,
    Database, Scissors, Combine, Minimize2, FileType,
    ImagePlus, Crop, Palette, FileJson, Table
} from 'lucide-react';
import ToolCard from '../components/ToolCard';
import './ToolsPage.css';

function ToolsPage() {
    const toolCategories = [
        {
            name: 'PDF Tools',
            description: 'Comprehensive PDF processing utilities',
            tools: [
                { id: 'pdf-merge', name: 'Merge PDF', description: 'Combine multiple PDFs', icon: Combine, color: '#ef4444' },
                { id: 'pdf-split', name: 'Split PDF', description: 'Extract pages', icon: Scissors, color: '#f59e0b' },
                { id: 'pdf-compress', name: 'Compress PDF', description: 'Reduce file size', icon: Minimize2, color: '#10b981' },
                { id: 'pdf-convert', name: 'Convert PDF', description: 'PDF to Word/Excel/Image', icon: FileType, color: '#3b82f6' }
            ]
        },
        {
            name: 'Image Tools',
            description: 'Image conversion and optimization',
            tools: [
                { id: 'img-convert', name: 'Convert Image', description: 'Change format (JPG, PNG, WebP)', icon: Image, color: '#8b5cf6' },
                { id: 'img-compress', name: 'Compress Image', description: 'Reduce image size', icon: Minimize2, color: '#ec4899' },
                { id: 'img-resize', name: 'Resize Image', description: 'Change dimensions', icon: Crop, color: '#06b6d4' },
                { id: 'img-enhance', name: 'Enhance Image', description: 'Adjust colors & quality', icon: Palette, color: '#14b8a6' }
            ]
        },
        {
            name: 'Document Tools',
            description: 'Office document conversion',
            tools: [
                { id: 'doc-convert', name: 'Convert Document', description: 'DOCX, XLSX, PPTX', icon: FileSpreadsheet, color: '#f59e0b' },
                { id: 'doc-pdf', name: 'Document to PDF', description: 'Convert to PDF', icon: FileText, color: '#ef4444' },
                { id: 'pdf-doc', name: 'PDF to Document', description: 'PDF to Word/Excel', icon: FileType, color: '#10b981' }
            ]
        },
        {
            name: 'Data Tools',
            description: 'Data format conversion for researchers',
            tools: [
                { id: 'json-convert', name: 'JSON Tools', description: 'JSON/YAML/XML conversion', icon: FileJson, color: '#06b6d4' },
                { id: 'csv-convert', name: 'CSV Tools', description: 'CSV/Excel conversion', icon: Table, color: '#14b8a6' },
                { id: 'data-format', name: 'Data Formats', description: 'HDF5, Parquet, NetCDF', icon: Database, color: '#8b5cf6' },
                { id: 'code-format', name: 'Code Tools', description: 'LaTeX, BibTeX, Jupyter', icon: FileCode, color: '#ec4899' }
            ]
        }
    ];

    return (
        <div className="tools-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">All Tools</h1>
                    <p className="page-subtitle">
                        Professional file processing tools for engineers and researchers
                    </p>
                </div>

                {toolCategories.map((category, index) => (
                    <section key={index} className="tool-category">
                        <div className="category-header">
                            <h2 className="category-title">{category.name}</h2>
                            <p className="category-description">{category.description}</p>
                        </div>
                        <div className="tools-grid">
                            {category.tools.map((tool) => (
                                <ToolCard
                                    key={tool.id}
                                    tool={tool}
                                    onClick={() => console.log('Tool selected:', tool.name)}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

export default ToolsPage;
