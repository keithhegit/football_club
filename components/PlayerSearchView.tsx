import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { Player, SearchFilters } from '../services/api';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerProfileCard } from './PlayerProfileCard';
import { ClubLogo } from './ClubLogo';
import { Team } from '../types';

interface PlayerSearchViewProps {
    onTransferComplete?: (player: Player, fee: number, wage: number) => void;
    userTeam?: Team; // To filter out user's own players
}

export const PlayerSearchView: React.FC<PlayerSearchViewProps> = ({ onTransferComplete, userTeam }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({
        q: '',
        page: 1,
        limit: 100, // Increased for client-side filtering
        sort: 'ca',
        order: 'desc'
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [localPositionFilter, setLocalPositionFilter] = useState<string>('ALL');

    const fetchPlayers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Don't send position to API, we'll filter client-side
            const apiFilters = { ...filters };
            delete apiFilters.position;

            const response = await api.searchPlayers(apiFilters);

            // Filter out players already in user's squad
            let availablePlayers = response.data;
            if (userTeam) {
                const userPlayerIds = new Set(userTeam.players.map(p => String(p.id)));
                availablePlayers = response.data.filter((p: Player) => !userPlayerIds.has(String(p.id)));
                console.log(`Filtered: ${response.data.length} → ${availablePlayers.length} (removed ${userPlayerIds.size} squad players)`);
            }

            setPlayers(availablePlayers);
            if (response.pagination) {
                setPagination(response.pagination);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch players');
        } finally {
            setLoading(false);
        }
    };

    // Apply client-side position filtering
    const displayedPlayers = localPositionFilter === 'ALL'
        ? players
        : players.filter(p => {
            const pos = p.position;
            if (!pos) return false;

            if (localPositionFilter === 'GK') return pos.includes('GK');
            if (localPositionFilter === 'DEF') return (pos.includes('D') && !pos.includes('DM') && !pos.includes('AM') && !pos.includes('M ')) || pos.includes('WB');
            if (localPositionFilter === 'MID') return pos.includes('M') || pos.includes('DM') || pos.includes('AM');
            if (localPositionFilter === 'FWD') return pos.includes('ST') || pos === 'FWD';
            return false;
        });

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchPlayers();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [filters, userTeam]); // Re-fetch when userTeam changes (after transfer)

    const handleSearch = (q: string) => {
        setFilters(prev => ({ ...prev, q, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4">
            <h1 className="text-2xl font-bold mb-4 text-slate-100">Player Search</h1>

            {/* Search Bar */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Search players by name..."
                    value={filters.q}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 pl-10 pr-4 py-3 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
            </div>

            {/* Position Filters - Client Side */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
                {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(pos => (
                    <button
                        key={pos}
                        onClick={() => setLocalPositionFilter(pos)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${localPositionFilter === pos
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        {pos}
                    </button>
                ))}
            </div>

            {/* Results Info */}
            <div className="mb-4 text-slate-400 text-sm">
                Total: {pagination.total.toLocaleString()} players
                {userTeam && <span className="ml-2">(Excluding your {userTeam.players.length} squad players)</span>}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center text-slate-400 py-8">
                    Loading players...
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {/* Player List */}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {displayedPlayers.map(player => (
                        <div
                            key={player.id}
                            onClick={() => setSelectedPlayer(player)}
                            className="bg-slate-800 p-3 rounded border border-slate-700 hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-3"
                        >
                            <PlayerAvatar playerId={player.id} alt={player.name} size="md" />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-200 truncate">{player.name}</div>
                                <div className="text-xs text-slate-400 flex gap-2">
                                    <span className={`${player.position?.includes('GK') ? 'text-yellow-400' :
                                        player.position?.includes('D') ? 'text-blue-400' :
                                            player.position?.includes('M') ? 'text-emerald-400' :
                                                'text-red-400'
                                        }`}>{player.position}</span>
                                    <span>Age {player.age}</span>
                                </div>
                                {player.club_name && (
                                    <div className="text-xs text-slate-500 truncate mt-0.5">{player.club_name}</div>
                                )}
                            </div>
                            <div className="text-xs font-mono text-slate-500 flex flex-col items-end gap-0.5">
                                <div>CA: {player.ca}</div>
                                {player.pa > 0 && (
                                    <div className="text-emerald-400">
                                        潜力：{player.pa >= 170 ? '🌟 世界级' :
                                            player.pa >= 150 ? '⭐ 顶级' :
                                                player.pa >= 130 ? '💎 关键' :
                                                    player.pa >= 110 ? '🔹 主力' :
                                                        player.pa >= 90 ? '📦 轮换' : '💤 替补'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 items-center">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-slate-400">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Player Profile Modal */}
            {selectedPlayer && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPlayer(null)}>
                    <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <PlayerProfileCard
                            player={selectedPlayer}
                            userTeam={userTeam}
                            onTransferComplete={(player, fee, wage) => {
                                if (onTransferComplete) {
                                    onTransferComplete(player, fee, wage);
                                }
                                setSelectedPlayer(null); // Close modal after transfer
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
