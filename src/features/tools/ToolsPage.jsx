import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolCard from '../../components/ui/ToolCard';
import { TOOLS } from '../../data/toolsData';
import { Zap, Globe, LayoutGrid, FileText, ImageIcon, Code2, Microscope, Search } from 'lucide-react';
import './ToolsPage.css';

function ToolsPage() {
    const navigate = useNavigate();
    const [modeFilter, setModeFilter] = useState('all');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const mainCategories = [
        { id: 'all', name: 'All Modules', icon: <LayoutGrid size={18}/> },
        { id: 'pdf', name: 'PDF System', icon: <FileText size={18}/> },
        { id: 'image', name: 'Visual Processing', icon: <ImageIcon size={18}/> },
        { id: 'engineer', name: 'Engineering Toolkit', icon: <Code2 size={18}/> },
        { id: 'researcher', name: 'Scientific Research', icon: <Microscope size={18}/> }
    ];

    const filteredSections = useMemo(() => {
        const result = [];
        const typeNames = {
            pdf: 'PDF System',
            image: 'Visual Processing',
            engineer: 'Engineering Toolkit',
            researcher: 'Scientific Research'
        };

        Object.entries(TOOLS).forEach(([type, categories]) => {
            if (activeCategory !== 'all' && activeCategory !== type) return;

            categories.forEach(cat => {
                const tools = cat.tools.filter(tool => {
                    const matchesMode = modeFilter === 'all' || tool.mode === modeFilter;
                    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesMode && matchesSearch;
                });

                if (tools.length > 0) {
                    result.push({
                        id: `${type}-${cat.category}`,
                        title: `${typeNames[type] || type.toUpperCase()} - ${cat.category}`,
                        tools
                    });
                }
            });
        });
        return result;
    }, [activeCategory, modeFilter, searchQuery]);

    return (
        <div className="tools-page bg-mesh min-h-screen">
            <div className="container mx-auto px-4 py-8 md:py-16">
                <div className="page-header mb-12 fade-in">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white mb-6 uppercase">
                            Engine_<span className="text-primary-500">Core</span>
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10">
                            High-fidelity file processing ecosystem for researchers and developers.
                            Select a module to begin local transformation.
                        </p>

                        <div className="search-bar-container max-w-md mx-auto mb-12 relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20}/>
                            <input
                                type="text"
                                placeholder="Search tool by name or capability..."
                                className="w-full bg-slate-900 border border-white/5 rounded-3xl py-4 pl-14 pr-6 text-white text-sm focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none shadow-2xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="tabs-container overflow-x-auto scroll-premium pb-4 flex items-center justify-center gap-2 md:gap-4 no-scrollbar">
                            {mainCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-black italic uppercase text-[10px] tracking-widest border
                                        ${activeCategory === cat.id
                                            ? 'bg-primary-500 text-white border-primary-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {cat.icon}
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 mb-16 fade-in scale-in">
                    <div className="mode-filter p-1.5 bg-slate-900 rounded-[24px] border border-white/5 flex gap-1">
                        {[
                            { id: 'all', label: 'ALL_SYNC', icon: <LayoutGrid size={12}/> },
                            { id: 'serverless', label: 'OFFLINE', icon: <Zap size={12}/> },
                            { id: 'server', label: 'CLOUD', icon: <Globe size={12}/> }
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setModeFilter(m.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-[18px] transition-all text-[9px] font-black uppercase tracking-[2px]
                                    ${modeFilter === m.id ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {m.icon}
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="tools-sections-wrapper space-y-24">
                    {filteredSections.length > 0 ? (
                        filteredSections.map((section) => (
                            <section key={section.id} className="tool-category animate-in fade-in slide-in-from-bottom-8">
                                <div className="category-header flex items-center gap-4 mb-10 px-4">
                                    <div className="h-[1px] flex-grow bg-white/5"></div>
                                    <h2 className="text-sm font-black italic uppercase tracking-[4px] text-slate-500 text-center">{section.title}</h2>
                                    <div className="h-[1px] flex-grow bg-white/5"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                                    {section.tools.map((tool) => (
                                        <ToolCard
                                            key={tool.id}
                                            tool={tool}
                                            onClick={() => navigate(`/tools/${tool.id}`)}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    ) : (
                        <div className="empty-results flex flex-col items-center justify-center py-24 text-center fade-in">
                            <div className="p-8 bg-slate-900 rounded-full border border-white/5 mb-6"><Search size={48} className="text-slate-700"/></div>
                            <h3 className="text-xl font-black italic text-white mb-2 uppercase">Zero Results Found</h3>
                            <p className="text-slate-500 max-w-xs">No active modules match your current configuration or search query.</p>
                            <button
                                onClick={() => { setActiveCategory('all'); setModeFilter('all'); setSearchQuery(''); }}
                                className="mt-8 text-primary-400 font-bold hover:text-primary-300 underline"
                            >
                                Reset All Parameters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ToolsPage;
