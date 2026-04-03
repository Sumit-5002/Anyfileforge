import React from 'react';
import { User } from 'lucide-react';

/**
 * Deterministic GitHub-style Identicons for AnyFileForge
 */
const getIdenticon = (seed) => {
    // DiceBear Identicon is the closest to GitHub's pixel-art style
    return `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0f172a&backgroundType=solid&backgroundRotation=0&rowColor=6366f1,8b5cf6,4f46e5`;
};

const UserAvatar = ({ user, userData, size = 40, className = '' }) => {
    const seed = user?.uid || 'guest';
    const photoURL = user?.photoURL || getIdenticon(seed);
    const displayName = userData?.displayName || user?.displayName || 'User';

    return (
        <div 
            className={`user-avatar-container ${className}`}
            style={{ 
                width: size, 
                height: size, 
                borderRadius: 'inherit',
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <img 
                src={photoURL} 
                alt={displayName} 
                className="user-avatar-img"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                }}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '👤'; // Fallback to icon
                }}
            />
        </div>
    );
};

export default UserAvatar;
