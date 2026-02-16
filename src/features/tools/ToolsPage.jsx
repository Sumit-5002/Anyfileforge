import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolCard from '../../components/ui/ToolCard';
import { TOOLS } from '../../data/toolsData';
import './ToolsPage.css';

function ToolsPage() {
    const navigate = useNavigate();
    const [modeFilter, setModeFilter] = useState('all');
    const isGlobalOnline = typeof window !== 'undefined' && window.localStorage.getItem('anyfileforge_mode') === 'online';

    // Flatten the TOOLS object into a renderable list of sections
    const sections = useMemo(() => {
        const result = [];

        // Helper to maps internal keys to Display Names
        const typeNames = {
            pdf: 'PDF Tools',
            image: 'Image Tools',
            engineer: 'Engineer Tools',
            researcher: 'Research Tools'
        };

        Object.entries(TOOLS).forEach(([type, categories]) => {
            const sectionTitle = typeNames[type] || type.toUpperCase();

            // We can either group by the big type (PDF, Image) or show all the sub-categories
            // Let's show the big type as a Header, and then the sub-categories as groups

            // For this design, let's just flatten all sub-categories into one big section per Type?
            // Or keep the granular sub-categories? The design in the original code had 4 main cards.
            // Let's stick to the granular sub-categories because they are more descriptive.

            categories.forEach(cat => {
                const filteredTools = cat.tools.filter((tool) => modeFilter === 'all' || tool.mode === modeFilter);
                if (filteredTools.length === 0) return;
                result.push({
                    name: `${sectionTitle} - ${cat.category}`,
                    description: cat.category,
                    tools: filteredTools
                });
            });
        });

        return result;
    }, [modeFilter]);

    return (
        <div className="tools-page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">All Tools</h1>
                    <p className="page-subtitle">
                        Professional file processing tools for engineers and researchers
                    </p>
                    <div className="mode-filter">
                        <button
                            className={`mode-filter-btn ${modeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setModeFilter('all')}
                        >
                            All Modes
                        </button>
                        <button
                            className={`mode-filter-btn ${modeFilter === 'serverless' ? 'active' : ''}`}
                            onClick={() => setModeFilter('serverless')}
                        >
                            Serverless
                        </button>
                        <button
                            className={`mode-filter-btn ${modeFilter === 'server' ? 'active' : ''}`}
                            onClick={() => setModeFilter('server')}
                        >
                            Server Mode
                        </button>
                    </div>
                </div>

                {sections.map((category, index) => (
                    <section key={index} className="tool-category">
                        <div className="category-header">
                            <h2 className="category-title">{category.name}</h2>
                            {/* <p className="category-description">{category.description}</p> */}
                        </div>
                        <div className="tools-grid">
                            {category.tools.map((tool) => (
                                <ToolCard
                                    key={tool.id}
                                    tool={tool}
                                    onClick={() => navigate(`/tools/${tool.id}`)}
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
