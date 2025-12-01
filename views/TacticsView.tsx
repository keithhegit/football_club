
import React, { useState, useMemo } from 'react';
import { Team, Player, Position } from '../types';
import { PlayerProfileCard } from '../components/PlayerProfileCard';
import { X, Info } from 'lucide-react';

interface TacticsViewProps {
  team: Team;
}

// Simple logic to pick the best XI for a 4-4-2 from a sorted list of players
const getBestXI = (allPlayers: Player[]) => {
  // Assuming allPlayers are already sorted by CA or similar quality metric
  const gks = allPlayers.filter(p => p.position === Position.GK);
  const defs = allPlayers.filter(p => p.position === Position.DEF);
  const mids = allPlayers.filter(p => p.position === Position.MID);
  const fwds = allPlayers.filter(p => p.position === Position.FWD);

  return {
    gk: gks[0],
    defs: defs.slice(0, 4),
    mids: mids.slice(0, 4),
    fwds: fwds.slice(0, 2),
  };
};

export const TacticsView: React.FC<TacticsViewProps> = ({ team }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const bestXI = useMemo(() => getBestXI(team.players), [team.players]);

  // Positions for 4-4-2 (percentages relative to pitch container)
  // [left%, top%]
  const positions: Record<string, { left: number; top: number }[]> = {
    gk: [{ left: 50, top: 88 }],
    def: [
      { left: 15, top: 70 }, // LB
      { left: 38, top: 75 }, // CB
      { left: 62, top: 75 }, // CB
      { left: 85, top: 70 }, // RB
    ],
    mid: [
      { left: 15, top: 45 }, // LM
      { left: 38, top: 50 }, // CM
      { left: 62, top: 50 }, // CM
      { left: 85, top: 45 }, // RM
    ],
    fwd: [
      { left: 35, top: 15 }, // ST
      { left: 65, top: 15 }, // ST
    ]
  };

  const renderPlayerDot = (player: Player, pos: { left: number; top: number }) => {
    if (!player) return null;
    return (
      <div
        key={player.id}
        onClick={() => setSelectedPlayer(player)}
        className="absolute w-10 h-10 -ml-5 -mt-5 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10"
        style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-100 shadow-md flex items-center justify-center text-[10px] font-bold text-white relative">
          {/* Jersey Number placeholder or Initials */}
          {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          
          {/* Position Indicator Badge */}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-slate-900 ${
            player.position === Position.FWD ? 'bg-red-500' :
            player.position === Position.MID ? 'bg-emerald-500' :
            player.position === Position.DEF ? 'bg-blue-500' : 'bg-yellow-500'
          }`}></div>
        </div>
        <div className="bg-slate-900/80 text-white text-[8px] px-1.5 py-0.5 rounded mt-1 whitespace-nowrap backdrop-blur-sm border border-slate-700">
          {player.name.split(' ').pop()}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative bg-slate-950">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-20">
        <div>
           <h2 className="text-lg font-bold text-slate-100">Tactics Board</h2>
           <p className="text-xs text-slate-400">4-4-2 Balanced</p>
        </div>
        <div className="bg-slate-800 p-2 rounded-full text-emerald-500">
            <Info size={16} />
        </div>
      </div>

      {/* Pitch */}
      <div className="flex-1 relative overflow-hidden bg-emerald-900/20 p-4 flex items-center justify-center">
        <div className="w-full max-w-sm aspect-[3/4] bg-emerald-800 rounded border-2 border-slate-300/30 relative shadow-2xl overflow-hidden">
            
            {/* Pitch Markings */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                {/* Grass Stripes */}
                <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, #000 10%, #000 20%)', opacity: 0.1 }}></div>
                
                {/* Center Line */}
                <div className="absolute top-1/2 w-full h-0.5 bg-white"></div>
                <div className="absolute top-1/2 left-1/2 w-20 h-20 -ml-10 -mt-10 rounded-full border-2 border-white"></div>
                
                {/* Penalty Areas */}
                <div className="absolute top-0 left-1/2 w-40 h-24 -ml-20 border-b-2 border-x-2 border-white"></div>
                <div className="absolute bottom-0 left-1/2 w-40 h-24 -ml-20 border-t-2 border-x-2 border-white"></div>
                
                {/* Goal Areas */}
                <div className="absolute top-0 left-1/2 w-16 h-8 -ml-8 border-b-2 border-x-2 border-white"></div>
                <div className="absolute bottom-0 left-1/2 w-16 h-8 -ml-8 border-t-2 border-x-2 border-white"></div>
            </div>

            {/* Players */}
            {bestXI.gk && renderPlayerDot(bestXI.gk, positions.gk[0])}
            {bestXI.defs.map((p, i) => renderPlayerDot(p, positions.def[i]))}
            {bestXI.mids.map((p, i) => renderPlayerDot(p, positions.mid[i]))}
            {bestXI.fwds.map((p, i) => renderPlayerDot(p, positions.fwd[i]))}

        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-xs relative">
                <button 
                    onClick={() => setSelectedPlayer(null)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white shadow-lg z-50 hover:bg-slate-600"
                >
                    <X size={16} />
                </button>
                <PlayerProfileCard player={selectedPlayer} />
            </div>
        </div>
      )}
    </div>
  );
};
