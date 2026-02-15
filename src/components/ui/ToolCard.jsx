import React from 'react';
import { Crown } from 'lucide-react';
import './ToolCard.css';

function ToolCard({ tool, isSelected, onClick }) {
    const Icon = tool.icon;
    const modeLabel = tool.mode === 'server' ? 'Server' : 'Serverless';
    const modeClass = tool.mode === 'server' ? 'mode-server' : 'mode-serverless';

    return (
        <button
            className={`tool-card card ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
            type="button"
        >
            {tool.mode && (
                <span
                    className={`mode-badge ${modeClass}`}
                    aria-label={tool.mode === 'server' ? 'Requires server mode' : 'Works offline (serverless)'}
                    title={tool.mode === 'server' ? 'Requires server mode' : 'Works offline (serverless)'}
                >
                    {modeLabel}
                </span>
            )}
            {tool.isPro && tool.mode === 'server' && (
                <span className="pro-badge-tool" aria-label="Premium Feature" title="Premium Feature">
                    <Crown size={12} fill="currentColor" aria-hidden="true" aria-label="Premium icon" />
                    <span>PRO</span>
                </span>
            )}
            <span className="tool-icon" style={{ backgroundColor: `${tool.color}15`, color: tool.color }} aria-hidden="true">
                <Icon size={28} />
            </span>
            <h3 className="tool-name">{tool.name}</h3>
            <p className="tool-description">{tool.description}</p>
            {isSelected && (
                <span className="selected-indicator">
                    <span className="badge badge-success">Selected</span>
                </span>
            )}
        </button>
    );
}

export default ToolCard;
