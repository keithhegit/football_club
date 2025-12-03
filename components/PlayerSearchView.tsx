import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { Player, SearchFilters } from '../services/api';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerProfileCard } from './PlayerProfileCard';
import { ClubLogo } from './ClubLogo';
import { Team } from '../types';

interface PlayerSearchViewProps {
    onTransferComplete?: (player: Player, fee: number) => void;
    userTeam?: Team; // To filter out user's own players
}

export const PlayerSearchView: React.FC<PlayerSearchViewProps> = ({ onTransferComplete, userTeam }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({
        q: '',
        page: 1,
        limit: 20,
        sort: 'ca',
        order: 'desc'
    });
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    const fetchPlayers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.searchPlayers(filters);

            // Filter out players already in user's squad
            let availablePlayers = response.data;
            if (userTeam) {
                const userPlayerIds = new Set(userTeam.players.map(p => p.id));
                availablePlayers = response.data.filter((p: Player) => !userPlayerIds.has(p.id));
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

            {/* Position Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
                <button
                    onClick={() => setFilters(prev => ({ ...prev, position: undefined, page: 1 }))}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${!filters.position
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    ALL
                </button>
                <button
                    onClick={() => setFilters(prev => ({ ...prev, position: 'GK', page: 1 }))}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${filters.position === 'GK'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    GK
                </button>
                <button
                    onClick={() => setFilters(prev => ({ ...prev, position: 'DEF', page: 1 }))}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${filters.position === 'DEF'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    DEF
                </button>
                <button
                    onClick={() => setFilters(prev => ({ ...prev, position: 'MID', page: 1 }))}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${filters.position === 'MID'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    MID
                </button>
                <button
                    onClick={() => setFilters(prev => ({ ...prev, position: 'FWD', page: 1 }))}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${filters.position === 'FWD'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    FWD
                </button>
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
                <div className="space-y-2 mb-4">
                    {players.map(player => (
                        <button
                            key={player.id}
                            onClick={() => setSelectedPlayer(player)}
                            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-lg p-4 transition-all text-left"
                        >
                            <div className="flex items-center gap-3">
                                <PlayerAvatar playerId={player.id} alt={player.name} size="md" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white truncate">{player.name}</h3>
                                    <div className="text-sm text-emerald-400">{player.position}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {player.club_id && <ClubLogo clubId={player.club_id} size="sm" />}
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500">CA</div>
                                        <div className="font-bold text-white">{player.ca}</div>
                                    </div>
                                </div>
                            </div>
                        </button>
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
                            onTransferComplete={onTransferComplete}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
