import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, Search, Hammer, Compass } from 'lucide-react';
import './NotFoundPage.css';
import SeoHead from '../../components/meta/SeoHead';

function NotFoundPage() {
    const location = useLocation();
    const badPath = location.pathname;
    const canvasRef = useRef(null);

    // Animated floating particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const particles = Array.from({ length: 40 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.5 + 0.1,
        }));

        let animId;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99,102,241,${p.alpha})`;
                ctx.fill();
                p.x += p.dx;
                p.y += p.dy;
                if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
            });
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    const suggestions = [
        { label: 'Home', to: '/', icon: Home },
        { label: 'All Tools', to: '/tools', icon: Hammer },
        { label: 'About', to: '/about', icon: Compass },
    ];

    return (
        <>
            <SeoHead
                title="404 – Page Not Found | AnyFileForge"
                description="The page you are looking for doesn't exist on AnyFileForge."
            />
            <div className="notfound-page">
                <canvas ref={canvasRef} className="notfound-canvas" />

                <div className="notfound-content">
                    <div className="notfound-glow-orb" />

                    <div className="notfound-badge">
                        <Search size={14} />
                        <span>Route Not Found</span>
                    </div>

                    <div className="notfound-code">404</div>

                    <h1 className="notfound-title">
                        Looks like this page got <span className="forge-accent">forged</span> wrong.
                    </h1>

                    <p className="notfound-desc">
                        The path <code className="notfound-path">{badPath}</code> doesn't exist on AnyFileForge. 
                        It may have been moved, deleted, or perhaps you mistyped the URL.
                    </p>

                    <div className="notfound-actions">
                        <Link to="/" className="btn btn-primary notfound-btn-home">
                            <Home size={18} />
                            Back to Home
                        </Link>
                        <button
                            className="btn btn-secondary notfound-btn-back"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                    </div>

                    <div className="notfound-suggestions">
                        <p className="notfound-suggestions-label">Or try one of these:</p>
                        <div className="notfound-suggestions-grid">
                            {suggestions.map(({ label, to, icon: Icon }) => (
                                <Link key={to} to={to} className="notfound-suggestion-card">
                                    <Icon size={20} />
                                    <span>{label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default NotFoundPage;
