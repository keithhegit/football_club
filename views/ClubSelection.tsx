import React, { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import api, { Club } from '../services/api';
import { ClubLogo } from '../components/ClubLogo';

interface ClubSelectionProps {
    onConfirm: (club: Club) => void;
}

export const ClubSelection: React.FC<ClubSelectionProps> = ({ onConfirm }) => {
    const [selectedLeague, setSelectedLeague] = useState<number>(1); // Default: Premier League
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);

    useEffect(() => {
        const fetchClubs = async () => {
            setLoading(true);
            try {
                const response = await api.getClubs(selectedLeague, 1, 100);
                setClubs(response.data);
            } catch (error) {
                console.error('Failed to fetch clubs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClubs();
    }, [selectedLeague]);

    const filteredClubs = clubs.filter(club =>
        club.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-2xl font-bold text-white mb-4">Select Your Club</h2>

                    {/* League Filter */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            League
                        </label>
                        <select
                            value={selectedLeague}
                            onChange={e => setSelectedLeague(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition"
                        >
                            <option value={1}>English Premier League</option>
                            <option value={2}>Spanish First Division</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 sm:text-sm transition"
                            placeholder="Search clubs..."
                        />
                    </div>
                </div>

                {/* Club List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredClubs.map(club => (
                                <div
                                    key={club.id}
                                    onClick={() => setSelectedClub(club)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedClub?.id === club.id
                                        ? 'bg-emerald-900/20 border-emerald-600'
                                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <ClubLogo clubId={club.id} clubName={club.name} size="lg" />
                                            <div>
                                                <h3 className="font-bold text-white">{club.name}</h3>
                                                <p className="text-sm text-slate-400">{club.league_name}</p>
                                            </div>
                                        </div>
                                        {selectedClub?.id === club.id && (
                                            <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirm Button */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => selectedClub && onConfirm(selectedClub)}
                        disabled={!selectedClub}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        Confirm Contract
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
