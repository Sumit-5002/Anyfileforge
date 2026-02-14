import React, { useEffect, useState } from 'react';
import { FolderPlus, Folder, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import projectService from '../../services/projectService';
import './ProjectsPage.css';

function ProjectsPage() {
    const { user, loading } = useAuth();
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            if (!user) return;
            const data = await projectService.listProjectsForUser(user.uid);
            setProjects(data);
        };
        load();
    }, [user]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError('');
        try {
            await projectService.createProject({
                name,
                description,
                ownerId: user.uid
            });
            setName('');
            setDescription('');
            const data = await projectService.listProjectsForUser(user.uid);
            setProjects(data);
        } catch {
            setError('Could not create project. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    if (!user) {
        return (
            <div className="projects-page">
                <div className="container">
                    <div className="projects-empty">
                        <h1>Projects</h1>
                        <p>Login to create and manage projects.</p>
                        <div className="projects-actions">
                            <Link to="/login" className="btn btn-primary">Login</Link>
                            <Link to="/signup" className="btn btn-secondary">Create Account</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="projects-page">
            <div className="container">
                <div className="projects-header">
                    <div>
                        <h1>Projects</h1>
                        <p>Create research and engineering workspaces.</p>
                    </div>
                    <div className="projects-count">{projects.length} projects</div>
                </div>

                <div className="projects-grid">
                    <form className="project-card create-card" onSubmit={handleCreate}>
                        <div className="create-header">
                            <FolderPlus size={22} />
                            <h3>New Project</h3>
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Project name"
                            required
                        />
                        <textarea
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description"
                        />
                        <button className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader className="spinning" size={16} /> : 'Create'}
                        </button>
                        {error && <p className="projects-error">{error}</p>}
                    </form>

                    {projects.map((project) => (
                        <div key={project.id} className="project-card">
                            <div className="project-icon">
                                <Folder size={20} />
                            </div>
                            <h3>{project.name}</h3>
                            <p>{project.description || 'No description yet.'}</p>
                            <div className="project-meta">
                                <span>Members: {project.memberIds?.length || 1}</span>
                                <span>Owner</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ProjectsPage;
