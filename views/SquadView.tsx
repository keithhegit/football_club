import React, { useState } from 'react';
import { Team, Position } from '../types';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { PlayerProfileCard } from '../components/PlayerProfileCard';
import { ClubLogo } from '../components/ClubLogo';

interface SquadViewProps {
    team: Team;
}

export const SquadView: React.FC<SquadViewProps> = ({ team }) => {
    const [selectedPosition, setSelectedPosition] = useState<Position | 'ALL'>('ALL');
    const [selectedPlayer, setSelectedPlayer] = useState<typeof team.players[0] | null>(null);

    // Smart position filtering
    const filteredPlayers = selectedPosition === 'ALL'
        ? team.players
        : team.players.filter(p => {
            const pos = p.position;
            if (selectedPosition === 'GK') return pos.includes('GK');
            if (selectedPosition === 'DEF') return (pos.includes('D') && !pos.includes('DM') && !pos.includes('AM') && !pos.includes('M ')) || pos.includes('WB');
            if (selectedPosition === 'MID') return pos.includes('M') || pos.includes('DM') || pos.includes('AM');
            if (selectedPosition === 'FWD') return pos.includes('ST') || pos === 'FWD';
            return pos === selectedPosition;
        });

    // Sort by position order
    const positionOrder = { 'GK': 1, 'DEF': 2, 'MID': 3, 'FWD': 4 };
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        const posA = positionOrder[a.position as keyof typeof positionOrder] || 99;
        const posB = positionOrder[b.position as keyof typeof positionOrder] || 99;
        return posA - posB;
    });

    return (
        <div className="p-4 space-y-4 h-full flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <ClubLogo clubId={team.id} clubName={team.name} size="lg" />
                    <h2 className="text-xl font-bold text-slate-100">First Team Squad</h2>
                </div>
                <div className="text-sm text-slate-400">
                    {filteredPlayers.length} Players
                </div>
            </div>

            {/* Position Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(pos => (
                    <button
                        key={pos}
                        onClick={() => setSelectedPosition(pos as Position | 'ALL')}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${selectedPosition === pos
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                            }`}
                    >
                        {pos}
                    </button>
                ))}
            </div>

            {/* Squad List */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {sortedPlayers.length === 0 ? (
                    <div className="text-slate-500 text-center p-8">
                        No players in this position.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedPlayers.map(player => (
                            <div
                                key={player.id}
                                onClick={() => setSelectedPlayer(player)}
                                className="bg-slate-800 p-3 rounded border border-slate-700 hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-3"
                            >
                                <PlayerAvatar playerId={player.id} alt={player.name} size="md" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-200 truncate">{player.name}</div>
                                    <div className="text-xs text-slate-400 flex gap-2">
                                        <span className={`${player.position === 'GK' ? 'text-yellow-400' :
                                            player.position === 'DEF' ? 'text-blue-400' :
                                                player.position === 'MID' ? 'text-emerald-400' :
                                                    'text-red-400'
                                            }`}>{player.position}</span>
                                        <span>Age {player.age}</span>
                                    </div>
                                </div>
                                <div className="text-xs font-mono text-slate-500 flex flex-col items-end gap-0.5">
                                    <div>CA: {player.ca}</div>
                                    {player.pa > 0 && (
                                        <div className="text-emerald-400">
                                            {player.pa >= 170 ? '世界级' :
                                                player.pa >= 150 ? '顶级' :
                                                    player.pa >= 130 ? '关键' :
                                                        player.pa >= 110 ? '主力' :
                                                            player.pa >= 90 ? '轮换' : '替补'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Player Detail Modal */}
            {selectedPlayer && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedPlayer(null)}>
                    <div className="w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
                        <PlayerProfileCard player={selectedPlayer} userTeam={team} />
                    </div>
                </div>
            )}
        </div>
    );
};
