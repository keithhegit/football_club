import React, { useState, useEffect, useRef } from 'react';
import { Team, MatchState } from '../types';
import { matchSimulator } from '../services/matchSimulator';
import { MatchEngine } from '../engine/matchEngine'; // Direct import of new engine
import { TeamState, MatchEvent } from '../engine/types'; // Import new types
import { Play, Pause, FastForward, CheckCircle2, SkipForward } from 'lucide-react';
import { generatePostMatchComment, getAssistantReport } from '../services/geminiService';

interface MatchViewProps {
  homeTeam: Team;
  awayTeam: Team;
  onMatchComplete: (homeScore: number, awayScore: number) => void;
  userTeamId: string;
  fixtureId?: string; // New prop for local simulation
}

// -----------------------------------------------------------------------------
// Helper Components & Functions (Unified Features)
// -----------------------------------------------------------------------------

// Simple pseudo-rating calculator
function calculateMockRating(player: any, events: any[]): number {
  let rating = 6.0;
  const playerEvents = events.filter(e => e.actor?.id === player.id);

  // Positive actions
  const successPasses = playerEvents.filter(e => e.type.includes('PASS') && e.outcome === 'SUCCESS').length;
  const successDribbles = playerEvents.filter(e => e.type === 'DRIBBLE' && e.outcome === 'SUCCESS').length;
  const tackles = playerEvents.filter(e => (e.type === 'TACKLE' || e.type === 'INTERCEPT') && e.outcome === 'SUCCESS').length;
  const goals = playerEvents.filter(e => e.type === 'SHOOT' && e.outcome === 'SUCCESS').length;
  const shotsOnTarget = playerEvents.filter(e => e.type === 'SHOOT' && e.outcome === 'SUCCESS' && !e.description.includes('GOAL')).length;

  // Negative actions
  const fouls = playerEvents.filter(e => e.type === 'FOUL').length;
  const failedPasses = playerEvents.filter(e => e.type.includes('PASS') && e.outcome === 'FAILURE').length;

  rating += (successPasses * 0.05);
  rating += (successDribbles * 0.2);
  rating += (tackles * 0.3);
  rating += (goals * 1.5);
  rating += (shotsOnTarget * 0.3);

  rating -= (fouls * 0.4);
  rating -= (failedPasses * 0.05);

  return Math.min(10, Math.max(4, rating));
}

// Stat Row Component
const StatRow: React.FC<{ label: string; homeValue: string; awayValue: string }> = ({ label, homeValue, awayValue }) => (
  <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
    <span className="text-emerald-400 font-semibold w-16 text-right text-xs">{homeValue}</span>
    <span className="text-slate-400 flex-1 text-center text-[10px] uppercase tracking-wider">{label}</span>
    <span className="text-blue-400 font-semibold w-16 text-left text-xs">{awayValue}</span>
  </div>
);

// -----------------------------------------------------------------------------
// MatchView Component
// -----------------------------------------------------------------------------

