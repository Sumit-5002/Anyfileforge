import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileSpreadsheet, FileType } from 'lucide-react';
import '../common/ToolWorkspace.css';

function ExcelToPdfTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFilesSelected = (newFiles) => {
        setFiles(prev => [...prev, ...newFiles]);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    };

    const handleProcess = async () => {
        if (files.length === 0) return;
        setProcessing(true);
        setProgress(0);
        try {
            const data = await pdfService.excelToPDF(files, (p) => setProgress(p));
            const outputName = files.length > 1 ? 'Merged_Excel_Docs.pdf' : files[0].name.replace(/\.[^/.]+$/, '') + '.pdf';
            pdfService.downloadPDF(data, outputName);
        } catch (err) {
            console.error('Excel to PDF error:', err);
            alert('Failed to convert Excel to PDF. Please ensure the file is a valid .xlsx or .xls document.');
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={true} accept=".xls,.xlsx" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={files}
            onFilesSelected={handleFilesSelected}
            onReset={() => setFiles([])}
            processing={processing}
            progress={progress}
            onProcess={handleProcess}
            actionLabel={files.length > 1 ? "Merge & Convert to PDF" : "Convert Excel to PDF"}
            sidebar={
                <div className="sidebar-info">
                    <p className="hint-text">This tool converts Excel spreadsheets to PDF directly in your browser. Add multiple files to merge them.</p>
                    <div className="mt-3 d-flex align-items-center gap-2">
                        <FileType className="text-primary" size={20} />
                        <span>Ready to convert <strong>{files.length}</strong> file(s)</span>
                    </div>
                </div>
            }
        >
            <div className="files-list-view">
                {files.map((file, i) => (
                    <div key={i} className="file-item-horizontal">
                        <FileSpreadsheet size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button className="btn-icon-danger" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ExcelToPdfTool;
