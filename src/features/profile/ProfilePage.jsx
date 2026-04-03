import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck, LogOut, Crown, Edit2, Check, X, Building, FlaskConical, Code, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ROUTES from '../../config/routes';
import SeoHead from '../../components/meta/SeoHead';
import userService from '../../services/userService';
import UserAvatar from '../../components/ui/UserAvatar';
import './ProfilePage.css';

/**
 * Generates a deterministic avatar URL using DiceBear Identicons
 * (same concept as GitHub's auto-generated avatars)
 */
function getAvatarUrl(seed) {
    return `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}&backgroundColor=6366f1,8b5cf6,06b6d4&backgroundType=gradientLinear`;
}

/**
 * Returns a display-friendly tier label and color class
 */
function getTierDisplay(tier) {
    switch (tier) {
        case 'supporter': return { label: 'Supporter 💜', cls: 'tier-supporter' };
        case 'enterprise': return { label: 'Guardian 👑', cls: 'tier-guardian' };
        default:          return { label: 'Pioneer 🚀', cls: 'tier-pioneer' };
    }
}

function ProfilePage() {
    const { user, userData, logout, loading } = useAuth();
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [updating, setUpdating] = useState(false);

    const handleUpdateName = async () => {
        if (!nameInput.trim() || nameInput === displayName) {
            setEditingName(false);
            return;
        }

        setUpdating(true);
        try {
            await userService.updateUserProfile(user.uid, { displayName: nameInput.trim() });
            setEditingName(false);
        } catch (error) {
            console.error('Update name error:', error);
            alert('Failed to update name. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    if (!user) {
        return (
            <div className="profile-page">
                <SeoHead title="Profile - AnyFileForge" description="Your AnyFileForge account." />
                <div className="container">
                    <div className="profile-card profile-guest-card">
                        <div className="profile-guest-icon">🔐</div>
                        <h1>You are not signed in</h1>
                        <p>Login or create a free account to track your tier, manage settings, and unlock cloud features.</p>
                        <div className="profile-actions">
                            <Link to={ROUTES.LOGIN} className="btn btn-primary">Login</Link>
                            <Link to={ROUTES.SIGNUP} className="btn btn-secondary">Create Account</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const displayName   = userData?.displayName || user.displayName || 'Forge Member';
    const email         = user.email || '—';
    const role          = userData?.role ? userData.role.replace(/_/g, ' ') : 'Member';
    const institution   = userData?.institution || null;
    const fieldOfStudy  = userData?.fieldOfStudy || null;
    const primaryLang   = userData?.primaryLanguage || null;
    const joinedDate    = userData?.createdAt
        ? new Date(userData.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
        : null;
    const { label: tierLabel, cls: tierCls } = getTierDisplay(userData?.tier);
    const avatarSeed    = user.uid || displayName;
    const photoURL      = user.photoURL || getAvatarUrl(avatarSeed);
    const isAdFree      = userData?.tier === 'supporter' || userData?.tier === 'enterprise';

    return (
        <>
            <SeoHead title={`${displayName} – AnyFileForge`} description="Manage your AnyFileForge profile and subscription." />
            <div className="profile-page">
                <div className="container">

                    {/* Hero Card */}
                    <div className="profile-hero-card card">
                        <div className="profile-avatar-wrap">
                            <UserAvatar user={user} userData={userData} size={120} className="profile-avatar-img" />
                            <span className={`tier-badge-dot ${tierCls}`} title={tierLabel} />
                        </div>

                        <div className="profile-hero-info">
                            <div className="profile-name-row">
                                {editingName ? (
                                    <div className="name-edit-row">
                                        <input
                                            className="name-input"
                                            value={nameInput}
                                            onChange={e => setNameInput(e.target.value)}
                                            autoFocus
                                            disabled={updating}
                                            placeholder="Your display name"
                                            onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                                        />
                                        <button className="icon-btn success" onClick={handleUpdateName} disabled={updating}>
                                            <Check size={16} />
                                        </button>
                                        <button className="icon-btn danger"  onClick={() => setEditingName(false)} disabled={updating}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="profile-name">{displayName}</h1>
                                        <button className="icon-btn muted" onClick={() => { setNameInput(displayName); setEditingName(true); }}>
                                            <Edit2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                            <p className="profile-role-label">{role.charAt(0).toUpperCase() + role.slice(1)}</p>

                            <div className="profile-badges-row">
                                <span className={`profile-tier-pill ${tierCls}`}>{tierLabel}</span>
                                {isAdFree && <span className="profile-badge ad-free">🛡️ Ad-Free</span>}
                                {joinedDate && <span className="profile-badge joined"><Calendar size={12} /> Joined {joinedDate}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="profile-grid-wrap">
                        <div className="profile-info-card card">
                            <h3 className="info-card-title">Account Details</h3>
                            <div className="info-row">
                                <Mail size={18} />
                                <div>
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{email}</span>
                                </div>
                            </div>
                            <div className="info-row">
                                <ShieldCheck size={18} />
                                <div>
                                    <span className="info-label">Access Role</span>
                                    <span className="info-value">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                                </div>
                            </div>
                            <div className="info-row">
                                <Crown size={18} />
                                <div>
                                    <span className="info-label">Subscription Tier</span>
                                    <span className={`info-value tier-text ${tierCls}`}>{tierLabel}</span>
                                </div>
                            </div>
                            {institution && (
                                <div className="info-row">
                                    <Building size={18} />
                                    <div>
                                        <span className="info-label">Institution</span>
                                        <span className="info-value">{institution}</span>
                                    </div>
                                </div>
                            )}
                            {fieldOfStudy && (
                                <div className="info-row">
                                    <FlaskConical size={18} />
                                    <div>
                                        <span className="info-label">Field of Study</span>
                                        <span className="info-value">{fieldOfStudy}</span>
                                    </div>
                                </div>
                            )}
                            {primaryLang && (
                                <div className="info-row">
                                    <Code size={18} />
                                    <div>
                                        <span className="info-label">Primary Language</span>
                                        <span className="info-value">{primaryLang}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="profile-actions-card card">
                            <h3 className="info-card-title">Manage <span className="beta-tag-mini">BETA</span></h3>
                            {userData?.tier !== 'supporter' && userData?.tier !== 'enterprise' ? (
                                <div className="upgrade-cta">
                                    <p>☕ Support the project and go <strong>Ad-Free</strong> with cloud processing.</p>
                                    <Link to={ROUTES.SUPPORT} className="btn btn-primary btn-full">Become a Supporter</Link>
                                </div>
                            ) : (
                                <div className="supporter-cta">
                                    <p>Thank you for supporting AnyFileForge! You have unlocked all supporter features.</p>
                                    <Link to={ROUTES.SUPPORT} className="btn btn-secondary btn-full">View Supporter Perks</Link>
                                </div>
                            )}
                            <button className="btn btn-danger btn-full mt-12" onClick={logout}>
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default ProfilePage;
