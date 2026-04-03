import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Play, Plus, Trash2, GripVertical,
    ChevronRight, Zap, Folder, CheckCircle2,
    Clock, AlertTriangle, X, Search, FolderOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import projectService from '../../services/projectService';
import userService from '../../services/userService';
import { TOOLS } from '../../data/toolsData';
import UserAvatar from '../../components/ui/UserAvatar';
import './ProjectDetailPage.css';

/* ── flat list of all tools from toolsData ── */
const ALL_TOOLS = Object.entries(TOOLS).flatMap(([, groups]) =>
    groups.flatMap((g) => g.tools.map((t) => ({ ...t, category: g.category })))
);

const STEP_STATUS = { idle: 'idle', running: 'running', done: 'done', error: 'error' };

function ToolPickerModal({ onSelect, onClose }) {
    const [query, setQuery] = useState('');
    const filtered = query.trim()
        ? ALL_TOOLS.filter(
            (t) =>
                t.name.toLowerCase().includes(query.toLowerCase()) ||
                t.category.toLowerCase().includes(query.toLowerCase())
        )
        : ALL_TOOLS;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="tool-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add a Step</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-search">
                    <Search size={16} />
                    <input
                        autoFocus
                        placeholder="Search tools…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="modal-tool-list">
                    {filtered.map((tool) => (
                        <button
                            key={tool.id}
                            className="modal-tool-item"
                            onClick={() => { onSelect(tool); onClose(); }}
                        >
                            <span className="modal-tool-icon" style={{ background: tool.color + '22', color: tool.color }}>
                                <tool.icon size={16} />
                            </span>
                            <div>
                                <div className="modal-tool-name">{tool.name}</div>
                                <div className="modal-tool-cat">{tool.category}</div>
                            </div>
                            <ChevronRight size={14} className="modal-tool-arrow" />
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <p className="modal-empty">No tools match "{query}"</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function WorkflowStep({ step, index, total, onRemove, onMoveUp, onMoveDown }) {
    const statusIcon = {
        idle: <Clock size={14} />,
        running: <Zap size={14} className="spin" />,
        done: <CheckCircle2 size={14} />,
        error: <AlertTriangle size={14} />,
    }[step.status];

    return (
        <div className={`workflow-step step-${step.status}`}>
            <div className="step-grip"><GripVertical size={16} /></div>
            <div className="step-number">{index + 1}</div>
            <span className="step-icon" style={{ background: step.color + '22', color: step.color }}>
                <step.icon size={16} />
            </span>
            <div className="step-info">
                <div className="step-name">{step.name}</div>
                <div className="step-cat">{step.category}</div>
            </div>
            <div className="step-status-badge">{statusIcon}</div>
            <div className="step-actions">
                <button onClick={() => onMoveUp(index)} disabled={index === 0} title="Move up">↑</button>
                <button onClick={() => onMoveDown(index)} disabled={index === total - 1} title="Move down">↓</button>
                <button onClick={() => onRemove(index)} className="step-remove" title="Remove"><Trash2 size={14} /></button>
            </div>
            {index < total - 1 && <div className="step-connector"><ChevronRight size={14} /></div>}
        </div>
    );
}

export default function ProjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [steps, setSteps] = useState([]);
    const [showPicker, setShowPicker] = useState(false);
    const [runLog, setRunLog] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [wfName, setWfName] = useState('My Workflow');
    const [editingName, setEditingName] = useState(false);
    const [savedWfs, setSavedWfs] = useState([]);
    const [members, setMembers] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteMsg, setInviteMsg] = useState({ text: '', type: '' });

    /* load project */
    useEffect(() => {
        const load = async () => {
            if (!user) return;
            const all = await projectService.listProjectsForUser(user.uid);
            const found = all.find((p) => p.id === id);
            if (!found) { navigate('/projects'); return; }
            setProject(found);
            setSavedWfs(found.workflows || []);
            
            // Load member details
            if (found.memberIds && found.memberIds.length > 0) {
                const details = await userService.getUsersByIds(found.memberIds);
                setMembers(details);
            }
            
            setLoading(false);
        };
        load();
    }, [id, user, navigate]);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim() || inviting) return;
        
        setInviting(true);
        setInviteMsg({ text: '', type: '' });
        try {
            const addedName = await projectService.addMemberToProjectByEmail(id, inviteEmail);
            setInviteMsg({ text: `Successfully added ${addedName}!`, type: 'success' });
            setInviteEmail('');
            
            // Refresh member list
            const updatedProject = await projectService.listProjectsForUser(user.uid).then(all => all.find(p => p.id === id));
            if (updatedProject) {
                setProject(updatedProject);
                const details = await userService.getUsersByIds(updatedProject.memberIds);
                setMembers(details);
            }
        } catch (err) {
            setInviteMsg({ text: err.message || 'Error adding member.', type: 'error' });
        } finally {
            setInviting(false);
        }
    };

    /* add step */
    const addStep = useCallback((tool) => {
        setSteps((prev) => [...prev, { ...tool, status: STEP_STATUS.idle, _key: Date.now() }]);
    }, []);

    /* remove step */
    const removeStep = useCallback((i) => {
        setSteps((prev) => prev.filter((_, idx) => idx !== i));
    }, []);

    /* reorder */
    const moveUp = useCallback((i) => {
        setSteps((prev) => {
            const next = [...prev];
            [next[i - 1], next[i]] = [next[i], next[i - 1]];
            return next;
        });
    }, []);

    const moveDown = useCallback((i) => {
        setSteps((prev) => {
            const next = [...prev];
            [next[i], next[i + 1]] = [next[i + 1], next[i]];
            return next;
        });
    }, []);

    /* simulate running the pipeline */
    const runWorkflow = async () => {
        if (steps.length === 0) return;
        setIsRunning(true);
        setRunLog([]);
        const updated = steps.map((s) => ({ ...s, status: STEP_STATUS.idle }));
        setSteps(updated);

        for (let i = 0; i < updated.length; i++) {
            setSteps((prev) =>
                prev.map((s, idx) => idx === i ? { ...s, status: STEP_STATUS.running } : s)
            );
            setRunLog((prev) => [...prev, { type: 'info', msg: `Running step ${i + 1}: ${updated[i].name}…` }]);

            /* simulate async processing delay */
            await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

            setSteps((prev) =>
                prev.map((s, idx) => idx === i ? { ...s, status: STEP_STATUS.done } : s)
            );
            setRunLog((prev) => [...prev, { type: 'success', msg: `✓ Step ${i + 1} (${updated[i].name}) completed.` }]);
        }

        setRunLog((prev) => [...prev, { type: 'success', msg: '🎉 Workflow completed! Open each tool to process your actual files.' }]);
        setIsRunning(false);
    };

    /* save workflow to Firestore */
    const saveWorkflow = async () => {
        if (steps.length === 0) return;
        const wf = { name: wfName, steps: steps.map((s) => ({ id: s.id, name: s.name, category: s.category, color: s.color })), savedAt: new Date().toISOString() };
        const updated = [...savedWfs, wf];
        await projectService.updateProject(id, { workflows: updated });
        setSavedWfs(updated);
        setRunLog((prev) => [...prev, { type: 'info', msg: `Workflow "${wfName}" saved to project.` }]);
    };

    /* load a saved workflow */
    const loadWorkflow = (wf) => {
        const rebuilt = wf.steps.map((s) => {
            const found = ALL_TOOLS.find((t) => t.id === s.id);
            return found ? { ...found, status: STEP_STATUS.idle, _key: Date.now() + Math.random() } : null;
        }).filter(Boolean);
        setSteps(rebuilt);
        setWfName(wf.name);
        setRunLog([{ type: 'info', msg: `Loaded workflow: "${wf.name}"` }]);
    };

    /* delete saved workflow */
    const deleteWorkflow = async (idx) => {
        const updated = savedWfs.filter((_, i) => i !== idx);
        await projectService.updateProject(id, { workflows: updated });
        setSavedWfs(updated);
    };

    if (loading) return <div className="project-detail-loading"><Zap size={24} className="spin" /> Loading project…</div>;
    if (!project) return null;

    return (
        <div className="project-detail-page bg-mesh">
            {showPicker && <ToolPickerModal onSelect={addStep} onClose={() => setShowPicker(false)} />}

            <div className="container">
                {/* breadcrumb */}
                <div className="pd-breadcrumb">
                    <Link to="/projects" className="pd-back"><ArrowLeft size={16} /> Projects</Link>
                    <ChevronRight size={14} />
                    <span>{project.name}</span>
                </div>

                {/* page header */}
                <div className="pd-header">
                    <div className="pd-header-left">
                        <div className="pd-folder-icon"><FolderOpen size={28} /></div>
                        <div>
                            <h1>{project.name}</h1>
                            <p className="pd-description">{project.description || 'No description.'}</p>
                        </div>
                    </div>
                    <div className="pd-header-meta">
                        <span className="pd-badge">{steps.length} steps</span>
                        <span className="pd-badge secondary">{savedWfs.length} saved workflows</span>
                    </div>
                </div>

                <div className="pd-layout">
                    {/* ── LEFT: Workflow Builder ── */}
                    <section className="pd-workflow-section">
                        <div className="pd-section-header">
                            <div>
                                <h2>⚙️ Workflow Builder</h2>
                                <p>Build a multi-step file processing pipeline. Add tools, reorder them, then run.</p>
                            </div>
                            {editingName ? (
                                <input
                                    className="wf-name-input"
                                    value={wfName}
                                    onChange={(e) => setWfName(e.target.value)}
                                    onBlur={() => setEditingName(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                                    autoFocus
                                />
                            ) : (
                                <button className="wf-name-btn" onClick={() => setEditingName(true)} title="Click to rename">
                                    📝 {wfName}
                                </button>
                            )}
                        </div>

                        {/* step list */}
                        <div className="workflow-steps-list">
                            {steps.length === 0 && (
                                <div className="workflow-empty">
                                    <Folder size={48} />
                                    <p>No steps yet. Add a tool to build your pipeline.</p>
                                </div>
                            )}
                            {steps.map((step, i) => (
                                <WorkflowStep
                                    key={step._key}
                                    step={step}
                                    index={i}
                                    total={steps.length}
                                    onRemove={removeStep}
                                    onMoveUp={moveUp}
                                    onMoveDown={moveDown}
                                />
                            ))}
                        </div>

                        {/* actions */}
                        <div className="workflow-actions">
                            <button className="btn btn-secondary" onClick={() => setShowPicker(true)}>
                                <Plus size={16} /> Add Step
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={runWorkflow}
                                disabled={steps.length === 0 || isRunning}
                            >
                                <Play size={16} /> {isRunning ? 'Running…' : 'Run Workflow'}
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={saveWorkflow}
                                disabled={steps.length === 0}
                            >
                                💾 Save
                            </button>
                            {steps.length > 0 && (
                                <button className="btn btn-ghost danger" onClick={() => { setSteps([]); setRunLog([]); }}>
                                    <Trash2 size={14} /> Clear
                                </button>
                            )}
                        </div>

                        {/* run log */}
                        {runLog.length > 0 && (
                            <div className="run-log">
                                <div className="run-log-header">Run Log</div>
                                {runLog.map((entry, i) => (
                                    <div key={i} className={`log-entry log-${entry.type}`}>{entry.msg}</div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── RIGHT: Saved Workflows + Quick Tools ── */}
                    <aside className="pd-sidebar">
                        {/* Saved workflows */}
                        <div className="pd-card">
                            <h3>💼 Saved Workflows</h3>
                            {savedWfs.length === 0 ? (
                                <p className="sidebar-empty">No saved workflows yet. Build one and click Save.</p>
                            ) : (
                                <ul className="saved-wf-list">
                                    {savedWfs.map((wf, i) => (
                                        <li key={i} className="saved-wf-item">
                                            <div>
                                                <div className="saved-wf-name">{wf.name}</div>
                                                <div className="saved-wf-meta">{wf.steps.length} steps</div>
                                            </div>
                                            <div className="saved-wf-btns">
                                                <button onClick={() => loadWorkflow(wf)} title="Load">Load</button>
                                                <button onClick={() => deleteWorkflow(i)} title="Delete" className="danger-text"><Trash2 size={12} /></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Team management */}
                        <div className="pd-card">
                            <div className="sidebar-card-header">
                                <h3>👥 Manage Team</h3>
                                <span className="member-count-badge">{members.length}</span>
                            </div>
                            
                            <div className="member-list">
                                {members.map(m => (
                                    <div key={m.uid} className="member-item">
                                        <UserAvatar user={{ uid: m.uid, photoURL: m.photoURL }} userData={m} size={24} className="member-avatar" />
                                        <div className="member-info">
                                            <span className="member-name">{m.displayName || 'Member'}</span>
                                            {m.uid === project.ownerId && <span className="owner-label">Owner</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {user?.uid === project.ownerId && (
                                <form className="invite-form" onSubmit={handleInvite}>
                                    <input 
                                        type="email" 
                                        placeholder="Invite by email..." 
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                        disabled={inviting}
                                    />
                                    <button type="submit" className="btn btn-secondary btn-full" disabled={inviting}>
                                        {inviting ? 'Inviting...' : 'Add Member'}
                                    </button>
                                    {inviteMsg.text && (
                                        <p className={`invite-msg ${inviteMsg.type}`}>{inviteMsg.text}</p>
                                    )}
                                </form>
                            )}
                        </div>

                        {/* Quick open tools */}
                        <div className="pd-card">
                            <h3>🚀 Quick Open Tools</h3>
                            <p className="sidebar-empty">Jump directly to any tool page to process your files.</p>
                            <div className="quick-tools-grid">
                                {ALL_TOOLS.slice(0, 8).map((t) => (
                                    <Link
                                        key={t.id}
                                        to={`/tools/${t.id}`}
                                        className="quick-tool-btn"
                                        style={{ '--tool-color': t.color }}
                                        title={t.name}
                                    >
                                        <t.icon size={16} />
                                        <span>{t.name}</span>
                                    </Link>
                                ))}
                            </div>
                            <Link to="/tools" className="btn btn-secondary btn-full" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                                View All Tools →
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
