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
                                );
};
