import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, RotateCcw, BarChart3 } from 'lucide-react';
import { MatchEngine } from '../engine/matchEngine';
import { TeamState, MatchState, PlayerState } from '../engine/types';
import { getTacticalModifiers } from '../engine/tacticalMods';
import { PitchCanvas } from '../components/PitchCanvas';

/**
 * Unified Match Test
 * Combines Live playback + Statistical analysis + Console logging
 * Single comprehensive testing interface for the match engine
 */
export const UnifiedMatchTest: React.FC = () => {
    const [matchEngine, setMatchEngine] = useState<MatchEngine | null>(null);
    const [matchState, setMatchState] = useState<MatchState | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [showStats, setShowStats] = useState(true);

    const animationRef = useRef<number>();
    const tickCountRef = useRef<number>(0);

    const startNewMatch = () => {
        console.log('\n🚀 === NEW MATCH TEST STARTED ===\n');

        const homeTeam = createMockTeam('Arsenal', 'home');
        const awayTeam = createMockTeam('Chelsea', 'away');

        console.log('✅ Teams created:', {
            home: homeTeam.name,
            away: awayTeam.name,
            playersPerTeam: homeTeam.players.length
        });

        const engine = new MatchEngine(homeTeam, awayTeam, (state) => {
            setMatchState({ ...state });
        });

        setMatchEngine(engine);
        setMatchState(engine.getState());
        setIsFinished(false);
        setIsPlaying(false);
        tickCountRef.current = 0;

        console.log('⚽ Match Start:', `${homeTeam.name} vs ${awayTeam.name}\n`);
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
        if (!isPlaying) {
            console.log('▶️ Match RESUMED');
        } else {
            console.log('⏸️ Match PAUSED');
        }
    };

    const changeSpeed = () => {
        const speeds = [1, 2, 5, 10];
        const currentIndex = speeds.indexOf(speed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setSpeed(nextSpeed);
        console.log(`⚡ Playback speed: ${nextSpeed}x`);
    };

    const resetMatch = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        setMatchState(null);
        setMatchEngine(null);
        setIsPlaying(false);
        setIsFinished(false);
        tickCountRef.current = 0;
        console.log('🔄 Match reset\n');
    };

    // Auto-play animation loop - FIXED
    useEffect(() => {
        if (!matchEngine || !isPlaying || isFinished) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = undefined;
            }
            return;
        }

        const ticksPerFrame = speed; // Process more ticks at higher speeds

        const animate = () => {
            // Check if still valid
            if (!matchEngine || isFinished) {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
                return;
            }

            // Process multiple ticks per frame
            for (let i = 0; i < ticksPerFrame; i++) {
                const shouldContinue = matchEngine.simulateTick();
                const currentState = matchEngine.getState();
                tickCountRef.current++;

                // Update UI every 5 ticks to avoid excessive re-renders
                if (tickCountRef.current % 5 === 0) {
                    setMatchState({ ...currentState });
                }

                if (!shouldContinue || currentState.time >= 90) {
                    setIsFinished(true);
                    setIsPlaying(false);
                    setMatchState({ ...currentState }); // Final update
                    logMatchSummary(currentState);
                    if (animationRef.current) {
                        cancelAnimationFrame(animationRef.current);
                    }
                    return;
                }
            }

            // Continue animation
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = undefined;
            }
        };
    }, [matchEngine, isPlaying, isFinished, speed]);

    const logMatchSummary = (state: MatchState) => {
        console.log('\n🏁 === FULL TIME ===');
        console.log(`\n📊 Final Score: ${state.homeTeam.name} ${state.score[0]} - ${state.score[1]} ${state.awayTeam.name}\n`);

        const stats = state.statistics;
        console.log('📈 Match Statistics:');
        console.log('━'.repeat(60));
        console.log(`Possession:       ${stats.possession[0]}% - ${stats.possession[1]}%`);
        console.log(`Shots (on target): ${stats.shots[0]} (${stats.shotsOnTarget[0]}) - ${stats.shots[1]} (${stats.shotsOnTarget[1]})`);
        console.log(`Expected Goals:    ${stats.xG[0].toFixed(2)} - ${stats.xG[1].toFixed(2)}`);
        console.log(`Passes:           ${stats.passes[0]} - ${stats.passes[1]}`);
        console.log(`Pass Accuracy:    ${stats.passAccuracy[0]}% - ${stats.passAccuracy[1]}%`);
        console.log(`Tackles:          ${stats.tackles[0]} - ${stats.tackles[1]}`);
        console.log(`Fouls:            ${stats.fouls[0]} - ${stats.fouls[1]}`);
        console.log(`Yellow Cards:     ${stats.yellowCards[0]} - ${stats.yellowCards[1]}`);
        console.log(`Red Cards:        ${stats.redCards[0]} - ${stats.redCards[1]}`);
        console.log(`Corners:          ${stats.corners[0]} - ${stats.corners[1]}`);
        console.log(`Total Events:     ${state.eventLog.length}`);
        console.log('━'.repeat(60));
        console.log('\n✅ Match completed successfully!\n');
    };

    if (!matchState) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-100 mb-4">⚽ Unified Match Test System</h1>
                    <p className="text-slate-400 mb-8">Complete match engine testing with live visualization</p>
                    <button
                        onClick={startNewMatch}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center gap-3 mx-auto"
                    >
                        <Play size={24} />
                        Start Test Match
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 mb-1">⚽ Unified Match Test</h1>
                        <p className="text-slate-400">Live + Statistics + Detailed Logging</p>
                    </div>
                    <div className="text-2xl font-mono font-bold text-emerald-400">
                        {Math.floor(matchState.time)}' / 90'
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex items-center justify-between">
                    <div className="flex gap-3">
                        {!isFinished && (
                            <>
                                <button
                                    onClick={togglePlayPause}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                >
                                    {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Play</>}
                                </button>
                                <button
                                    onClick={changeSpeed}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                >
                                    <FastForward size={18} />
                                    {speed}x
                                </button>
                            </>
                        )}
                        <button
                            onClick={resetMatch}
                            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={18} />
                            New Match
                        </button>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className={`${showStats ? 'bg-emerald-600' : 'bg-slate-600'} hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2`}
                        >
                            <BarChart3 size={18} />
                            Stats
                        </button>
                    </div>

                    <div className={`px-4 py-2 rounded-lg font-bold ${isFinished ? 'bg-red-900/30 text-red-300' : isPlaying ? 'bg-green-900/30 text-green-300' : 'bg-yellow-900/30 text-yellow-300'}`}>
                        {isFinished ? 'FULL TIME' : isPlaying ? 'LIVE' : 'PAUSED'}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className={`grid ${showStats ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
                    {/* Pitch Visualization */}
                    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                            <span className="text-2xl">⚽</span>
                            Live Match
                        </h2>

                        {/* Score Display */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-lg mb-4 text-center">
                            <div className="text-3xl font-bold">
                                <span className="text-emerald-400">{matchState.homeTeam.name}</span>
                                {' '}
                                <span className="text-white">{matchState.score[0]}</span>
                                <span className="text-slate-500"> - </span>
                                <span className="text-white">{matchState.score[1]}</span>
                                {' '}
                                <span className="text-blue-400">{matchState.awayTeam.name}</span>
                            </div>
                        </div>

                        {/* Pitch */}
                        <div className="flex justify-center">
                            <PitchCanvas
                                homeTeam={matchState.homeTeam}
                                awayTeam={matchState.awayTeam}
                                ballPosition={matchState.ballPosition}
                                possession={matchState.possession}
                                width={450}
                                height={650}
                            />
                        </div>
                    </div>

                    {/* Statistics Panel */}
                    {showStats && (
                        <div className="space-y-6">
                            {/* Live Stats */}
                            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-bold text-slate-100 mb-4">📊 Match Statistics</h3>
                                <div className="space-y-3 text-sm">
                                    <StatRow label="Possession" homeValue={`${matchState.statistics.possession[0]}%`} awayValue={`${matchState.statistics.possession[1]}%`} />
                                    <StatRow label="Shots (on target)" homeValue={`${matchState.statistics.shots[0]} (${matchState.statistics.shotsOnTarget[0]})`} awayValue={`${matchState.statistics.shots[1]} (${matchState.statistics.shotsOnTarget[1]})`} />
                                    <StatRow label="xG" homeValue={matchState.statistics.xG[0].toFixed(2)} awayValue={matchState.statistics.xG[1].toFixed(2)} />
                                    <StatRow label="Passes" homeValue={`${matchState.statistics.passes[0]} (${matchState.statistics.passAccuracy[0]}%)`} awayValue={`${matchState.statistics.passes[1]} (${matchState.statistics.passAccuracy[1]}%)`} />
                                    <StatRow label="Tackles" homeValue={matchState.statistics.tackles[0].toString()} awayValue={matchState.statistics.tackles[1].toString()} />
                                    <StatRow label="Fouls" homeValue={matchState.statistics.fouls[0].toString()} awayValue={matchState.statistics.fouls[1].toString()} />
                                    <StatRow label="Yellow Cards" homeValue={matchState.statistics.yellowCards[0].toString()} awayValue={matchState.statistics.yellowCards[1].toString()} />
                                    <StatRow label="Corners" homeValue={matchState.statistics.corners[0].toString()} awayValue={matchState.statistics.corners[1].toString()} />
                                </div>
                            </div>

                            {/* Recent Events - FILTERED */}
                            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-bold text-slate-100 mb-4">📋 Key Events</h3>
                                <div className="space-y-1 max-h-96 overflow-y-auto">
                                    {matchState.eventLog
                                        .filter(event => {
                                            // Only show important events
                                            const desc = event.description.toLowerCase();
                                            return (
                                                desc.includes('goal') ||
                                                desc.includes('card') ||
                                                desc.includes('save') ||
                                                desc.includes('corner') ||
                                                desc.includes('foul') ||
                                                desc.includes('offside') ||
                                                desc.includes('free kick') ||
                                                desc.includes('substitution') ||
                                                desc.includes('half time') ||
                                                desc.includes('full time')
                                            );
                                        })
                                        .slice(-15)
                                        .reverse()
                                        .map((event, index) => (
                                            <div
                                                key={index}
                                                className={`text-xs py-1.5 px-2 rounded ${event.description.includes('GOAL')
                                                        ? 'bg-emerald-900/30 text-emerald-200 font-semibold'
                                                        : event.description.includes('CARD')
                                                            ? 'bg-yellow-900/30 text-yellow-200'
                                                            : 'bg-slate-900 text-slate-300'
                                                    }`}
                                            >
                                                <span className="text-emerald-400 font-mono font-bold">{event.time}'</span>
                                                {' '}
                                                <span>{event.description}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* System Info */}
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <h3 className="text-sm font-bold text-slate-100 mb-2">🔧 System Info</h3>
                                <div className="text-xs text-slate-400 space-y-1">
                                    <div>Total Events: {matchState.eventLog.length}</div>
                                    <div>Simulation Speed: {speed}x</div>
                                    <div>Console: Check browser console (F12) for detailed logs</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Stat Row Component
const StatRow: React.FC<{ label: string; homeValue: string; awayValue: string }> = ({ label, homeValue, awayValue }) => (
    <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
        <span className="text-emerald-400 font-semibold w-24 text-right">{homeValue}</span>
        <span className="text-slate-400 flex-1 text-center text-xs">{label}</span>
        <span className="text-blue-400 font-semibold w-24 text-left">{awayValue}</span>
    </div>
);

// Mock team creation with realistic attributes
function createMockTeam(name: string, side: 'home' | 'away'): TeamState {
    const mockPlayers: PlayerState[] = [];
    const positions = ['GK', 'DC', 'DC', 'DC', 'DC', 'MC', 'MC', 'MC', 'ST', 'ST', 'ST'];

    for (let i = 0; i < 11; i++) {
        const isDefender = i > 0 && i < 5;
        const isForward = i > 7;

        mockPlayers.push({
            id: side === 'home' ? i : i + 11,
            name: `${name} Player ${i + 1}`,
            position: positions[i],
            attributes: {
                Corners: 10 + Math.floor(Math.random() * 4),
                Crossing: 10 + Math.floor(Math.random() * 4),
                Dribbling: (isForward ? 11 : 7) + Math.floor(Math.random() * 5),
                Finishing: (isForward ? 10 : 5) + Math.floor(Math.random() * 4),  // Realistic
                FirstTouch: 11 + Math.floor(Math.random() * 4),
                FreeKickTaking: 8 + Math.floor(Math.random() * 4),
                Heading: (isDefender ? 12 : 9) + Math.floor(Math.random() * 4),
                LongShots: 9 + Math.floor(Math.random() * 4),
                LongThrows: 8 + Math.floor(Math.random() * 2),
                Marking: (isDefender ? 11 : 8) + Math.floor(Math.random() * 4),
                Passing: 9 + Math.floor(Math.random() * 5),
                PenaltyTaking: 10 + Math.floor(Math.random() * 4),
                Tackling: (isDefender ? 11 : 6) + Math.floor(Math.random() * 4),
                Technique: 11 + Math.floor(Math.random() * 4),
                Aggression: 10 + Math.floor(Math.random() * 4),
                Anticipation: 11 + Math.floor(Math.random() * 4),
                Bravery: 10 + Math.floor(Math.random() * 4),
                Composure: 11 + Math.floor(Math.random() * 4),
                Concentration: 10 + Math.floor(Math.random() * 4),
                Decisions: 11 + Math.floor(Math.random() * 4),
                Determination: 12 + Math.floor(Math.random() * 4),
                Flair: (isForward ? 11 : 8) + Math.floor(Math.random() * 4),
                Leadership: 10 + Math.floor(Math.random() * 4),
                OffTheBall: (isForward ? 12 : 9) + Math.floor(Math.random() * 4),
                Positioning: 10 + Math.floor(Math.random() * 4),
                Teamwork: 12 + Math.floor(Math.random() * 3),
                Vision: 10 + Math.floor(Math.random() * 4),
                WorkRate: 12 + Math.floor(Math.random() * 3),
                Acceleration: 11 + Math.floor(Math.random() * 4),
                Agility: 10 + Math.floor(Math.random() * 4),
                Balance: 11 + Math.floor(Math.random() * 4),
                JumpingReach: (isDefender ? 11 : 9) + Math.floor(Math.random() * 4),
                NaturalFitness: 12 + Math.floor(Math.random() * 3),
                Pace: (isForward ? 11 : 9) + Math.floor(Math.random() * 5),
                Stamina: 100,
                Strength: (isDefender ? 11 : 8) + Math.floor(Math.random() * 5)
            },
            condition: 100,
            stamina: 100,
            morale: 75,
            form: 75,
            yellowCards: 0,
            redCard: false,
            currentPosition: { x: 50, y: side === 'home' ? 30 + i * 5 : 70 - i * 5 }
        });
    }

    return {
        id: side === 'home' ? 1 : 2,
        name,
        players: mockPlayers,
        formation: '4-3-3',
        tacticalModifiers: getTacticalModifiers({
            mentality: 'Balanced',
            tempo: 'Standard',
            directness: 'Standard',
            pressing: 'Standard',
            defensiveLine: 'Standard'
        })
    };
}
