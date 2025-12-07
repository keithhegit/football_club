import React, { useState, useMemo } from 'react';
import { Team } from '../types';
import { useTactics } from '../hooks/useTactics';
import { Info, ChevronDown } from 'lucide-react';
import { GUIDED_FORMATIONS } from '../utils/tacticsPresets';
import { getPlayerAvatar } from '../utils/avatar';

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
  const [showFormationSelect, setShowFormationSelect] = useState(false);
  const [activeTab, setActiveTab] = useState<'INSTRUCTIONS' | 'BENCH'>('INSTRUCTIONS');
  const [replaceTarget, setReplaceTarget] = useState<{ positionId: string; playerName?: string } | null>(null);

  const handlePlayerDrop = (playerId: string, targetPositionId: string) => {
    updatePlayerPosition(playerId, targetPositionId);
  };

  const benchPlayers = useMemo(
    () => team.players.filter(p => !lineup.find(pos => pos.playerId === p.id)),
    [team.players, lineup]
  );

  return (
    <div className="h-full flex flex-col relative bg-slate-950">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFormationSelect(!showFormationSelect)}
              className="flex items-center gap-2 hover:bg-slate-800 p-2 rounded transition-colors"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-100">战术板</h2>
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
        </div>

        <div className="bg-slate-800 p-2 rounded-full text-emerald-500 cursor-help" title="战术熟练度(占位)">
          <Info size={16} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full flex flex-col bg-slate-950">
          <div className="flex border-b border-slate-800">
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

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Instructions Tab */}
            {activeTab === 'INSTRUCTIONS' && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-6">
                <div className="text-sm font-bold text-slate-200">球队指令</div>
                <div>
                  <label className="text-slate-500 text-xs mb-2 block">心态</label>
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

                <div>
                  <div className="text-xs text-slate-400 mb-1">控球时</div>
                  {[
                    { key: 'passingDirectness', label: '传球直接性' },
                    { key: 'tempo', label: '节奏' },
                    { key: 'width', label: '宽度' },
                  ].map(item => (
                    <div key={item.key} className="mb-3">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>{item.label}</span>
                        <span className="text-emerald-400">{(instructions.inPossession as any)[item.key]}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={(instructions.inPossession as any)[item.key]}
                        onChange={(e) => setInstructions(prev => ({
                          ...prev,
                          inPossession: { ...prev.inPossession, [item.key]: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1">无球时</div>
                  {[
                    { key: 'lineOfEngagement', label: '逼抢线' },
                    { key: 'defensiveLine', label: '防线' },
                    { key: 'pressingIntensity', label: '压迫强度' },
                  ].map(item => (
                    <div key={item.key} className="mb-3">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>{item.label}</span>
                        <span className="text-emerald-400">{(instructions.outOfPossession as any)[item.key]}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={(instructions.outOfPossession as any)[item.key]}
                        onChange={(e) => setInstructions(prev => ({
                          ...prev,
                          outOfPossession: { ...prev.outOfPossession, [item.key]: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-2">转换</div>
                  {['counterPress', 'counter', 'distributeQuickly'].map(key => (
                    <label key={key} className="flex items-center gap-2 text-xs text-slate-300 mb-1">
                      <input
                        type="checkbox"
                        checked={(instructions.inTransition as any)[key]}
                        onChange={(e) => setInstructions(prev => ({
                          ...prev,
                          inTransition: { ...prev.inTransition, [key]: e.target.checked }
                        }))}
                      />
                      {key === 'counterPress' ? '反抢' : key === 'counter' ? '反击' : '快速发球'}
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
            )}

            {/* Bench Tab (pitch only, click avatar to替换) */}
            {activeTab === 'BENCH' && (
              <div className="space-y-4">
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                  <div className="text-sm font-bold text-slate-200 mb-2">阵型 & 首发（拖拽替换，头像可点击）</div>
                  <div className="aspect-[9/12] md:aspect-[16/10] bg-emerald-950/40 rounded-lg border border-emerald-800/40 relative">
                    <div className="absolute inset-0 flex flex-col">
                      <div className="flex-1 border-b border-emerald-800/30"></div>
                      <div className="flex-1 border-b border-emerald-800/30"></div>
                      <div className="flex-1"></div>
                    </div>
                    {currentFormation.positions.map((pos) => {
                      const assigned = lineup.find(l => l.positionId === pos.id);
                      const player = team.players.find(p => p.id === assigned?.playerId);
                      const avatar = getPlayerAvatar(player?.name || '', player?.id);
                      return (
                        <div
                          key={pos.id}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 cursor-pointer"
                          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                          onClick={() => player && setReplaceTarget({ positionId: pos.id, playerName: player.name })}
                          draggable
                          onDragStart={(e) => {
                            if (player) {
                              e.dataTransfer.setData('playerId', String(player.id));
                              e.dataTransfer.effectAllowed = 'move';
                            }
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            const pid = e.dataTransfer.getData('playerId');
                            if (pid) handlePlayerDrop(pid, pos.id);
                          }}
                        >
                          <img src={avatar} alt={player?.name || pos.name} className="w-12 h-12 rounded-full border-2 border-emerald-400 shadow" />
                          <div className="px-2 py-1 bg-slate-900/80 rounded text-[10px] text-emerald-300 border border-emerald-700">
                            {pos.name} {player ? `· ${player.name}` : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
      {replaceTarget && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center px-4" onClick={() => setReplaceTarget(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold text-slate-200 mb-2">选择替换球员</div>
            <div className="text-xs text-slate-400 mb-3">当前位置：{replaceTarget.playerName || replaceTarget.positionId}</div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {benchPlayers.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    handlePlayerDrop(String(p.id), replaceTarget.positionId);
                    setReplaceTarget(null);
                  }}
                  className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-left p-3 rounded border border-slate-700 transition"
                >
                  <img src={getPlayerAvatar(p.name, p.id)} className="w-10 h-10 rounded-full border border-emerald-600" />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-100">{p.name}</div>
                    <div className="text-[11px] text-slate-400 flex gap-2">
                      <span className={`${p.position === 'GK' ? 'text-yellow-400' :
                          p.position === 'DEF' ? 'text-blue-400' :
                            p.position === 'MID' ? 'text-emerald-400' :
                              'text-red-400'
                        } font-bold`}>{p.position}</span>
                      <span className="text-slate-500">|</span>
                      <span>CA: <span className="text-slate-300">{p.ca}</span></span>
                    </div>
                  </div>
                </button>
              ))}
              {benchPlayers.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-4">无可用替补</div>
              )}
            </div>
            <button onClick={() => setReplaceTarget(null)} className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded">取消</button>
          </div>
        </div>
      )}
    </div>
  );
};
