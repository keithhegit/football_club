import React from 'react';
import { Trophy, LogOut } from 'lucide-react';
import { User } from '../services/auth';

interface MainMenuProps {
    onNewGame: () => void;
    onLoadGame: () => void;
    user: User | null;
    onLogin: () => void;
    onRegister: () => void;
    onLogout: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onNewGame, onLoadGame, user, onLogin, onRegister, onLogout }) => {
    return (
        <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center relative">
            {/* User Status */}
            <div className="absolute top-4 right-4 flex items-center gap-4">
                {user ? (
                    <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700 backdrop-blur-sm">
                        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.username[0].toUpperCase()}
                        </div>
                        <span className="text-slate-200 font-medium">{user.username}</span>
                        <button
                            onClick={onLogout}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={onLogin}
                            className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
                        >
                            Login
                        </button>
                        <button
                            onClick={onRegister}
                            className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                        >
                            Register
                        </button>
                    </div>
                )}
            </div>

            <div className="text-center space-y-8 p-8">
                {/* Logo/Title */}
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3 text-emerald-400">
                        <Trophy size={48} />
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tight">FM2023</h1>
                    <p className="text-slate-400 text-lg">Football Manager 2023</p>
                </div>

                {/* Menu Options */}
                <div className="space-y-4 mt-12">
                    <button
                        onClick={onNewGame}
                        className="w-64 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
                    >
                        New Game
                    </button>
                    <button
                        onClick={onLoadGame}
                        disabled={!user}
                        className={`w-64 px-6 py-4 font-bold rounded-lg transition-all duration-200 ${user
                            ? 'bg-slate-800 hover:bg-slate-700 text-white hover:scale-105'
                            : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {user ? 'Load Game' : 'Login to Load Game'}
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-16 text-slate-600 text-sm">
                    <p>Version 1.0.0</p>
                </div>
            </div>
        </div>
    );
};
