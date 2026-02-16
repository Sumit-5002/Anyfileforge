import React, { useState } from 'react';
import pdfService from '../../../../services/pdfService';
import FileUploader from '../../../../components/ui/FileUploader';
import ToolWorkspace from '../common/ToolWorkspace';
import { Type, Sun, RotateCw, LayoutGrid } from 'lucide-react';
import PageGrid from '../common/PageGrid';
import '../common/ToolWorkspace.css';

function PdfWatermarkTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [file, setFile] = useState(null);
    const [text, setText] = useState('CONFIDENTIAL');
    const [opacity, setOpacity] = useState(0.2);
    const [angle, setAngle] = useState(30);
    const [size, setSize] = useState(48);
    const [processing, setProcessing] = useState(false);

    const handleFilesSelected = (files) => {
        if (files[0]) setFile(files[0]);
        if (parentOnFilesAdded) parentOnFilesAdded(files);
    };

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const data = await pdfService.addWatermarkText(file, {
                text,
                opacity: Number(opacity),
                angle: Number(angle),
                fontSize: Number(size)
            });
            pdfService.downloadPDF(data, 'watermarked_document.pdf');
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
            onReset={() => setFile(null)}
            processing={processing}
            onProcess={handleProcess}
            actionLabel="Add Watermark"
            sidebar={
                <div className="levels-vertical">
                    <div className="sidebar-label">WATERMARK SETTINGS</div>
                    <div className="tool-field">
                        <label><Type size={14} /> Text Content</label>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="e.g. CONFIDENTIAL"
                        />
                    </div>

                    <div className="tool-field">
                        <label><Type size={14} /> Font Size ({size}px)</label>
                        <input
                            type="range"
                            min="12"
                            max="120"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                        />
                    </div>

                    <div className="tool-inline">
                        <div className="tool-field">
                            <label><Sun size={14} /> Opacity</label>
                            <input
                                type="number"
                                step="0.05"
                                min="0"
                                max="1"
                                value={opacity}
                                onChange={(e) => setOpacity(e.target.value)}
                            />
                        </div>
                        <div className="tool-field">
                            <label><RotateCw size={14} /> Angle</label>
                            <input
                                type="number"
                                value={angle}
                                onChange={(e) => setAngle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="divider mt-4"></div>
                    <div className="sidebar-label">DOCUMENT INFO</div>
                    <div className="order-summary">
                        <div className="summary-row">
                            <span>Filename:</span>
                            <span className="file-item-name" style={{ maxWidth: '140px' }}>{file.name}</span>
                        </div>
                    </div>
                </div>
            }
        >
            <PageGrid file={file} />
        </ToolWorkspace>
    );
}

export default PdfWatermarkTool;
