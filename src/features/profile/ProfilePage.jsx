import React from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, ShieldCheck, LogOut, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './ProfilePage.css';

function ProfilePage() {
    const { user, userData, logout, loading } = useAuth();

    if (loading) return null;

    if (!user) {
        return (
            <div className="profile-page">
                <div className="container">
                    <div className="profile-card">
                        <h1>Profile</h1>
                        <p>You are not logged in.</p>
                        <div className="profile-actions">
                            <Link to="/login" className="btn btn-primary">Login</Link>
                            <Link to="/signup" className="btn btn-secondary">Create Account</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            <User size={40} />
                        </div>
                        <div>
                            <h1>{userData?.displayName || user.displayName || 'Forge Member'}</h1>
                            <p className="profile-subtitle">Research & Engineering Member</p>
                        </div>
                    </div>

                    <div className="profile-grid">
                        <div className="profile-item">
                            <Mail size={24} />
                            <div>
                                <span className="label">Account Email</span>
                                <span className="value text-glow">{user.email || '—'}</span>
                            </div>
                        </div>
                        <div className="profile-item">
                            <ShieldCheck size={24} />
                            <div>
                                <span className="label">Access Role</span>
                                <span className="value">{userData?.role || 'Member'}</span>
                            </div>
                        </div>
                        <div className="profile-item">
                            <Crown size={24} />
                            <div>
                                <span className="label">Current Tier</span>
                                <span className="value" style={{ textTransform: 'uppercase' }}>{userData?.tier || 'free'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <Link to="/pricing" className="btn btn-secondary">Manage Plan</Link>
                        <button className="btn btn-primary" onClick={logout}>
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
