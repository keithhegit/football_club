import React from 'react';
import { PlayerPosition, Player } from '../../types';

interface TacticsPitchProps {
    formation: PlayerPosition[];
    lineup: { positionId: string; playerId: string }[];
    players: Player[];
    onPlayerDrop?: (playerId: string, positionId: string) => void;
    onPlayerClick?: (playerId: string) => void;
}

const PITCH_WIDTH = 600;
const PITCH_HEIGHT = 800;

export const TacticsPitch: React.FC<TacticsPitchProps> = ({ formation, lineup, players, onPlayerDrop, onPlayerClick }) => {

    const getPlayerAtPosition = (posId: string) => {
        const entry = lineup.find(l => l.positionId === posId);
        if (!entry) return null;
        return players.find(p => p.id === entry.playerId);
    };

    return (
        <div className="relative bg-green-700 border-4 border-white rounded-lg shadow-xl overflow-hidden"
            style={{ width: '100%', maxWidth: '600px', aspectRatio: '3/4' }}>

            {/* Pitch Markings (CSS/SVG) */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/50 rounded-full"></div>
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/50"></div>

                {/* Penalty Areas */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3/5 h-1/6 border-b-2 border-x-2 border-white/50"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/5 h-1/6 border-t-2 border-x-2 border-white/50"></div>

                {/* Goal Areas */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1/12 border-b-2 border-x-2 border-white/50"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1/12 border-t-2 border-x-2 border-white/50"></div>
            </div>

            {/* Players */}
            {formation.map((pos) => {
                const player = getPlayerAtPosition(pos.id);

                // Convert 0-100 coordinates to %
                const style = {
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                };

                return (
                    <div
                        key={pos.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10 pointer-events-auto"
                        style={style}
                        onDragOver={(e) => {
                            e.preventDefault(); // Allow drop
                            e.currentTarget.classList.add('scale-110');
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.classList.remove('scale-110');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('scale-110');
                            const playerId = e.dataTransfer.getData('playerId');
                            if (playerId && onPlayerDrop) {
                                onPlayerDrop(playerId, pos.id);
                            }
                        }}
                    >
                        {/* Player Dot/Jersey */}
                        <div
                            draggable={!!player}
                            onDragStart={(e) => {
                                if (player) {
                                    e.dataTransfer.setData('playerId', player.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (player && onPlayerClick) onPlayerClick(player.id);
                            }}
                            className={`
              w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-md transition-transform hover:scale-110
              ${player ? 'bg-blue-600 border-white text-white cursor-pointer' : 'bg-gray-800/50 border-dashed border-gray-400'}
            `}>
                            {player ? (
                                <span className="font-bold text-sm">{player.position}</span> // Or Rating
                            ) : (
                                <span className="text-xs text-gray-300">{pos.name}</span>
                            )}
                        </div>

                        {/* Player Name Label */}
                        {player && (
                            <div className="mt-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded truncate max-w-[100px] text-center">
                                {player.name.split(' ').pop()}
                            </div>
                        )}

                        {/* Role Label (Optional, on hover) */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -bottom-6 bg-yellow-500 text-black text-[10px] px-1 rounded font-bold whitespace-nowrap transition-opacity">
                            {pos.name}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
