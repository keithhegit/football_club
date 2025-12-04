import React, { useState, useEffect, useRef } from 'react';
import { Team, MatchEvent, MatchState } from '../types';
import { simulateMinute } from '../utils/gameEngine';
import { Play, Pause, FastForward, CheckCircle2 } from 'lucide-react';
import { generatePostMatchComment, getAssistantReport } from '../services/geminiService';

interface MatchViewProps {
  homeTeam: Team;
  awayTeam: Team;
  onMatchComplete: (homeScore: number, awayScore: number) => void;
  userTeamId: string;
}

export const MatchView: React.FC<MatchViewProps> = ({ homeTeam, awayTeam, onMatchComplete, userTeamId }) => {
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
      // Lazy load engine to avoid circular deps if any
      import('../services/matchEngine/core').then(({ MatchEngine }) => {
        const engine = new MatchEngine(homeTeam, awayTeam);
        const result = engine.simulateMatch();
        setFullMatchResult(result);
        console.log("Match Simulated:", result);
      });
    }
  }, [matchState, homeTeam, awayTeam, fullMatchResult]);

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
          const newEvents = fullMatchResult.events.filter((e: MatchEvent) => e.minute === newMinute);

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

      {/* Match Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4 space-y-4">

        {/* Assistant Report (Pre-Match) */}
        {matchState === MatchState.PRE_MATCH && (
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-emerald-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
              <CheckCircle2 size={14} /> Assistant Manager Report
            </h3>
            <p className="text-sm text-slate-300 italic whitespace-pre-line leading-relaxed">
              {assistantReport || "Analyzing opponent data..."}
            </p>
            <button
              onClick={handleStart}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded shadow-lg transition-all"
            >
              Kick Off
            </button>
          </div>
        )}

        {/* Live Commentary Log */}
        {(matchState === MatchState.PLAYING || matchState === MatchState.FULL_TIME) && (
          <div
            ref={scrollRef}
            className="flex-1 bg-slate-900/50 rounded-lg border border-slate-800 p-3 overflow-y-auto space-y-3"
          >
            {events.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">The referee blows the whistle...</div>}
            {events.map((e, idx) => (
              <div key={idx} className={`text-sm flex space-x-3 ${e.type === 'GOAL' ? 'bg-slate-800/80 p-2 rounded border-l-4 border-emerald-500' : ''}`}>
                <span className="text-slate-500 font-mono w-6">{e.minute}'</span>
                <span className={e.type === 'GOAL' ? 'text-white font-bold' : e.type === 'CARD_YELLOW' ? 'text-yellow-200' : 'text-slate-300'}>
                  {e.description}
                </span>
              </div>
            ))}

            {matchState === MatchState.FULL_TIME && (
              <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="text-center text-slate-400 text-xs uppercase mb-2">Full Time Summary</div>
                <div className="text-center font-serif text-lg text-white italic px-4">"{headline || '...'}"</div>
                <button
                  onClick={handleFinish}
                  className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