export const MatchView: React.FC<MatchViewProps> = ({ homeTeam, awayTeam, onMatchComplete, userTeamId, fixtureId }) => {
  const [minute, setMinute] = useState(0);
  const [scores, setScores] = useState({ home: 0, away: 0 });
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null); // Dynamic stats state
  const [matchState, setMatchState] = useState<MatchState>(MatchState.PRE_MATCH);
  const [speed, setSpeed] = useState(1000); // ms per tick (default 1x)
  const [paused, setPaused] = useState(false);
  const [mvp, setMvp] = useState<{ name: string; rating: number; isHome: boolean } | null>(null);
  const [assistantReport, setAssistantReport] = useState<string>("");
  const [headline, setHeadline] = useState<string>("");
  const [filter, setFilter] = useState<string>('IMPORTANT'); // Default filter to interesting events
  const [showTactics, setShowTactics] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [homeLineup, setHomeLineup] = useState<any[]>(homeTeam.players?.slice(0, 11) || []);
  const [awayLineup, setAwayLineup] = useState<any[]>(awayTeam.players?.slice(0, 11) || []);
  const [homeBench, setHomeBench] = useState<any[]>(homeTeam.players?.slice(11) || []);
  const [awayBench, setAwayBench] = useState<any[]>(awayTeam.players?.slice(11) || []);
  const [subOutId, setSubOutId] = useState<string | number | undefined>(undefined);
  const [subInId, setSubInId] = useState<string | number | undefined>(undefined);
  const [subsUsed, setSubsUsed] = useState<number>(0);
  const [engine, setEngine] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Match Engine Instance
  const engineRef = useRef<any>(null);
  const [fullMatchResult, setFullMatchResult] = useState<any>(null);
  const [tacticalModifiers, setTacticalModifiers] = useState<any>({
    mentality: 0,
    tempo: 0,
    directness: 0,
    width: 0,
    defensiveLine: 0,
    engagementLine: 0,
    pressingIntensity: 0,
    timeWasting: 0,
    counterPress: false,
    counter: false,
    workBallIntoBox: false,
    hitEarlyCrosses: false,
    shootOnSight: false,
    stayOnFeet: false,
    tackleHarder: false,
    closeDownMore: false,
    markTighter: false
  });

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  // Map team tactics instructions to tactical modifiers for match engine
  const mapInstructionsToModifiers = (team: Team) => {
    const instr = team.tactics?.instructions;
    if (!instr) return tacticalModifiers;
    const scale = (val: number) => Math.max(-2, Math.min(2, (val - 50) / 25));
    return {
      ...tacticalModifiers,
      mentality: 0,
      directness: scale(instr.inPossession.passingDirectness),
      tempo: scale(instr.inPossession.tempo),
      width: scale(instr.inPossession.width),
      defensiveLine: scale(instr.outOfPossession.defensiveLine),
      engagementLine: scale(instr.outOfPossession.lineOfEngagement),
      pressingIntensity: scale(instr.outOfPossession.pressingIntensity),
      counterPress: instr.inTransition.counterPress,
      counter: instr.inTransition.counter,
      distributeQuickly: instr.inTransition.distributeQuickly
    };
  };

  // Preload tactical modifiers from user team tactics
  useEffect(() => {
    const userTeam = userTeamId === homeTeam.id ? homeTeam : awayTeam;
    if (userTeam?.tactics?.instructions) {
      setTacticalModifiers(mapInstructionsToModifiers(userTeam));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeTeam, awayTeam, userTeamId]);
  const getSnapshotMaps = (m: number) => {
    if (!snapshots || snapshots.length === 0) {
      // fallback: simple decay so halftime不再全100/75
      const decay = Math.min(70, m * 0.8);
      const moraleAdj = Math.max(-15, -(m * 0.1));
      const fallbackMap = (team: any[]) => new Map(team.map(p => [p.id, {
        id: p.id,
        stamina: Math.max(30, (p.stamina ?? p.condition ?? 100) - decay),
        morale: Math.max(50 + moraleAdj, p.morale ?? 75),
        condition: Math.max(30, (p.condition ?? p.stamina ?? 100) - decay)
      }]));
      return { home: fallbackMap(homeLineup), away: fallbackMap(awayLineup) };
    }
    // pick latest snapshot <= minute
    let snap = snapshots[0];
    for (const s of snapshots) {
      if (s.minute <= m) snap = s;
      else break;
    }
    const home = new Map(snap.home?.map((p: any) => [p.id, p]));
    const away = new Map(snap.away?.map((p: any) => [p.id, p]));
    return { home, away };
  };

  // 1. Initialize Engine and Simulate Full Match on Mount (or Start)
  useEffect(() => {
    if (matchState === MatchState.PLAYING && !fullMatchResult) {
      const runSimulation = async () => {
        let result;
        // PLAN A: Use Local Simulator (Real Data)
        if (fixtureId) {
          console.log("Starting LOCAL simulation for fixture:", fixtureId);
          const hId = homeTeam.id.toString();
          const aId = awayTeam.id.toString();
          result = await matchSimulator.simulateFixture(fixtureId, hId, aId);
        }
        // PLAN B: Legacy/Direct Simulation (Fallback)
        else {
          console.log("Starting LEGACY simulation (No Fixture ID)");
          const hTeamState: TeamState = {
            id: homeTeam.id.toString(),
            name: homeTeam.name,
            players: (homeTeam.players || []).slice(0, 11).map((p: any) => ({
              id: p.id,
              name: p.name,
              position: p.position || 'MC',
              attributes: p.attributes || {},
              condition: p.condition ?? p.stamina ?? 100,
              stamina: p.stamina ?? p.condition ?? 100,
              currentPosition: { x: 50, y: 50 },
              morale: p.morale ?? 75,
              form: p.form ?? 75,
              yellowCards: 0,
              redCard: false
            })),
            formation: '4-4-2',
            tacticalModifiers: tacticalModifiers
          };

          const aTeamState: TeamState = {
            id: awayTeam.id.toString(),
            name: awayTeam.name,
            players: (awayTeam.players || []).slice(0, 11).map((p: any) => ({
              id: p.id,
              name: p.name,
              position: p.position || 'MC',
              attributes: p.attributes || {},
              condition: p.condition ?? p.stamina ?? 100,
              stamina: p.stamina ?? p.condition ?? 100,
              currentPosition: { x: 50, y: 50 },
              morale: p.morale ?? 75,
              form: p.form ?? 75,
              yellowCards: 0,
              redCard: false
            })),
            formation: '4-4-2',
            tacticalModifiers: tacticalModifiers
          };

          const engine = new MatchEngine(hTeamState, aTeamState);
          setEngine(engine);
          result = engine.simulateMatch();
        }
        setFullMatchResult(result);
        setSnapshots(result?.snapshots || []);
      };
      runSimulation();
    }
  }, [matchState, fullMatchResult, fixtureId, homeTeam, awayTeam, tacticalModifiers]);

  // Sync initial lineups/bench on teams change
  useEffect(() => {
    setHomeLineup(homeTeam.players?.slice(0, 11) || []);
    setAwayLineup(awayTeam.players?.slice(0, 11) || []);
    setHomeBench(homeTeam.players?.slice(11) || []);
    setAwayBench(awayTeam.players?.slice(11) || []);
    setSubsUsed(0);
    setSubOutId(undefined);
    setSubInId(undefined);
  }, [homeTeam, awayTeam]);

  // 2. Replay Loop & Dynamic Stats Calculation
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (matchState === MatchState.PLAYING && fullMatchResult && !paused) {
      interval = setInterval(() => {
        setMinute((prevMinute) => {
          if (prevMinute >= 90) {
            setMatchState(MatchState.FULL_TIME);
            return 90;
          }
          const currentMinute = prevMinute + 1;

          // Auto-pause at half-time
          if (currentMinute === 45 && !paused) {
            setPaused(true);
            setShowTactics(true);
          }

          // Filter events up to current minute
          // Use 'eventLog' as per MatchResult interface in types.ts
          // Use 'time' as per MatchEvent interface
          const currentEvents = (fullMatchResult.eventLog || []).filter((e: any) => e.time <= currentMinute);
          setEvents(currentEvents);

          // Update Score
          // Use == for loose equality (string/number)
          const homeGoals = currentEvents.filter((e: any) => (e.type === 'SHOOT' || e.type === 'SHOOT_LONG') && e.outcome === 'SUCCESS' && e.teamId == homeTeam.id).length;
          const awayGoals = currentEvents.filter((e: any) => (e.type === 'SHOOT' || e.type === 'SHOOT_LONG') && e.outcome === 'SUCCESS' && e.teamId == awayTeam.id).length;
          setScores({ home: homeGoals, away: awayGoals });

          // Calculate Dynamic Stats
          // Initialize with default structure
          const stats = {
            possession: [50, 50],
            xG: [0, 0],
            shots: [0, 0],
            shotsOnTarget: [0, 0],
            passes: [0, 0],
            passAttempts: [0, 0],
            passSuccess: [0, 0],
            tackles: [0, 0],
            fouls: [0, 0],
            yellowCards: [0, 0],
            redCards: [0, 0],
            corners: [0, 0],
            freeKicks: [0, 0]
          };

          // Aggregate stats from events
          currentEvents.forEach((e: any) => {
            const isHome = e.teamId == homeTeam.id;
            const idx = isHome ? 0 : 1;

            // xG Accumulation (if available)
            if (e.xGContribution) stats.xG[idx] += e.xGContribution;
            else if (e.type === 'SHOOT' || e.type === 'SHOOT_LONG') stats.xG[idx] += 0.08; // fallback

            // Shots
            if (e.type === 'SHOOT' || e.type === 'SHOOT_LONG') {
              stats.shots[idx]++;
              if (e.outcome === 'SUCCESS' || e.type === 'SAVE' || e.description.includes('saved')) {
                // Note: SAVE event is for the goalkeeper, so it implies a shot ON TARGET for the OPPONENT.
                // But here we are processing the 'SHOOT' event itself usually.
                // If e.type is SAVE, it belongs to the Goalkeeper's team (defending).
                // So we shouldn't count SAVE as a shot for the teamId.
                // We should only count 'SHOOT' events.
                if (e.outcome === 'SUCCESS') stats.shotsOnTarget[idx]++;
              }
            }
            // Fix: Also check for SAVE events which are separate
            if (e.type === 'SAVE') {
              // If teamId made a SAVE, then the OPPOSING team had a shot on target.
              const opponentIdx = idx === 0 ? 1 : 0;
              stats.shotsOnTarget[opponentIdx]++;
            }

            // Passes
            if (e.type.includes('PASS')) {
              stats.passAttempts[idx]++;
              if (e.outcome === 'SUCCESS') {
                stats.passes[idx]++;
                stats.passSuccess[idx]++;
              }
            }

            // Tackles
            if ((e.type === 'TACKLE' || e.type === 'INTERCEPT') && e.outcome === 'SUCCESS') {
              stats.tackles[idx]++;
            }

            // Fouls & Cards
            if (e.type === 'FOUL') {
              stats.fouls[idx]++;
            }
            if (e.description?.toLowerCase().includes('yellow')) stats.yellowCards[idx]++;
            if (e.description?.toLowerCase().includes('red')) stats.redCards[idx]++;
            if (e.type === 'CORNER') stats.corners[idx]++;
            if (e.type === 'FREE_KICK') stats.freeKicks[idx]++;
          });

          // Possession proxy: passes share
          const totalPasses = stats.passAttempts[0] + stats.passAttempts[1];
          if (totalPasses > 0) {
            stats.possession[0] = Math.round((stats.passAttempts[0] / totalPasses) * 100);
            stats.possession[1] = 100 - stats.possession[0];
          }

          setCurrentStats(stats);
          return currentMinute;
        });
      }, speed);
    }
    else if (matchState === MatchState.FULL_TIME) {
      if (!headline) {
        generatePostMatchComment(homeTeam, awayTeam, scores.home, scores.away).then(setHeadline);
      }
    }

    return () => clearInterval(interval);
  }, [matchState, fullMatchResult, speed, paused, homeTeam, awayTeam, headline]);

  // Compute MVP after full time using playerRatings if available, fallback to event-based rating
  useEffect(() => {
    if (matchState !== MatchState.FULL_TIME || !fullMatchResult) return;
    let best: { name: string; rating: number; isHome: boolean } | null = null;

    if (fullMatchResult.playerRatings && fullMatchResult.playerRatings.size > 0) {
      fullMatchResult.playerRatings.forEach((rating: number, pid: number) => {
        const player = homeTeam.players.find((p: any) => p.id == pid) || awayTeam.players.find((p: any) => p.id == pid);
        if (player && (best === null || rating > best.rating)) {
          best = { name: player.name, rating, isHome: !!homeTeam.players.find((p: any) => p.id == pid) };
        }
      });
    } else {
      // fallback using mock rating
      const allPlayers = [...(homeTeam.players || []), ...(awayTeam.players || [])];
      allPlayers.forEach(p => {
        const r = calculateMockRating(p, fullMatchResult.eventLog || []);
        if (best === null || r > best.rating) {
          best = { name: p.name, rating: r, isHome: !!homeTeam.players.find((hp: any) => hp.id === p.id) };
        }
      });
    }
    setMvp(best);
  }, [matchState, fullMatchResult, homeTeam, awayTeam]);

  // Initial Assistant Report (optional)
  useEffect(() => {
    if (matchState === MatchState.PRE_MATCH && !assistantReport) {
      const myTeam = userTeamId === homeTeam.id ? homeTeam : awayTeam;
      const opponent = userTeamId === homeTeam.id ? awayTeam : homeTeam;
      getAssistantReport(opponent, myTeam).then(setAssistantReport);
    }
  }, [homeTeam, awayTeam, userTeamId, matchState, assistantReport]);

  const handleStart = () => setMatchState(MatchState.PLAYING);

  const handleFinish = () => {
    onMatchComplete(scores.home, scores.away);
  };

  const handleBackToDashboard = () => {
    onMatchComplete(scores.home, scores.away);
  };

  const handlePauseToggle = () => setPaused((p) => !p);

  const setSpeedPreset = (preset: '1x' | '2x' | '4x') => {
    if (preset === '1x') setSpeed(1000);
    if (preset === '2x') setSpeed(500);
    if (preset === '4x') setSpeed(250);
  };

  const snapshotMaps = getSnapshotMaps(minute);

  // Substitution helper (UI only; stats不变但便于查看/计划)
  const applySubstitution = () => {
    if (subsUsed >= 3) return;
    if (!subOutId || !subInId) return;
    const isHome = userTeamId === homeTeam.id;
    const lineup = isHome ? [...homeLineup] : [...awayLineup];
    const bench = isHome ? [...homeBench] : [...awayBench];
    const outIdx = lineup.findIndex(p => p.id == subOutId);
    const inIdx = bench.findIndex(p => p.id == subInId);
    if (outIdx === -1 || inIdx === -1) return;
    const outPlayer = lineup[outIdx];
    const inPlayer = bench[inIdx];
    lineup[outIdx] = inPlayer;
    bench.splice(inIdx, 1);
    bench.push(outPlayer); // moved to bench
    // Apply to engine state for downstream snapshots if engine exists
    if (engine) {
      engine.applySubstitution(isHome ? 'home' : 'away', outPlayer.id, inPlayer.id);
    }
    if (isHome) {
      setHomeLineup(lineup);
      setHomeBench(bench);
    } else {
      setAwayLineup(lineup);
      setAwayBench(bench);
    }
    setSubsUsed(subsUsed + 1);
    setSubOutId(undefined);
    setSubInId(undefined);
    // Record a visual event for log
    setEvents(prev => [...prev, {
      time: minute,
      type: 'FOUL', // reuse type field to fit union; description clarifies
      actor: outPlayer,
      opponent: inPlayer,
      outcome: 'SUCCESS',
      position: { x: 50, y: 50 },
      description: `Substitution: ${outPlayer.name} ⬇  ${inPlayer.name} ⬆`,
      teamId: isHome ? homeTeam.id : awayTeam.id
    } as any]);
  };

  return (
    <div
      className="flex flex-col h-full bg-slate-950"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
      }}
    >

      {/* Tactics Drawer */}
      {showTactics && (
        <div className="absolute inset-0 bg-black/40 z-30" onClick={() => setShowTactics(false)} />
      )}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-40 transform transition-transform duration-200 ${showTactics ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
          <div className="text-sm font-bold text-slate-200 uppercase">战术板 (In-Match)</div>
          <button onClick={() => setShowTactics(false)} className="text-slate-400 text-xs">关闭</button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-56px)]">
          {/* Sliders */}
          {[
            { key: 'mentality', label: '心态(Mentality)', min: -2, max: 2, step: 1 },
            { key: 'tempo', label: '节奏(Tempo)', min: -2, max: 2, step: 1 },
            { key: 'directness', label: '传球直接性', min: -2, max: 2, step: 1 },
            { key: 'width', label: '进攻宽度', min: -2, max: 2, step: 1 },
            { key: 'pressingIntensity', label: '压迫强度', min: -2, max: 2, step: 1 },
            { key: 'defensiveLine', label: '防线高度', min: -2, max: 2, step: 1 },
            { key: 'engagementLine', label: '逼抢线', min: -2, max: 2, step: 1 },
            { key: 'timeWasting', label: '拖延时间', min: 0, max: 1, step: 0.1 },
          ].map(ctrl => (
            <div key={ctrl.key} className="flex flex-col gap-1">
              <label className="text-xs text-slate-300">{ctrl.label}</label>
              <input
                type="range"
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step}
                value={tacticalModifiers[ctrl.key] ?? 0}
                onChange={(e) => setTacticalModifiers(prev => ({ ...prev, [ctrl.key]: Number(e.target.value) }))}
              />
              <div className="text-[10px] text-slate-500">当前: {tacticalModifiers[ctrl.key] ?? 0}</div>
            </div>
          ))}

          {/* Toggles */}
          {[
            { key: 'counterPress', label: '反抢 (Counter-Press)' },
            { key: 'counter', label: '反击 (Counter)' },
            { key: 'workBallIntoBox', label: '倒脚渗透 (Work Ball Into Box)' },
            { key: 'hitEarlyCrosses', label: '提前传中 (Hit Early Crosses)' },
            { key: 'shootOnSight', label: '见缝就射 (Shoot on Sight)' },
            { key: 'stayOnFeet', label: '站立防守 (Stay on Feet)' },
            { key: 'tackleHarder', label: '强硬抢断 (Tackle Harder)' },
            { key: 'closeDownMore', label: '更多压迫 (Close Down More)' },
            { key: 'markTighter', label: '紧逼盯人 (Mark Tighter)' },
          ].map(ctrl => (
            <label key={ctrl.key} className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={!!tacticalModifiers[ctrl.key]}
                onChange={(e) => setTacticalModifiers(prev => ({ ...prev, [ctrl.key]: e.target.checked }))}
              />
              {ctrl.label}
            </label>
          ))}

          <div className="flex gap-2">
            <button
              onClick={() => setShowTactics(false)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2 rounded"
            >
              应用
            </button>
          </div>

          {/* Lineups & Quick Subs (user team only) */}
            <div className="space-y-3">
            <div className="text-xs text-slate-400 font-bold uppercase">球员状态 (Your Team)</div>
            {(() => {
              const isHome = userTeamId === homeTeam.id;
              const lineup = isHome ? homeLineup : awayLineup;
              const bench = isHome ? homeBench : awayBench;
              return (
                <>
                  <div className="text-[10px] text-slate-500">首发 11 人</div>
                  {lineup.map((p: any) => {
                    const snapEntry = (isHome ? snapshotMaps.home : snapshotMaps.away).get(p.id);
                    const staminaVal = Math.min(100, snapEntry?.stamina ?? p.stamina ?? p.condition ?? 100);
                    const moraleVal = Math.min(100, snapEntry?.morale ?? p.morale ?? 75);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSubOutId(p.id)}
                        className={`flex flex-col gap-1 text-xs text-slate-200 border-b border-slate-800 py-2 cursor-pointer ${subOutId == p.id ? 'bg-slate-800/60' : ''}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate w-32">{p.name}</span>
                          <span className="text-slate-500">Pos {p.position} · XI</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 w-10">体能</span>
                          <div className="w-full h-2 bg-slate-800 rounded">
                            <div className="h-2 rounded bg-emerald-500" style={{ width: `${staminaVal}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-8 text-right">{staminaVal}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 w-10">士气</span>
                          <div className="w-full h-2 bg-slate-800 rounded">
                            <div className="h-2 rounded bg-blue-500" style={{ width: `${moraleVal}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-8 text-right">{moraleVal}%</span>
                        </div>
                      </div>
                    );
                  })}
            <div className="text-[10px] text-slate-500 pt-2">替补 {bench.length} 人</div>
                  {bench.map((p: any) => {
                const snapEntry = (isHome ? snapshotMaps.home : snapshotMaps.away).get(p.id);
                const staminaVal = Math.min(100, snapEntry?.stamina ?? p.stamina ?? p.condition ?? 100);
                const moraleVal = Math.min(100, snapEntry?.morale ?? p.morale ?? 75);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSubInId(p.id)}
                    className={`flex flex-col gap-1 text-xs text-slate-200 border-b border-slate-800 py-2 cursor-pointer ${subInId == p.id ? 'bg-slate-800/60' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                          <span className="truncate w-32">{p.name}</span>
                          <span className="text-slate-500">Pos {p.position} · Bench</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-10">体能</span>
                      <div className="w-full h-2 bg-slate-800 rounded">
                        <div className="h-2 rounded bg-emerald-500" style={{ width: `${staminaVal}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 w-8 text-right">{staminaVal}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-10">士气</span>
                      <div className="w-full h-2 bg-slate-800 rounded">
                        <div className="h-2 rounded bg-blue-500" style={{ width: `${moraleVal}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 w-8 text-right">{moraleVal}%</span>
                    </div>
                  </div>
                    );
                  })}
                </>
              );
            })()}

            {/* Substitutions UI (3 max) */}
            <div className="space-y-2 border border-slate-800 rounded p-3 bg-slate-800/30">
              <div className="text-[10px] text-slate-400">换人（最多 3 次）已用 {subsUsed}/3</div>
              <div className="text-[11px] text-slate-300">步骤：点击首发选择“下场”，点击替补选择“上场”，再确认。</div>
              <div className="flex flex-col gap-2">
                <div className="text-[11px] text-emerald-400">下场：{subOutId ? `${(userTeamId === homeTeam.id ? homeLineup : awayLineup).find(p => p.id == subOutId)?.name || ''}` : '未选'}</div>
                <div className="text-[11px] text-blue-400">上场：{subInId ? `${(userTeamId === homeTeam.id ? homeBench : awayBench).find(p => p.id == subInId)?.name || ''}` : '未选'}</div>
                <button
                  disabled={subsUsed >= 3 || !subOutId || !subInId}
                  onClick={applySubstitution}
                  className={`w-full text-xs font-bold py-2 rounded ${subsUsed >= 3 || !subOutId || !subInId ? 'bg-slate-700 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                >
                  确认换人
                </button>
                <div className="text-[10px] text-slate-500">注：当前换人仅用于战术观察，比赛结果与统计暂不变更。</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-slate-500 font-mono">
            {matchState === MatchState.PRE_MATCH ? 'PRE-MATCH' :
              matchState === MatchState.FULL_TIME ? 'FULL TIME' :
                `${minute}'`}
          </div>
          <div className="flex space-x-2 flex-wrap justify-end">
            <button onClick={() => setSpeedPreset('1x')} className={`p-1 rounded ${speed === 1000 ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>1x</button>
            <button onClick={() => setSpeedPreset('2x')} className={`p-1 rounded ${speed === 500 ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>2x</button>
            <button onClick={() => setSpeedPreset('4x')} className={`p-1 rounded ${speed === 250 ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>4x</button>
            <button onClick={handlePauseToggle} className={`p-1 rounded ${paused ? 'bg-yellow-700 text-white' : 'text-slate-500'}`}>{paused ? 'Resume' : 'Pause'}</button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 w-1/3">
            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold border border-blue-700">{homeTeam.shortName}</div>
            <span className="font-bold text-lg truncate">{homeTeam.name}</span>
          </div>
        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-1 rounded border border-slate-800">
          <span className="text-3xl font-black text-white">{scores.home}</span>
          <span className="text-slate-600 text-xl">:</span>
          <span className="text-3xl font-black text-white">{scores.away}</span>
        </div>
        <div className="flex items-center space-x-3 w-1/3 justify-end">
          <span className="font-bold text-lg truncate text-right">{awayTeam.name}</span>
          <div className="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center text-xs font-bold border border-red-700">{awayTeam.shortName}</div>
        </div>
      </div>
      {/* Tactics entry under score */}
      <div className="flex justify-center mt-2">
        <button
          onClick={() => setShowTactics(true)}
          className="px-4 py-2 rounded bg-emerald-600 text-white font-bold border border-emerald-500"
        >
          战术部署
        </button>
      </div>
      </div>

      {/* Match Content (Grid Layout) */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">

        {/* LEFT COLUMN: Statistics & Ratings */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">

          {/* Match Statistics */}
          {(matchState === MatchState.PLAYING || matchState === MatchState.FULL_TIME) && fullMatchResult?.statistics && (
            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 border-b border-slate-700 pb-2">Match Stats</h3>
              <div className="space-y-2">
                <StatRow label="Possession"
                  homeValue={`${currentStats?.possession[0] || 50}%`}
                  awayValue={`${currentStats?.possession[1] || 50}%`}
                />
                <StatRow label="xG"
                  homeValue={(currentStats?.xG[0] || 0).toFixed(2)}
                  awayValue={(currentStats?.xG[1] || 0).toFixed(2)}
                />
                <StatRow label="Shots (Target)"
                  homeValue={`${currentStats?.shots[0] || 0} (${currentStats?.shotsOnTarget[0] || 0})`}
                  awayValue={`${currentStats?.shots[1] || 0} (${currentStats?.shotsOnTarget[1] || 0})`}
                />
                <StatRow label="Passes (Accuracy)"
                  homeValue={`${currentStats?.passes[0] || 0} (${currentStats?.passAttempts[0] > 0 ? Math.round((currentStats?.passSuccess[0] / currentStats?.passAttempts[0]) * 100) : 0}%)`}
                  awayValue={`${currentStats?.passes[1] || 0} (${currentStats?.passAttempts[1] > 0 ? Math.round((currentStats?.passSuccess[1] / currentStats?.passAttempts[1]) * 100) : 0}%)`}
                />
                <StatRow label="Tackles"
                  homeValue={`${currentStats?.tackles[0] || 0}`}
                  awayValue={`${currentStats?.tackles[1] || 0}`}
                />
                <StatRow label="Fouls (Y/R)"
                  homeValue={`${currentStats?.fouls[0] || 0} (${currentStats?.yellowCards[0] || 0}/${currentStats?.redCards[0] || 0})`}
                  awayValue={`${currentStats?.fouls[1] || 0} (${currentStats?.yellowCards[1] || 0}/${currentStats?.redCards[1] || 0})`}
                />
                <StatRow label="Corners / FK"
                  homeValue={`${currentStats?.corners[0] || 0} / ${currentStats?.freeKicks[0] || 0}`}
                  awayValue={`${currentStats?.corners[1] || 0} / ${currentStats?.freeKicks[1] || 0}`}
                />
              </div>
            </div>
          )}

          {/* Top Performers (MVP & Goalscorers) */}
          {(matchState === MatchState.PLAYING || matchState === MatchState.FULL_TIME) && (
            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 border-b border-slate-700 pb-2">Match Highlights</h3>

              {/* MVP Calculation */}
              {mvp && (
                <div className="mb-4 bg-slate-800/50 p-3 rounded">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Man of the Match</div>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-sm ${mvp.isHome ? 'text-emerald-400' : 'text-blue-400'}`}>{mvp.name}</span>
                    <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs font-bold">{mvp.rating.toFixed(1)}</span>
                  </div>
                </div>
              )}

              {/* Goalscorers */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Goalscorers</div>
                {events.filter(e => (e.type === 'SHOOT' || e.type === 'SHOOT_LONG') && e.outcome === 'SUCCESS').map((e, i) => {
                  const isHome = e.teamId == homeTeam.id;
                  return (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-1 last:border-0">
                      <span className="text-slate-300">{e.actor?.name || 'Unknown'}</span>
                      <div className="flex items-center gap-2">
                        <span className={`${isHome ? 'text-emerald-500' : 'text-blue-500'} font-bold`}>{e.time}'</span>
                        <span className="text-xs">⚽</span>
                      </div>
                    </div>
                  )
                })}
                {events.filter(e => (e.type === 'SHOOT' || e.type === 'SHOOT_LONG') && e.outcome === 'SUCCESS').length === 0 && (
                  <div className="text-slate-600 text-xs italic">No goals yet</div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* RIGHT COLUMN: Log & Assistant */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden space-y-4">

          {/* Pre-Match: Tactics / Subs prompt */}
          {matchState === MatchState.PRE_MATCH && (
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-emerald-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} /> 战术与换人准备
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                开赛前/中场请调整阵型、指令与体能（点右上 Tactics）。可预先安排换人计划。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTactics(true)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-3 rounded border border-slate-600"
                >
                  打开战术
                </button>
                <button
                  onClick={handleStart}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded shadow-lg transition-all text-lg"
                >
                  Kick Off
                </button>
              </div>
            </div>
          )}

          {/* Live Commentary Log (Filtered) */}
          {(matchState === MatchState.PLAYING || matchState === MatchState.FULL_TIME) && (
            <div
              className="flex-1 bg-slate-900/50 rounded-lg border border-slate-800 flex flex-col overflow-hidden"
            >
              {/* Event Filter Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto">
                {['IMPORTANT', 'ALL', 'GOAL', 'SHOT', 'SAVE', 'SET PIECE', 'FOUL/CARD', 'INJURY'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${filter === f ? 'text-white border-b-2 border-emerald-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Scrollable List */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {events.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">The referee blows the whistle...</div>}

                {events
                  .filter(e => {
                    if (filter === 'ALL') return true;
                    if (filter === 'GOAL') return (e.type === 'SHOOT' || e.type === 'SHOOT_LONG') && e.outcome === 'SUCCESS';
                    if (filter === 'SHOT') return (e.type === 'SHOOT' || e.type === 'SHOOT_LONG');
                    if (filter === 'SAVE') return e.type === 'SAVE';
                    if (filter === 'SET PIECE') return e.type === 'CORNER' || e.type === 'FREE_KICK' || e.description?.toLowerCase().includes('penalty');
                    if (filter === 'FOUL/CARD') return e.type === 'FOUL' || e.description?.toLowerCase().includes('card') || e.description?.toLowerCase().includes('offside');
                    if (filter === 'INJURY') return e.description?.toLowerCase().includes('injury');

                    // IMPORTANT (Default)
                    if (filter === 'IMPORTANT') {
                      if ((e.type === 'SHOOT' || e.type === 'SHOOT_LONG') && e.outcome === 'SUCCESS') return true;
                      if (['SAVE', 'CORNER', 'FREE_KICK'].includes(e.type)) return true;
                      if (e.description?.toLowerCase().includes('yellow') || e.description?.toLowerCase().includes('red')) return true;
                      // Show some close shots
                      if ((e.type === 'SHOOT' || e.type === 'SHOOT_LONG') && e.outcome === 'SAVED') return true;
                      return false;
                    }

                    return true;
                  })
                  .map((e: any, idx) => (
                    <div key={idx} className={`text-sm flex space-x-3 items-start ${(e.type.includes('SHOOT') && e.outcome === 'SUCCESS') ? 'bg-slate-800/80 p-3 rounded border-l-4 border-emerald-500 shadow-md my-2' : ''}`}>
                      <span className="text-slate-500 font-mono w-8 text-right flex-shrink-0 pt-0.5">{e.time !== undefined ? e.time : e.minute}'</span>
                      <div className="flex-1">
                        <span className={(e.type.includes('SHOOT') && e.outcome === 'SUCCESS') ? 'text-white font-bold text-base' : e.description.includes('Card') ? 'text-yellow-200' : 'text-slate-300'}>
                          {e.description}
                        </span>
                        {/* Add Subtext for context if available later */}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {matchState === MatchState.FULL_TIME && (
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-center">
          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2 rounded bg-emerald-600 text-white font-bold"
          >
            返回 Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
