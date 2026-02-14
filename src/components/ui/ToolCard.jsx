import React from 'react';
import { Crown } from 'lucide-react';
import './ToolCard.css';

function ToolCard({ tool, isSelected, onClick }) {
    const Icon = tool.icon;
    const modeLabel = tool.mode === 'server' ? 'Server' : 'Serverless';
    const modeClass = tool.mode === 'server' ? 'mode-server' : 'mode-serverless';

    return (
        <div
            className={`tool-card card ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onClick()}
        >
            {tool.mode && (
                <div className={`mode-badge ${modeClass}`} title={tool.mode === 'server' ? 'Requires server mode' : 'Works offline (serverless)'}>
                    {modeLabel}
                </div>
            )}
            {tool.isPro && tool.mode === 'server' && (
                <div className="pro-badge-tool" title="Premium Feature">
                    <Crown size={12} fill="currentColor" />
                    <span>PRO</span>
                </div>
            )}
            <div className="tool-icon" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}>
                <Icon size={28} />
            </div>
            <h3 className="tool-name">{tool.name}</h3>
            <p className="tool-description">{tool.description}</p>
            {isSelected && (
                <div className="selected-indicator">
                    <span className="badge badge-success">Selected</span>
                </div>
            )}
        </div>
    );
}

export default ToolCard;
