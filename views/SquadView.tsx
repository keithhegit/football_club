import React, { useState, useEffect } from 'react';
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
    const [page, setPage] = useState(0);

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

    // Sort by position order, then by CA (descending)
    const positionOrder = { 'GK': 1, 'DEF': 2, 'MID': 3, 'FWD': 4 };
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        const posA = positionOrder[a.position as keyof typeof positionOrder] || 99;
        const posB = positionOrder[b.position as keyof typeof positionOrder] || 99;
        if (posA !== posB) return posA - posB;
        // Within same position, sort by CA descending
        return b.ca - a.ca;
    });

    const pageSize = 12;
    const totalPages = Math.max(1, Math.ceil(sortedPlayers.length / pageSize));
    const pagePlayers = sortedPlayers.slice(page * pageSize, page * pageSize + pageSize);

    // Reset page when filter changes
    useEffect(() => {
        setPage(0);
    }, [selectedPosition]);

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
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            {pagePlayers.map(player => (
                                <div
                                    key={player.id}
                                    onClick={() => setSelectedPlayer(player)}
                                    className="bg-slate-800/80 p-3 rounded border border-slate-700 hover:border-emerald-600 cursor-pointer transition shadow-sm flex flex-col items-center gap-3"
                                >
                                    <PlayerAvatar playerId={player.id} alt={player.name} size="lg" className="border-emerald-500" />
                                    <div className="text-center">
                                        <div className="font-bold text-slate-200 truncate max-w-[140px]">{player.name}</div>
                                        <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
                                            <span className={`${player.position === 'GK' ? 'text-yellow-400' :
                                                player.position === 'DEF' ? 'text-blue-400' :
                                                    player.position === 'MID' ? 'text-emerald-400' :
                                                        'text-red-400'
                                                } font-bold`}>{player.position}</span>
                                            <span className="text-slate-500">CA {player.ca}</span>
                                        </div>
                                    </div>
                                    {player.pa > 0 && (
                                        <div className="text-[11px] text-emerald-400 text-center">
                                            {player.pa >= 170 ? '🌟 世界级' :
                                                player.pa >= 150 ? '⭐ 顶级' :
                                                    player.pa >= 130 ? '💎 关键' :
                                                        player.pa >= 110 ? '🔹 主力' :
                                                            player.pa >= 90 ? '📦 轮换' : '💤 替补'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center items-center gap-3 mt-3">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className={`px-3 py-1 rounded ${page === 0 ? 'bg-slate-800 text-slate-600 border border-slate-700' : 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600'}`}
                            >
                                上一页
                            </button>
                            <span className="text-xs text-slate-400">第 {page + 1} / {totalPages} 页</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className={`px-3 py-1 rounded ${page >= totalPages - 1 ? 'bg-slate-800 text-slate-600 border border-slate-700' : 'bg-slate-700 text-white border border-slate-600 hover:bg-slate-600'}`}
                            >
                                下一页
                            </button>
                        </div>
                    </>
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
