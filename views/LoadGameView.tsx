import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Play, Calendar, Save } from 'lucide-react';
import { saveService, GameSave } from '../services/save';
import { GameState } from '../types';

interface LoadGameViewProps {
    onBack: () => void;
    onLoad: (gameState: GameState) => void;
}

export const LoadGameView: React.FC<LoadGameViewProps> = ({ onBack, onLoad }) => {
    const [saves, setSaves] = useState<GameSave[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchSaves();
    }, []);

    const fetchSaves = async () => {
        try {
            const data = await saveService.getSaves();
            setSaves(data);
        } catch (err) {
            setError('Failed to load saves');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLoad = async (save: GameSave) => {
        setProcessingId(save.id);
        try {
            const fullSave = await saveService.loadSave(save.id);
            if (fullSave && fullSave.data) {
                onLoad(fullSave.data);
            } else {
                throw new Error('Invalid save data');
            }
        } catch (err) {
            setError('Failed to load game data');
            console.error(err);
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this save?')) return;

        setProcessingId(id);
        try {
            await saveService.deleteSave(id);
            setSaves(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            setError('Failed to delete save');
            console.error(err);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Save className="text-emerald-500" />
                        Load Game
                    </h2>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 p-4 bg-red-500/10 rounded-lg">
                            {error}
                        </div>
                    ) : saves.length === 0 ? (
                        <div className="text-center text-slate-500 mt-20">
                            <Save size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No saved games found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {saves.map(save => (
                                <div
                                    key={save.id}
                                    className="group bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-4 transition-all cursor-pointer flex items-center justify-between"
                                    onClick={() => handleLoad(save)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-emerald-500">
                                            <Save size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{save.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Calendar size={14} />
                                                {new Date(save.updated_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {processingId === save.id ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500 mr-2"></div>
                                        ) : (
                                            <>
                                                <button
                                                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Load Game"
                                                >
                                                    <Play size={20} fill="currentColor" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(save.id, e)}
                                                    className="p-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete Save"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
