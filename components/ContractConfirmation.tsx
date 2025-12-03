import React, { useState } from 'react';
import { Player } from '../types';
import { X, CheckCircle, User, TrendingUp, DollarSign } from 'lucide-react';
import { PlayerProfileCard } from './PlayerProfileCard';

interface Props {
    player: Player;
    transferFee: number;
    weeklyWage: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ContractConfirmation: React.FC<Props> = ({
    player,
    transferFee,
    weeklyWage,
    onConfirm,
    onCancel
}) => {
    const [showPlayerProfile, setShowPlayerProfile] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-xl border border-emerald-500/50 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-5 border-b border-emerald-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="text-emerald-300" size={24} />
                                <h2 className="text-xl font-bold text-white">合同确认</h2>
                            </div>
                            <p className="text-emerald-200 text-sm">最终审查并确认签约</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-emerald-200 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Player Info - Now Clickable */}
                <div className="p-6 space-y-6">
                    <button
                        onClick={() => setShowPlayerProfile(true)}
                        className="w-full bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-emerald-500 transition-all group text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center border-2 border-emerald-500 group-hover:scale-110 transition-transform">
                                <User className="text-emerald-400 group-hover:text-emerald-300" size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">{player.name}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-emerald-400 font-semibold">{player.position}</span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-400">{player.age}岁</span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-300">CA: {player.ca}</span>
                                </div>
                            </div>
                            <div className="text-slate-400 text-sm group-hover:text-emerald-400 transition-colors">
                                点击查看详情 →
                            </div>
                        </div>
                    </button>

                    {/* Contract Details */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">合同详情</h4>

                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <DollarSign size={16} className="text-emerald-400" />
                                    <span>转会费</span>
                                </div>
                                <span className="text-xl font-bold text-white">
                                    £{transferFee.toLocaleString()}
                                </span>
                            </div>

                            <div className="h-px bg-slate-700"></div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <TrendingUp size={16} className="text-emerald-400" />
                                    <span>周薪</span>
                                </div>
                                <span className="text-xl font-bold text-white">
                                    £{weeklyWage.toLocaleString()}/周
                                </span>
                            </div>
                        </div>

                        <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 mt-4">
                            <p className="text-amber-200 text-sm">
                                ⚠️ 签约后将从预算中扣除转会费，球员将立即加入阵容
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-6 rounded-lg transition-colors border border-slate-700"
                        >
                            取消
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
                        >
                            确认签约
                        </button>
                    </div>
                </div>
            </div>

            {/* Player Profile Modal */}
            {showPlayerProfile && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPlayerProfile(false)}>
                    <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <PlayerProfileCard player={player} />
                    </div>
                </div>
            )}
        </div>
    );
};
