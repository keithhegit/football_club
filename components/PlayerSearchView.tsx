import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { Player, SearchFilters } from '../services/api';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerProfileCard } from './PlayerProfileCard';
import { ClubLogo } from './ClubLogo';

interface PlayerSearchViewProps {
    onTransferComplete?: (player: Player, fee: number) => void;
}

export const PlayerSearchView: React.FC<PlayerSearchViewProps> = ({ onTransferComplete }) => {
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
            setPlayers(response.data);
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
    }, [filters]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, q: e.target.value, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="p-4 space-y-4 h-full flex flex-col relative">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-100">Player Search</h2>
                <div className="text-sm text-slate-400">
                    Total: {pagination.total.toLocaleString()}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-slate-900 focus:border-emerald-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder="Search players by name..."
                    value={filters.q}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Filters (Simple version) */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['GK', 'D (C)', 'M (C)', 'ST (C)'].map(pos => (
                    <button
                        key={pos}
                        onClick={() => setFilters(prev => ({ ...prev, position: prev.position === pos ? undefined : pos, page: 1 }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${filters.position === pos
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                            }`}
                    >
                        {pos}
                    </button>
                ))}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-lg border border-red-900">
                        {error}
                    </div>
                ) : players.length === 0 ? (
                    <div className="text-slate-500 text-center p-8">
                        No players found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {players.map(player => (
                            <div
                                key={player.id}
                                onClick={() => setSelectedPlayer(player)}
                                className="bg-slate-800 p-3 rounded border border-slate-700 hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-3"
                            >
                                <PlayerAvatar playerId={player.id} alt={player.name} size="md" />
                                <div className="flex-1">
                                    <div className="font-bold text-slate-200">{player.name}</div>
                                    <div className="text-xs text-slate-400 flex gap-2 items-center">
                                        <span className="text-emerald-400">{player.position}</span>
                                        <ClubLogo clubName={player.club} size="xs" />
                                        <span>{player.club}</span>
                                    </div>
                                </div>
                                <div className="ml-auto text-xs font-mono text-slate-500">
                                    CA: {player.ca}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                    className="p-2 rounded-md bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-slate-400">
                    Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || loading}
                    className="p-2 rounded-md bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Player Detail Modal */}
            {selectedPlayer && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedPlayer(null)}>
                    <div className="w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
                        <PlayerProfileCard
                            player={selectedPlayer}
                            onTransferComplete={(player, fee) => {
                                if (onTransferComplete) {
                                    onTransferComplete(player, fee);
                                }
                                setSelectedPlayer(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
