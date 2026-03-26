import React, { useState, useCallback } from 'react';
import imageService from '../../../../services/imageService';
import serverProcessingService from '../../../../services/serverProcessingService';
import ToolWorkspace from '../common/ToolWorkspace';
import FileUploader from '../../../../components/ui/FileUploader';
import useParallelFileProcessor from '../../../../hooks/useParallelFileProcessor';
import FileThumbnail from '../../../../components/tools/shared/FileThumbnail';
import { Maximize, Settings, ImageIcon, Check, X } from 'lucide-react';
import '../common/ToolWorkspace.css';

const getBaseName = (name) => name.replace(/\.[^/.]+$/, '');

function ImageResizeTool({ tool, onFilesAdded: parentOnFilesAdded }) {
    const [width, setWidth] = useState('1366');
    const [height, setHeight] = useState('768');
    const [unit, setUnit] = useState('px'); // 'px' or 'percent'
    const [keepAspect, setKeepAspect] = useState(true);
    const [noEnlarge, setNoEnlarge] = useState(true);
    const [format, setFormat] = useState('image/jpeg');
    const [quality] = useState(0.9);
    const [results, setResults] = useState([]);

    const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

    const processFile = useCallback(async ({ file }) => {
        const normalizedQuality = Math.min(1, Math.max(0.1, Number(quality)));
        const blob = tool.mode === 'server'
            ? await serverProcessingService.resizeImage(file, {
                width, height, unit, noEnlarge,
                format: format.replace('image/', '')
            })
            : await imageService.resizeImageTo(file, width, height, {
                keep: keepAspect,
                fmt: format,
                q: normalizedQuality,
                noEnlarge,
                unit
            });

        const outName = `${getBaseName(file.name)}_resized.${extension}`;
        setResults(prev => [...prev, {
            id: file.name + Date.now(),
            name: outName,
            data: blob,
            type: 'image'
        }]);
    }, [tool.mode, width, height, unit, noEnlarge, format, keepAspect, quality, extension]);

    const {
        files,
        toolFiles,
        processing,
        progress,
        completedIds,
        failedIds,
        handleFilesSelected,
        removeFile,
        reset,
        processFiles
    } = useParallelFileProcessor(processFile, 5);

    const onFilesSelected = useCallback((newFiles) => {
        handleFilesSelected(newFiles);
        if (parentOnFilesAdded) parentOnFilesAdded(newFiles);
    }, [handleFilesSelected, parentOnFilesAdded]);

    if (files.length === 0) {
        return <FileUploader tool={tool} onFilesSelected={onFilesSelected} multiple={true} accept="image/*" />;
    }

    return (
        <ToolWorkspace
            tool={tool}
            files={toolFiles}
            results={results}
            onFilesSelected={onFilesSelected}
            onReset={() => { reset(); setResults([]); }}
            processing={processing}
            progress={progress}
            onProcess={processFiles}
            actionLabel="Resize IMAGES"
            sidebar={
                <div className="sidebar-settings">
                    <div className="tool-tabs mb-3">
                        <button className={`tool-tab-btn ${unit === 'px' ? 'active' : ''}`} onClick={() => setUnit('px')}>By pixels</button>
                        <button className={`tool-tab-btn ${unit === 'percent' ? 'active' : ''}`} onClick={() => setUnit('percent')}>By percentage</button>
                    </div>

                    <div className="sidebar-label-group">
                        <Maximize size={14} />
                        <label>{unit === 'px' ? 'Dimension' : 'Scale'}</label>
                    </div>

                    <div className="tool-inline mt-2">
                        <div className="tool-field">
                            <label>{unit === 'px' ? 'Width (px)' : 'Percentage'}</label>
                            <input type="number" value={width} onChange={e => setWidth(e.target.value)} />
                        </div>
                        {unit === 'px' && (
                            <div className="tool-field">
                                <label>Height (px)</label>
                                <input type="number" value={height} onChange={e => setHeight(e.target.value)} />
                            </div>
                        )}
                    </div>

                    <div className="tool-field mt-3">
                        <label className="tool-checkbox">
                            <input type="checkbox" checked={keepAspect} onChange={e => setKeepAspect(e.target.checked)} />
                            <span>Keep aspect ratio</span>
                        </label>
                        <label className="tool-checkbox mt-2">
                            <input type="checkbox" checked={noEnlarge} onChange={e => setNoEnlarge(e.target.checked)} />
                            <span>Don't enlarge smaller</span>
                        </label>
                    </div>

                    <div className="sidebar-label-group mt-4">
                        <Settings size={14} />
                        <label>Output Format</label>
                    </div>
                    <div className="tool-field mt-2">
                        <select className="p-3 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-xs w-full" value={format} onChange={e => setFormat(e.target.value)}>
                            <option value="image/jpeg">JPG Output</option>
                            <option value="image/png">PNG Lossless</option>
                            <option value="image/webp">WebP Progressive</option>
                        </select>
                    </div>

                    <div className="sidebar-preflight mt-10 p-5 bg-primary-500/5 rounded-2xl border border-primary-500/10">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-primary-400 mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                            Pre-Flight Check
                        </h5>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-slate-500 uppercase">Input</span>
                                <span className="text-slate-300 font-bold">1st Image</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-slate-500 uppercase">Target</span>
                                <span className="text-primary-400 font-bold">
                                    {unit === 'percent' ? `${width}% Scale` : `${width} × ${height} px`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="text-slate-500 uppercase">Aspect</span>
                                <span className={keepAspect ? 'text-green-500 font-bold' : 'text-slate-500'}>
                                    {keepAspect ? 'Locked' : 'Unlocked'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="workspace-files-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '20px',
                width: '100%'
            }}>
                {files.map(({ id, file }) => (
                    <div key={id} className="file-item-card-compact bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 group hover:border-primary-500/30 transition-all">
                        <div className="flex items-center gap-4">
                            <FileThumbnail file={file} className="w-16 h-16 rounded-xl shadow-lg" />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-100 truncate mb-1">{file.name}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                {completedIds.has(id) ? (
                                    <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest"><Check size={12} /> Done</div>
                                ) : failedIds.has(id) ? (
                                    <div className="text-red-500 text-[10px] font-black uppercase tracking-widest">Error</div>
                                ) : (
                                    <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Queued</div>
                                )}
                            </div>
                            <button
                                className="text-slate-500 hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                                onClick={() => removeFile(id)}
                                disabled={processing}
                                title={`Remove ${file.name}`}
                                aria-label={`Remove ${file.name}`}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToolWorkspace>
    );
}

export default ImageResizeTool;
