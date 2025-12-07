import React, { useState } from 'react';
import { Team, Player, Duty } from '../types';
import { PlayerProfileCard } from '../components/PlayerProfileCard';
import { TacticsPitch } from '../components/Tactics/Pitch';
import { useTactics } from '../hooks/useTactics';
import { Info, X, ChevronDown } from 'lucide-react';
import { RoleSelectionModal } from '../components/Tactics/RoleSelectionModal';

interface TacticsViewProps {
  team: Team;
  onSave?: (tactics: any) => void;
}

export const TacticsView: React.FC<TacticsViewProps> = ({ team, onSave }) => {
  const { currentFormation, availableFormations, lineup, setFormation, updatePlayerPosition } = useTactics(team);

  const defaultInstructions = team.tactics?.instructions || {
    mentality: 'Balanced',
    inPossession: { passingDirectness: 50, tempo: 50, width: 50 },
    inTransition: { counterPress: false, counter: false, distributeQuickly: false },
    outOfPossession: { lineOfEngagement: 50, defensiveLine: 50, pressingIntensity: 50 }
  };

  const [instructions, setInstructions] = useState(defaultInstructions);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showFormationSelect, setShowFormationSelect] = useState(false);
  const [activeTab, setActiveTab] = useState<'INSTRUCTIONS' | 'BENCH'>('INSTRUCTIONS');

  // Temporary state to store role assignments (should be in useTactics/Team state ideally)
  const [roleAssignments, setRoleAssignments] = useState<Record<string, { roleId: string, duty: Duty }>>({});

  const handlePlayerClick = (playerId: string) => {
    const player = team.players.find(p => p.id === playerId);
    if (player) {
      setSelectedPlayer(player);
      setShowRoleModal(true);
    }
  };

  const handleRoleSave = (roleId: string, duty: Duty) => {
    if (selectedPlayer) {
      setRoleAssignments(prev => ({
        ...prev,
        [selectedPlayer.id]: { roleId, duty }
      }));
      setShowRoleModal(false);
      setSelectedPlayer(null);
    }
  };

  const handlePlayerDrop = (playerId: string, targetPositionId: string) => {
    updatePlayerPosition(playerId, targetPositionId);
  };

  return (
    <div className="h-full flex flex-col relative bg-slate-950">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-20">
        <div className="relative">
          <button
            onClick={() => setShowFormationSelect(!showFormationSelect)}
            className="flex items-center gap-2 hover:bg-slate-800 p-2 rounded transition-colors"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-100">Tactics Board</h2>
              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                {currentFormation.name}
                <ChevronDown size={12} />
              </p>
            </div>
          </button>

          {/* Formation Dropdown */}
          {showFormationSelect && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              {availableFormations.map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => {
                    setFormation(fmt.id);
                    setShowFormationSelect(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700 transition-colors ${currentFormation.id === fmt.id ? 'text-emerald-400 font-bold bg-slate-700/50' : 'text-slate-300'}`}
                >
                  {fmt.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800 p-2 rounded-full text-emerald-500 cursor-help" title="Tactical Familiarity: 100%">
          <Info size={16} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel: Pitch */}
        <div className="flex-1 relative bg-emerald-900/10 p-4 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-md">
            <TacticsPitch
              formation={currentFormation.positions}
              lineup={lineup}
              players={team.players}
              onPlayerDrop={handlePlayerDrop}
              onPlayerClick={handlePlayerClick}
            />
          </div>

          {/* Role Selection Modal */}
          {showRoleModal && selectedPlayer && (
            <RoleSelectionModal
              player={selectedPlayer}
              currentRole={roleAssignments[selectedPlayer.id]?.roleId}
              currentDuty={roleAssignments[selectedPlayer.id]?.duty}
              onSave={handleRoleSave}
              onClose={() => {
                setShowRoleModal(false);
                setSelectedPlayer(null);
              }}
            />
          )}
        </div>

        {/* Right Panel: Instructions / Bench */}
        <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('INSTRUCTIONS')}
              className={`flex-1 py-3 px-4 font-bold text-sm transition-colors ${activeTab === 'INSTRUCTIONS'
                  ? 'bg-emerald-900/20 text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Instructions
            </button>
            <button
              onClick={() => setActiveTab('BENCH')}
              className={`flex-1 py-3 px-4 font-bold text-sm transition-colors ${activeTab === 'BENCH'
                  ? 'bg-emerald-900/20 text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              Substitutes
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Instructions Content */}
            <div className={`space-y-6 ${activeTab === 'INSTRUCTIONS' ? 'block' : 'hidden'}`}>
              {/* Mentality */}
              <div>
                <label className="text-slate-500 text-xs mb-2 block">Mentality</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-slate-200"
                  value={instructions.mentality}
                  onChange={(e) => setInstructions(prev => ({ ...prev, mentality: e.target.value }))}
                >
                  {['Very Defensive', 'Defensive', 'Cautious', 'Balanced', 'Positive', 'Attacking', 'Very Attacking'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* In Possession */}
              <div>
                <label className="text-slate-500 text-xs mb-2 block">In Possession</label>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Passing Directness</span>
                    <span className="text-emerald-400">{instructions.inPossession.passingDirectness}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={instructions.inPossession.passingDirectness}
                    onChange={(e) => setInstructions(prev => ({
                      ...prev,
                      inPossession: { ...prev.inPossession, passingDirectness: Number(e.target.value) }
                    }))}
                  />

                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Tempo</span>
                    <span className="text-emerald-400">{instructions.inPossession.tempo}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={instructions.inPossession.tempo}
                    onChange={(e) => setInstructions(prev => ({
                      ...prev,
                      inPossession: { ...prev.inPossession, tempo: Number(e.target.value) }
                    }))}
                  />

                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Width</span>
                    <span className="text-emerald-400">{instructions.inPossession.width}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={instructions.inPossession.width}
                    onChange={(e) => setInstructions(prev => ({
                      ...prev,
                      inPossession: { ...prev.inPossession, width: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              {/* Out of Possession */}
              <div>
                <label className="text-slate-500 text-xs mb-2 block">Out of Possession</label>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Line of Engagement</span>
                    <span className="text-emerald-400">{instructions.outOfPossession.lineOfEngagement}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={instructions.outOfPossession.lineOfEngagement}
                    onChange={(e) => setInstructions(prev => ({
                      ...prev,
                      outOfPossession: { ...prev.outOfPossession, lineOfEngagement: Number(e.target.value) }
                    }))}
                  />

                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Defensive Line</span>
                    <span className="text-emerald-400">{instructions.outOfPossession.defensiveLine}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={instructions.outOfPossession.defensiveLine}
                    onChange={(e) => setInstructions(prev => ({
                      ...prev,
                      outOfPossession: { ...prev.outOfPossession, defensiveLine: Number(e.target.value) }
                    }))}
                  />

                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Pressing Intensity</span>
                    <span className="text-emerald-400">{instructions.outOfPossession.pressingIntensity}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={instructions.outOfPossession.pressingIntensity}
                    onChange={(e) => setInstructions(prev => ({
                      ...prev,
                      outOfPossession: { ...prev.outOfPossession, pressingIntensity: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              {/* In Transition */}
              <div className="space-y-2">
                <label className="text-slate-500 text-xs mb-2 block">In Transition</label>
                {['counterPress', 'counter', 'distributeQuickly'].map(key => (
                  <label key={key} className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={(instructions.inTransition as any)[key]}
                      onChange={(e) => setInstructions(prev => ({
                        ...prev,
                        inTransition: { ...prev.inTransition, [key]: e.target.checked }
                      }))}
                    />
                    {key === 'counterPress' ? 'Counter-Press' : key === 'counter' ? 'Counter' : 'Distribute Quickly'}
                  </label>
                ))}
              </div>

              <button
                onClick={() => {
                  if (!onSave) return;
                  const tacticsPayload = {
                    formation: currentFormation.id,
                    instructions,
                    lineup: lineup.map(l => ({
                      positionId: l.positionId,
                      playerId: l.playerId,
                      role: 'Generic',
                      duty: 'Support'
                    }))
                  };
                  onSave(tacticsPayload);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded shadow mt-2"
              >
                保存战术
              </button>
            </div>

            {/* Bench Content */}
            <div className={`space-y-4 ${activeTab === 'BENCH' ? 'block' : 'hidden'}`}>
              <p className="text-xs text-slate-500 italic mb-4">Drag players onto the pitch to make substitutions</p>

              {team.players
                .filter(p => !lineup.find(pos => pos.playerId === p.id))
                .map(player => (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('playerId', player.id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="bg-slate-800 p-3 rounded border border-slate-700 hover:bg-slate-700 cursor-move transition-colors flex items-center gap-3 group"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-slate-200 text-sm group-hover:text-emerald-400 transition-colors">{player.name}</div>
                      <div className="text-xs text-slate-400 flex gap-2">
                        <span className={`${player.position === 'GK' ? 'text-yellow-400' :
                            player.position === 'DEF' ? 'text-blue-400' :
                              player.position === 'MID' ? 'text-emerald-400' :
                                'text-red-400'
                          } font-bold`}>{player.position}</span>
                        <span className="text-slate-500">|</span>
                        <span>CA: <span className="text-slate-300">{player.ca}</span></span>
                      </div>
                    </div>
                  </div>
                ))}

              {team.players.filter(p => !lineup.find(pos => pos.playerId === p.id)).length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No players on bench
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
