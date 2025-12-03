import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { getClubLogoIdByClubId, getClubLogoId } from '../data/clubLogos';

interface ClubLogoProps {
    clubId?: number;      // Recommended: Use club ID for reliable lookup
    clubName?: string;    // Fallback: Use name if ID not available
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const R2_BASE_URL = 'https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/fmlogos';

export const ClubLogo: React.FC<ClubLogoProps> = ({
    clubId,
    clubName,
    size = 'md',
    className = ''
}) => {
    const [error, setError] = useState(false);

    const sizeClasses = {
        xs: 'w-4 h-4',
        );
    }

return (
    <img
        src={`${R2_BASE_URL}/${logoId}.png`}
        alt={`${clubName || 'Club'} logo`}
        className={`${sizeClasses[size]} object-contain ${className}`}
        onError={() => setError(true)}
        loading="lazy"
    />
);
};
