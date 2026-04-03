import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Github, Mail, Lock, User, ArrowRight,
    Globe, ShieldCheck, Cpu, FlaskConical,
    Chrome, Key, Building, Code, Eye, EyeOff, RotateCcw
} from 'lucide-react';
import './AuthPage.css';

import { useAuth } from '../../contexts/AuthContext';

function AuthPage({ initialMode = 'login' }) {
    const { loginWithEmail, signupWithEmail, loginWithGoogle, loginWithGitHub, resetPassword } = useAuth();
    const [mode, setMode] = useState(initialMode);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsSubmitting(true);
        try {
            if (mode === 'login') {
                await loginWithEmail(formData.email, formData.password);
                navigate('/');
            } else if (mode === 'signup') {
                await signupWithEmail(formData.email, formData.password, {
                    name: formData.name,
                    role: formData.role,
                    institution: formData.institution,
                    fieldOfStudy: formData.fieldOfStudy,
                    primaryLanguage: formData.primaryLanguage
                });
                navigate('/');
            } else if (mode === 'forgot-password') {
                await resetPassword(formData.email);
                setMessage('Verification link sent to your email.');
            }
        } catch (err) {
            setError(err.message.replace('Firebase:', '').trim());
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGithubLogin = async () => {
        try {
            setError('');
            await loginWithGitHub();
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-page bg-mesh">
            <div className="container auth-container">
                <div className="auth-card-wrapper slide-up">
                    {/* Decorative side panel for Engineers/Researchers */}
                    <div className="auth-info-panel">
                        <div className="panel-content">
                            <div className="auth-logo">
                                <Cpu size={40} className="glow-icon" />
                                <h2>Forge ID</h2>
                            </div>
                            <div className="panel-features">
                                <div className="p-feature">
                                    <ShieldCheck size={20} />
                                    <div>
                                        <h4>Hardware Security</h4>
                                        <p>Biometric passkeys and MFA for sensitive research data.</p>
                                    </div>
                                </div>
                                <div className="p-feature">
                                    <Globe size={20} />
                                    <div>
                                        <h4>Global Research SSO</h4>
                                        <p>Native support for ORCID and Academic Shibboleth.</p>
                                    </div>
                                </div>
                                <div className="p-feature">
                                    <Github size={20} />
                                    <div>
                                        <h4>Dev-First Access</h4>
                                        <p>API keys and GitHub sync for automated workflows.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="panel-footer">
                            <p>© 2026 AnyFileForge Professional</p>
                        </div>
                    </div>

                    {/* Main Form Panel */}
                    <div className="auth-form-panel">
                        <div className="form-header">
                            <div className="mode-toggle">
                                <button
                                    className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
                                    onClick={() => setMode('login')}
                                >
                                    Login
                                </button>
                                <button
                                    className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
                                    onClick={() => setMode('signup')}
                                >
                                    Sign Up
                                </button>
                            </div>
                            <h1>
                                {mode === 'login' && 'Welcome Back, Forge'}
                                {mode === 'signup' && 'Join the Forge'}
                                {mode === 'forgot-password' && 'Reset Security Check'}
                            </h1>
                            <p>
                                {mode === 'login' && 'Access your private research environment'}
                                {mode === 'signup' && 'Start processing files with sub-millisecond latency'}
                                {mode === 'forgot-password' && 'Enter your verified email to recover access'}
                            </p>
                        </div>

                        {/* Social Logins - Specialized for Engineers/Researchers */}
                        {mode !== 'forgot-password' && (
                            <div className="social-grid">
                                <button className="social-btn" title="GitHub for Developers" onClick={handleGithubLogin}>
                                    <Github size={20} />
                                    <span>GitHub</span>
                                </button>
                                <button className="social-btn" title="ORCID for Researchers">
                                    <FlaskConical size={20} color="#A6CE39" />
                                    <span>ORCID</span>
                                </button>
                                <button className="social-btn" title="Sign in with Google" onClick={handleGoogleLogin}>
                                    <Chrome size={20} />
                                    <span>Google</span>
                                </button>
                            </div>
                        )}

                        {mode !== 'forgot-password' && (
                            <div className="divider">
                                <span>OR CONTINUE WITH EMAIL</span>
                            </div>
                        )}

                        {error && <div className="auth-error">{error}</div>}
                        {message && <div className="auth-success" style={{ color: 'var(--emerald-400)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {mode === 'signup' && (
                                <div className="input-group">
                                    <User className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        aria-label="Full Name"
                                        required
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="input-group">
                                <Mail className="input-icon" size={18} />
                                <input
                                    type="email"
                                    placeholder="work@email.com"
                                    aria-label="Email Address"
                                    required
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            
                            {mode !== 'forgot-password' && (
                                <div className="input-group">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        aria-label="Password"
                                        required
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            )}

                            {mode === 'signup' && (
                                <div className="input-group">
                                    <Cpu className="input-icon" size={18} />
                                    <select
                                        className="role-select"
                                        required
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        defaultValue=""
                                        aria-label="Select your Professional Role"
                                    >
                                        <option value="" disabled>Select your Role</option>
                                        <option value="engineer">Software Engineer</option>
                                        <option value="researcher">Academic Researcher</option>
                                        <option value="data_scientist">Data Scientist</option>
                                        <option value="student">Student</option>
                                        <option value="office">Office / Administration</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            )}

                            {mode === 'signup' && (formData.role === 'researcher' || formData.role === 'student') && (
                                <>
                                    <div className="input-group slide-down">
                                        <Building className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Institution / University"
                                            aria-label="Institution or University"
                                            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                        />
                                    </div>
                                    <div className="input-group slide-down">
                                        <FlaskConical className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Field of Study (e.g. Physics)"
                                            aria-label="Field of Study"
                                            onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {mode === 'signup' && (formData.role === 'engineer' || formData.role === 'data_scientist') && (
                                <div className="input-group slide-down">
                                    <Code className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Primary Language (e.g. Python, JS)"
                                        aria-label="Primary Programming Language"
                                        onChange={(e) => setFormData({ ...formData, primaryLanguage: e.target.value })}
                                    />
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary btn-full btn-glow" disabled={isSubmitting}>
                                {isSubmitting ? 'Processing...' : (
                                    mode === 'login' ? 'Authenticate' : 
                                    mode === 'signup' ? 'Initialize Account' : 
                                    'Recover Access'
                                )}
                                <ArrowRight size={18} />
                            </button>
                        </form>

                        {mode === 'forgot-password' && (
                           <button className="sso-link" onClick={() => setMode('login')} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                                <RotateCcw size={14} />
                                Back to Login
                           </button>
                        )}

                        {mode !== 'forgot-password' && (
                            <div className="data-notice">
                                <h4>Information we collect</h4>
                                <ul>
                                    <li>Email and password for login</li>
                                    <li>Display name and role</li>
                                    <li>Optional profile fields (institution, field, language)</li>
                                </ul>
                                <p className="data-note">
                                    Offline mode is local and serverless. Online mode (paid) may upload files for server processing and optional storage if enabled.
                                </p>
                            </div>
                        )}

                        <div className="form-footer">
                            {mode !== 'forgot-password' && (
                                <button className="sso-link">
                                    <Key size={14} />
                                    Login via Institutional SSO
                                </button>
                            )}
                            {mode === 'login' && (
                                <button 
                                    type="button"
                                    onClick={() => setMode('forgot-password')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
