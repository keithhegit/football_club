import React, { useState, useEffect, useRef } from 'react';
import { Team, MatchEvent, MatchState } from '../types';
import { matchSimulator } from '../services/matchSimulator';
import { MatchEngine } from '../engine/matchEngine'; // Direct import of new engine
import { TeamState } from '../engine/types'; // Import new types
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
  const [matchState, setMatchState] = useState<MatchState>(MatchState.PRE_MATCH);
  const [speed, setSpeed] = useState(100); // ms per tick
  const [assistantReport, setAssistantReport] = useState<string>("");
  const [headline, setHeadline] = useState<string>("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Match Engine Instance
  const engineRef = useRef<any>(null);
  const [fullMatchResult, setFullMatchResult] = useState<any>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  // Initialize Engine and Simulate Full Match on Mount (or Start)
  useEffect(() => {
    if (matchState === MatchState.PLAYING && !fullMatchResult) {

      const simulate = async () => {
        try {
          let result;

          // PLAN A: Use Local Simulator (Real Data)
          if (fixtureId) {
            console.log("Starting LOCAL simulation for fixture:", fixtureId);
            // We need to map team IDs to strings if they are numbers
            const hId = homeTeam.id.toString();
            const aId = awayTeam.id.toString();
            result = await matchSimulator.simulateFixture(fixtureId, hId, aId);
          }
          // PLAN B: Legacy/Direct Simulation (Fallback)
          else {
            console.log("Starting LEGACY simulation (No Fixture ID)");
            // Convert legacy teams to TeamState structure if needed
            // For now, simpler to use the Engine directly with casting or mapping
            // Assuming props `homeTeam` has `players` array

            // Quick mapping for legacy props -> TeamState
            const hTeamState: TeamState = {
              id: homeTeam.id.toString(),
              name: homeTeam.name,
              players: (homeTeam.players || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                position: p.position || 'MC',
                attributes: p.attributes || {},
                condition: 100,
                stamina: 100,
                currentPosition: { x: 50, y: 50 },
                // ... other REQUIRED fields for PlayerState
                morale: 75, form: 75, yellowCards: 0, redCard: false
              })),
              formation: '4-4-2',
              tacticalModifiers: {
                tempo: 0, width: 0, defensiveLine: 0, passingDirectness: 0,
                closingDown: 0, timeWasting: 0, mentality: 0
              }
            };

            const aTeamState: TeamState = {
              id: awayTeam.id.toString(),
              name: awayTeam.name,
              players: (awayTeam.players || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                position: p.position || 'MC',
                attributes: p.attributes || {},
                condition: 100,
                stamina: 100,
                currentPosition: { x: 50, y: 50 },
                morale: 75, form: 75, yellowCards: 0, redCard: false
              })),
              formation: '4-4-2',
              tacticalModifiers: {
                tempo: 0, width: 0, defensiveLine: 0, passingDirectness: 0,
                closingDown: 0, timeWasting: 0, mentality: 0
              }
            };

            const engine = new MatchEngine(hTeamState, aTeamState);
            result = engine.simulateMatch();
          }

          setFullMatchResult(result);
          console.log("Match Simulated:", result);

        } catch (error) {
          console.error("Simulation failed:", error);
        }
      };

      simulate();
    }
  }, [matchState, homeTeam, awayTeam, fullMatchResult, fixtureId]);

  // Replay Loop (Visualizer)
  useEffect(() => {
    let interval: any;

    if (matchState === MatchState.PLAYING && fullMatchResult) {
      interval = setInterval(() => {
        setMinute(prev => {
          if (prev >= 90) {
            setMatchState(MatchState.FULL_TIME);
            return prev;
          }

          const newMinute = prev + 1;

          // Find events for this minute
          const newEvents = (fullMatchResult.events || fullMatchResult.eventLog).filter((e: any) => {
            const eventTime = e.time !== undefined ? e.time : e.minute;
            return Math.floor(eventTime) === newMinute;
          });

          if (newEvents.length > 0) {
            setEvents(prevEvents => [...prevEvents, ...newEvents]);

            // Update score based on events
            newEvents.forEach((e: MatchEvent) => {
              if (e.type === 'GOAL') {
                if (e.teamId === homeTeam.id) setScores(s => ({ ...s, home: s.home + 1 }));
                else setScores(s => ({ ...s, away: s.away + 1 }));
              }
            });
          }

          return newMinute;
        });
      }, speed);
    } else if (matchState === MatchState.FULL_TIME) {
      // Trigger Gemini Headline only once
      if (!headline) {
        generatePostMatchComment(homeTeam, awayTeam, scores.home, scores.away).then(setHeadline);
      }
    }

    return () => clearInterval(interval);
  }, [matchState, speed, fullMatchResult, homeTeam, awayTeam, scores, headline]);

  // Initial Assistant Report
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

  return (
    <div className="flex flex-col h-full bg-slate-950">

      {/* Scoreboard */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-slate-500 font-mono">
            {matchState === MatchState.PRE_MATCH ? 'PRE-MATCH' :
              matchState === MatchState.FULL_TIME ? 'FULL TIME' :
                `${minute}'`}
          </div>
          {matchState === MatchState.PLAYING && (
            <div className="flex space-x-2">
              <button onClick={() => setSpeed(200)} className={`p-1 rounded ${speed === 200 ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><Play size={14} /></button>
              <button onClick={() => setSpeed(50)} className={`p-1 rounded ${speed === 50 ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><FastForward size={14} /></button>
            </div>
          )}
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
                  homeValue={`${fullMatchResult.statistics.possession[0]}%`}
                  awayValue={`${fullMatchResult.statistics.possession[1]}%`}
                />
                <StatRow label="xG"
                  homeValue={fullMatchResult.statistics.xG[0].toFixed(2)}
                  awayValue={fullMatchResult.statistics.xG[1].toFixed(2)}
                />
                <StatRow label="Shots (Target)"
                  homeValue={`${fullMatchResult.statistics.shots[0]} (${fullMatchResult.statistics.shotsOnTarget[0]})`}
                  awayValue={`${fullMatchResult.statistics.shots[1]} (${fullMatchResult.statistics.shotsOnTarget[1]})`}
                />
                <StatRow label="Passes"
                  homeValue={`${fullMatchResult.statistics.passes[0]}`}
                  awayValue={`${fullMatchResult.statistics.passes[1]}`}
                />
                <StatRow label="Tackles"
                  homeValue={`${fullMatchResult.statistics.tackles[0]}`}
                  awayValue={`${fullMatchResult.statistics.tackles[1]}`}
                />
              </div>
            </div>
          )}

          {/* Top Performers (Simplified Player Stats) */}
          {(matchState === MatchState.PLAYING || matchState === MatchState.FULL_TIME) && (
            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 border-b border-slate-700 pb-2">Key Players</h3>
              <div className="space-y-3">
                {/* Home Key Players */}
                <div>
                  <div className="text-[10px] font-bold text-emerald-500 mb-1 uppercase">{homeTeam.name}</div>
                  {homeTeam.players?.slice(0, 11).map((p: any) => {
                    const rating = calculateMockRating(p, events);
                    if (rating < 7.0) return null; // Only show good performers
                    return (
                      <div key={p.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 truncate w-24">{p.name}</span>
                        <span className="text-emerald-400 font-bold">{rating.toFixed(1)}</span>
                      </div>
                    )
                  })}
                </div>
                {/* Away Key Players */}
                <div>
                  <div className="text-[10px] font-bold text-blue-500 mb-1 uppercase">{awayTeam.name}</div>
                  {awayTeam.players?.slice(0, 11).map((p: any) => {
                    const rating = calculateMockRating(p, events);
                    if (rating < 7.0) return null; // Only show good performers
                    return (
                      <div key={p.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 truncate w-24">{p.name}</span>
                        <span className="text-blue-400 font-bold">{rating.toFixed(1)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* RIGHT COLUMN: Log & Assistant */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden space-y-4">

          {/* Assistant Report (Pre-Match) */}
          {matchState === MatchState.PRE_MATCH && (
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-emerald-400 text-sm font-bold uppercase mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} /> Assistant Manager Report
              </h3>
              <p className="text-sm text-slate-300 italic whitespace-pre-line leading-relaxed">
                {assistantReport || "Analyzing opponent data..."}
              </p>
              <button
                onClick={handleStart}
                className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded shadow-lg transition-all text-lg"
              >
                Kick Off
              </button>
            </div>
          )}

          {/* Live Commentary Log (Filtered) */}
          {(matchState === MatchState.PLAYING || matchState === MatchState.FULL_TIME) && (
            <div
              ref={scrollRef}
              className="flex-1 bg-slate-900/50 rounded-lg border border-slate-800 p-4 overflow-y-auto space-y-3"
            >
              {events.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">The referee blows the whistle...</div>}
              {events
                .filter(e => ['GOAL', 'CARD_YELLOW', 'CARD_RED', 'SUBSTITUTION', 'SAVE', 'CORNER', 'FOUL', 'OFFSIDE', 'HALFTIME', 'FULL_TIME'].includes(e.type) || e.description.includes('Goal') || e.description.includes('Card') || e.description.includes('Sub'))
                .map((e: any, idx) => (
                  <div key={idx} className={`text-sm flex space-x-3 ${e.type === 'GOAL' ? 'bg-slate-800/80 p-3 rounded border-l-4 border-emerald-500 shadow-md' : ''}`}>
                    <span className="text-slate-500 font-mono w-8 text-right">{e.time !== undefined ? e.time : e.minute}'</span>
                    <span className={e.type === 'GOAL' ? 'text-white font-bold text-base' : e.type.includes('CARD') ? 'text-yellow-200' : 'text-slate-300'}>
                      {e.description}
                    </span>
                  </div>
                ))}

              {matchState === MatchState.FULL_TIME && (
                <div className="border-t border-slate-700 pt-6 mt-6 pb-4">
                  <div className="text-center text-slate-400 text-xs uppercase mb-3">Full Time Analysis</div>
                  <div className="text-center font-serif text-xl text-white italic px-6 mb-6">"{headline || 'Wait for it...'}"</div>
                  <button
                    onClick={handleFinish}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded transition-all text-lg shadow-lg"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
