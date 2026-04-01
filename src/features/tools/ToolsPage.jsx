import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolCard from '../../components/ui/ToolCard';
import { TOOLS } from '../../data/toolsData';
import { LayoutGrid, FileText, ImageIcon, Code2, Microscope, Search } from 'lucide-react';
import '../home/HomePage.css';
import './ToolsPage.css';

function ToolsPage() {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const mainCategories = [
        { id: 'all', name: 'All Tools', icon: <LayoutGrid size={20} /> },
        { id: 'pdf', name: 'PDF Tools', icon: <FileText size={20} /> },
        { id: 'image', name: 'Image Tools', icon: <ImageIcon size={20} /> },
        { id: 'engineer', name: 'Engineer', icon: <Code2 size={20} /> },
        { id: 'researcher', name: 'Researcher', icon: <Microscope size={20} /> }
    ];

    const filteredSections = useMemo(() => {
        const result = [];
        const typeNames = {
            pdf: 'PDF',
            image: 'Image',
            engineer: 'Engineer',
            researcher: 'Researcher'
        };

        Object.entries(TOOLS).forEach(([type, categories]) => {
            if (activeCategory !== 'all' && activeCategory !== type) return;

            categories.forEach((cat) => {
                const tools = cat.tools.filter((tool) => {
                    const q = searchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
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
    }, [activeCategory, searchQuery]);

    return (
        <div className="home-page bg-mesh tools-page">
            <section className="tools-showcase bg-grid">
                <div className="container">
                    <div className="showcase-header">
                        <h1 className="section-title text-center">All Offline Tools</h1>
                        <p className="section-subtitle text-center">
                            Offline Mode (Local) is free forever and files stay on your device. Online Mode (Server) is under development.
                            It will include cloud-source uploads (Drive, Dropbox, OneDrive), support for very large files, advanced server-side
                            processing, and optional paid server storage only if you choose retention.
                        </p>

                        <div className="tools-page-search">
                            <Search className="tools-page-search__icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search tools..."
                                className="tools-page-search__input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="tab-switcher tools-page-tabs">
                            {mainCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                >
                                    {cat.icon}
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredSections.length > 0 ? (
                        filteredSections.map((section) => (
                            <div key={section.id} className="tool-category-group fade-in">
                                <h3 className="category-title">{section.title}</h3>
                                <div className="tools-grid">
                                    {section.tools.map((tool) => (
                                        <ToolCard
                                            key={tool.id}
                                            tool={{ ...tool, mode: 'serverless' }}
                                            onClick={() => navigate(`/tools/${tool.id}?mode=offline`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="tools-page-empty card">
                            <Search size={36} />
                            <h3>No tools found</h3>
                            <p>Try another keyword or switch category.</p>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setActiveCategory('all');
                                    setSearchQuery('');
                                }}
                            >
                                Reset filters
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default ToolsPage;
