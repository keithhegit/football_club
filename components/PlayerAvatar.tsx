import React, { useState } from 'react';
import { User } from 'lucide-react';

interface PlayerAvatarProps {
    playerId: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const R2_BASE_URL = 'https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/fm';

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
    playerId,
    alt,
    size = 'md',
    className = ''
}) => {
    const [error, setError] = useState(false);

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32'
    };

    if (error) {
        return (
            <div className={`${sizeClasses[size]} bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 ${className}`}>
                <User className="text-slate-500" size={size === 'sm' ? 16 : size === 'md' ? 24 : 48} />
            </div>
        );
    }

    // Extract numeric ID - handle both string ('p123') and number (123) types
    const playerIdStr = String(playerId);
    const numericId = playerIdStr.startsWith('p') ? playerIdStr.substring(1) : playerIdStr;

    return (
        <img
            src={`${R2_BASE_URL}/${numericId}.png`}
            alt={alt}
            className={`${sizeClasses[size]} rounded-full object-cover border border-slate-700 bg-slate-800 ${className}`}
            onError={() => setError(true)}
            loading="lazy"
        />
    );
};
