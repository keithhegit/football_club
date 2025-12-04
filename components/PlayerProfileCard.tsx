
import React, { useState } from 'react';
import { Player } from '../types';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import { TransferOfferModal } from './TransferOfferModal';
import { getPotentialDescriptionChinese } from '../utils/playerPotential';

interface Props {
    player: Player;
    onTransferComplete?: (player: Player, fee: number) => void;
    hideActions?: boolean; // Hide Make Offer button when in confirmation flow
    userTeam?: { players: Player[] }; // To check if player is already in squad
}

// Helper component for attribute rows
const AttributeRow = ({ label, value }: { label: string; value: number }) => (
    <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={`font-mono font-bold ${value >= 16 ? 'text-emerald-400' :
            value >= 12 ? 'text-emerald-600' :
                'text-slate-500'
            }`}>{value}</span>
    </div>
);

// Star Rating Component
const StarRating = ({ ca }: { ca: number }) => {
    // Simple static scale for now
    // < 80: 1, 80-110: 2, 110-130: 3, 130-150: 4, 150-170: 4.5, > 170: 5
    let stars = 1;
    if (ca >= 170) stars = 5;
    else if (ca >= 150) stars = 4.5;
    else if (ca >= 130) stars = 4;
    else if (ca >= 110) stars = 3;
    else if (ca >= 80) stars = 2;

    return (
        <div className="flex space-x-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="relative">
                    <span className="text-slate-600">★</span>
                    <span className="absolute top-0 left-0 text-yellow-400 overflow-hidden" style={{ width: stars >= star ? '100%' : stars >= star - 0.5 ? '50%' : '0%' }}>
                        ★
                    </span>
                </div>
            ))}
        </div>
    );
};

