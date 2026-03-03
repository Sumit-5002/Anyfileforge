import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { FileSpreadsheet, CheckCircle, FileText } from 'lucide-react';

function PdfToExcelTool({ tool, onFilesAdded }) {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);

    const handleFilesSelected = (files) => {
        setFile(files[0]);
        setDone(false);
        if (onFilesAdded) onFilesAdded(files);
    };

    const handleProcess = async () => {
        if (!file) return;
        setProcessing(true);
        try {
            await pdfService.pdfToExcel(file);
            setDone(true);
        } catch (error) {
            console.error('PDF to Excel error:', error);
            alert('Failed to extract data from PDF.');
        } finally {
            setProcessing(false);
        }
    };

    if (!file) {
        return <FileUploader tool={tool} onFilesSelected={handleFilesSelected} multiple={false} />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={[file]}
            onFilesSelected={handleFilesSelected}
            onReset={() => { setFile(null); setDone(false); }}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Extract Excel Data"
            sidebarTitle="Export Settings"
            sidebar={
                <div className="sidebar-info">
                    <p className="tool-help">
                        This tool extracts text rows from your PDF and converts them into an editable Excel (.xlsx) spreadsheet.
                    </p>
                    <div className="mt-3 d-flex align-items-center gap-2">
                        <FileSpreadsheet size={20} className="text-primary" />
                        <span className="small">Ready to process {file.name}</span>
                    </div>
                </div>
            }
        >
            <div className="files-list-view" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? (
                    <div className="fade-in text-center">
                        <CheckCircle size={64} className="text-success mb-3" />
                        <h3>Extraction Complete!</h3>
                        <p className="text-muted">Your Excel file has been generated.</p>
                    </div>
                ) : (
                    <div className="file-item-horizontal w-full" style={{ maxWidth: '500px' }}>
                        <FileText size={24} className="text-primary" />
                        <div className="file-item-info">
                            <div className="file-item-name">{file.name}</div>
                            <div className="file-item-size">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
}

export default PdfToExcelTool;
