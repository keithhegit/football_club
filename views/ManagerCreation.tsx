import React, { useState } from 'react';
import { User, ChevronRight } from 'lucide-react';

export interface ManagerData {
    name: string;
    nationality: string;
    experience: 'Amateur' | 'Semi-Pro' | 'Professional';
    preference: 'Attacking' | 'Balanced' | 'Defensive';
}

interface ManagerCreationProps {
    onNext: (manager: ManagerData) => void;
}

export const ManagerCreation: React.FC<ManagerCreationProps> = ({ onNext }) => {
    const [manager, setManager] = useState<ManagerData>({
        name: '',
        nationality: 'England',
        experience: 'Professional',
        preference: 'Balanced'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manager.name.trim()) {
            onNext(manager);
        }
    };

    return (
        <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-xl border border-slate-800 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <User className="text-emerald-400" size={32} />
                    <h2 className="text-2xl font-bold text-white">Create Manager</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Manager Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={manager.name}
                            onChange={e => setManager({ ...manager, name: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition"
                            placeholder="Enter your name"
                            required
                        />
                    </div>

                    {/* Nationality */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nationality
                        </label>
                        <select
                            value={manager.nationality}
                            onChange={e => setManager({ ...manager, nationality: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition"
                        >
                            <option>England</option>
                            <option>Spain</option>
                            <option>Germany</option>
                            <option>Italy</option>
                            <option>France</option>
                            <option>Brazil</option>
                            <option>Argentina</option>
                        </select>
                    </div>

                    {/* Experience Level */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Experience Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Amateur', 'Semi-Pro', 'Professional'] as const).map(exp => (
                                <button
                                    key={exp}
                                    type="button"
                                    onClick={() => setManager({ ...manager, experience: exp })}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${manager.experience === exp
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {exp}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tactical Preference */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tactical Preference
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['Attacking', 'Balanced', 'Defensive'] as const).map(pref => (
                                <button
                                    key={pref}
                                    type="button"
                                    onClick={() => setManager({ ...manager, preference: pref })}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${manager.preference === pref
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {pref}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!manager.name.trim()}
                        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        Next
                        <ChevronRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};
