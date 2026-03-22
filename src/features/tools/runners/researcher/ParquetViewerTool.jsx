import React, { useState, useEffect } from 'react';
import { useFileList } from '../../../../components/tools/shared/useFileList';
import { parseParquet } from '../../../../services/researcher/parquetService';
import ToolWorkspace from '../common/ToolWorkspace';
import { Download, Table, Info } from 'lucide-react';

const ParquetViewerTool = () => {
    const { files, addFiles } = useFileList();
    const [pqData, setPqData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (files.length > 0) {
            loadFile(files[0].file);
        } else {
            setPqData(null);
            setError('');
        }
    }, [files]);

    const loadFile = async (fileObj) => {
        try {
            setError('');
            const data = await parseParquet(fileObj);
            setPqData(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleExportMetadata = () => {
        if (!pqData) return;
        const metadata = JSON.stringify(pqData.metadata, null, 2);
        const blob = new Blob([metadata], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'parquet_metadata.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ToolWorkspace
            tool={{ name: 'Parquet Viewer' }}
            files={files.map(f => f.file)}
            onFilesSelected={addFiles}
            accept=".parquet"
            dropzoneLabel="Drop your .parquet file here"
            dropzoneHint="Columnar data analysis with HyParquet engine"
            onReset={() => { files.forEach(f => removeFile(f.id)); setPqData(null); setError(''); }}
            sidebar={
                <div className="sidebar-info">
                    {pqData && (
                        <div className="meta-stats mt-4">
                            <h4 style={{ color: 'var(--primary-500)', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Metadata</h4>
                            <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Total Rows:</span>
                                <strong>{pqData.numberOfRows}</strong>
                            </div>
                            <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Row Groups:</span>
                                <strong>{pqData.rowGroups}</strong>
                            </div>
                            
                            <div className="export-actions mt-6">
                                <h4 style={{ marginBottom: '12px' }}>Export</h4>
                                <button className="btn-secondary w-full" onClick={handleExportMetadata} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Download size={16} /> Save Metadata (.json)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <div className="parquet-main" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!pqData ? (
                    <div className="text-center p-8">
                        <Table size={64} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                        <h3>Apache Parquet Reader</h3>
                        <p className="text-muted">Drop a .parquet file here to inspect its columnar storage structure.</p>
                        {error && <div className="error-badge mt-4">{error}</div>}
                    </div>
                ) : (
                    <div className="content-panel fade-in" style={{ width: '100%', padding: '24px' }}>
                        <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Info size={24} className="text-primary" />
                            <h2 style={{ margin: 0 }}>Columnar Schema</h2>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Parsed using the <strong>HyParquet</strong> browser engine. Your data remains 100% private.
                        </p>
                        
                        <div className="schema-table-container mt-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <tr>
                                        <th style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>Column Name</th>
                                        <th style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pqData.metadata.schema.filter(c => c.name !== 'schema').map((col, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '12px 16px', color: 'var(--primary-400)', fontFamily: 'JetBrains Mono, monospace' }}>
                                                {col.name}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                                {col.repetition_type || 'REQUIRED'} / {col.type || 'GROUP'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </ToolWorkspace>
    );
};
export default ParquetViewerTool;