export const PlayerProfileCard: React.FC<Props> = ({ player, onTransferComplete, hideActions = false, userTeam }) => {
    const [flipped, setFlipped] = useState(false);

    // ... (Calculations remain unchanged)
    const getAvg = (obj: any): number => (Object.values(obj) as number[]).reduce((a, b) => a + b, 0) / 6;

    const tech = (getAvg(player.attributes.technical) / 20) * 40; // max radius 40
    const ment = (getAvg(player.attributes.mental) / 20) * 40;
    const phys = (getAvg(player.attributes.physical) / 20) * 40;

    // 3 Points of triangle at 0, 120, 240 degrees (Center 50,50)
    const p1 = { x: 50, y: 50 - phys }; // Top (Physical)
    const p2 = { x: 50 + tech * 0.866, y: 50 + tech * 0.5 }; // Bottom Right (Technical)
    const p3 = { x: 50 - ment * 0.866, y: 50 + ment * 0.5 }; // Bottom Left (Mental)

    const points = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;

    // Traits Analysis
    const traits = [];
    if (player.attributes.physical.pace >= 17) traits.push({ label: "Speedster", color: "bg-emerald-500" });
    if (player.attributes.technical.finishing >= 17) traits.push({ label: "Finisher", color: "bg-emerald-500" });
    if (player.attributes.mental.vision >= 17) traits.push({ label: "Playmaker", color: "bg-blue-500" });
    if (player.attributes.physical.strength >= 17) traits.push({ label: "Tank", color: "bg-orange-500" });
    if (player.attributes.technical.dribbling >= 17) traits.push({ label: "Dribbler", color: "bg-purple-500" });

    // Get Top 3 Attributes for Front Card display
    const allAttributes = { ...player.attributes.technical, ...player.attributes.mental, ...player.attributes.physical } as Record<string, number>;
    const topAttributes = Object.entries(allAttributes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const [showTransferModal, setShowTransferModal] = useState(false);

    const potentialText = getPotentialDescriptionChinese(player.pa);

    return (
        <>
            <div
                onClick={() => setFlipped(!flipped)}
                className="relative min-h-80 w-full cursor-pointer perspective-1000 group select-none"
            >
                <div className={`relative w-full h-full min-h-80 duration-500 preserve-3d transition-transform ${flipped ? 'rotate-y-180' : ''}`}>

                    {/* FRONT OF CARD */}
                    <div className="absolute w-full h-full backface-hidden bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="h-20 bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex justify-between items-start gap-3">
                            <PlayerAvatar playerId={player.id} alt={player.name} size="md" className="border-2 border-slate-600" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg leading-none truncate">{player.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-emerald-400 font-mono">{player.position}</span>
                                    <StarRating ca={player.ca} />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-white leading-none">{player.ca}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">CA</div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-4 relative flex flex-col">
                            {/* Trait Badges */}
                            <div className="absolute top-0 right-4 flex flex-col items-end space-y-1 z-10">
                                {traits.slice(0, 2).map((t, i) => (
                                    <span key={i} className={`text-[9px] px-2 py-0.5 rounded-full text-white font-bold shadow-sm ${t.color}`}>
                                        {t.label}
                                    </span>
                                ))}
                            </div>

                            {/* Radar Chart */}
                            <div className="flex justify-center items-center mt-0 mb-2">
                                <div className="relative w-24 h-24">
                                    {/* Background Triangles */}
                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
                                        <polygon points="50,10 85,70 15,70" fill="none" stroke="#334155" strokeWidth="1" />
                                        <polygon points="50,30 67,60 33,60" fill="none" stroke="#334155" strokeWidth="0.5" />
                                        {/* Data Polygon */}
                                        <polygon points={points} fill="rgba(16, 185, 129, 0.4)" stroke="#10b981" strokeWidth="2" />
                                        {/* Labels */}
                                        <text x="50" y="5" textAnchor="middle" className="text-[7px] fill-slate-400 font-bold">PHY</text>
                                        <text x="95" y="75" textAnchor="middle" className="text-[7px] fill-slate-400 font-bold">TEC</text>
                                        <text x="5" y="75" textAnchor="middle" className="text-[7px] fill-slate-400 font-bold">MEN</text>
                                    </svg>
                                </div>
                            </div>

                            {/* Top Attributes Bars */}
                            <div className="space-y-1.5 mt-auto mb-2">
                                {topAttributes.map(([key, val]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <span className="text-[10px] text-slate-400 w-16 capitalize truncate text-right">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${val >= 15 ? 'bg-emerald-400' : val >= 12 ? 'bg-emerald-600' : 'bg-slate-500'}`}
                                                style={{ width: `${(val / 20) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] text-slate-300 w-4 font-mono">{val}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-1 text-center text-[10px] text-slate-600 flex items-center justify-center space-x-1">
                                <span>Tap for Details</span>
                                <ChevronRight size={10} />
                            </div>
                        </div>
                    </div>

                    {/* BACK OF CARD (Detailed Stats) */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                            <span className="font-bold text-slate-200 text-sm truncate">{player.name}</span>
                            <RefreshCw size={14} className="text-slate-500" />
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-x-4 content-start">
                            <div className="space-y-1 mb-2">
                                <div className="text-[10px] font-bold text-emerald-500 uppercase mb-1 border-b border-slate-800">Technical</div>
                                <AttributeRow label="Finishing" value={player.attributes.technical.finishing} />
                                <AttributeRow label="Dribbling" value={player.attributes.technical.dribbling} />
                                <AttributeRow label="Passing" value={player.attributes.technical.passing} />
                                <AttributeRow label="Tackling" value={player.attributes.technical.tackling} />
                                <AttributeRow label="Technique" value={player.attributes.technical.technique} />
                                <AttributeRow label="FirstTouch" value={player.attributes.technical.firstTouch} />
                            </div>

                            <div className="space-y-1 mb-2">
                                <div className="text-[10px] font-bold text-blue-500 uppercase mb-1 border-b border-slate-800">Mental</div>
                                <AttributeRow label="Vision" value={player.attributes.mental.vision} />
                                <AttributeRow label="Decisions" value={player.attributes.mental.decisions} />
                                <AttributeRow label="Position" value={player.attributes.mental.positioning} />
                                <AttributeRow label="Composure" value={player.attributes.mental.composure} />
                                <AttributeRow label="WorkRate" value={player.attributes.mental.workRate} />
                                <AttributeRow label="Anticipat" value={player.attributes.mental.anticipation} />
                            </div>

                            <div className="space-y-1 col-span-2">
                                <div className="text-[10px] font-bold text-purple-500 uppercase mb-1 border-b border-slate-800">Physical</div>
                                <div className="grid grid-cols-2 gap-x-4">
                                    <AttributeRow label="Pace" value={player.attributes.physical.pace} />
                                    <AttributeRow label="Accel" value={player.attributes.physical.acceleration} />
                                    <AttributeRow label="Stamina" value={player.attributes.physical.stamina} />
                                    <AttributeRow label="Strength" value={player.attributes.physical.strength} />
                                    <AttributeRow label="Balance" value={player.attributes.physical.balance} />
                                    <AttributeRow label="Agility" value={player.attributes.physical.agility} />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {!hideActions && (() => {
                            const alreadyInSquad = userTeam?.players.some(p => String(p.id) === String(player.id));
                            if (alreadyInSquad) return null;

                            return (
                                <div className="p-3 border-t border-slate-800 mt-auto">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowTransferModal(true);
                                        }}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded shadow-lg transition-colors"
                                    >
                                        Make Transfer Offer
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
                <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
            </div>

            {showTransferModal && (
                <TransferOfferModal
                    player={player}
                    onClose={() => setShowTransferModal(false)}
                    onTransferComplete={onTransferComplete}
                />
            )}
        </>
    );
};
