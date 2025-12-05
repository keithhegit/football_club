// Real-time Match Player - Component with live playback controls
// Shows match simulation frame-by-frame with Play/Pause/Speed controls

import React, { useState, useEffect, useRef } from 'react';
import { MatchEngine } from '../engine/matchEngine';
import { TeamState, PlayerState, MatchState } from '../engine/types';
import { getTacticalModifiers } from '../engine/tacticalMods';
import { PitchCanvas } from '../components/PitchCanvas'; import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

export const LiveMatchPlayer: React.FC = () => {
    const [matchState, setMatchState] = useState<MatchState | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState<number>(1); // 1x, 2x, 5x
    const [isFinished, setIsFinished] = useState(false);

    const engineRef = useRef<MatchEngine | null>(null);
    const animationRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(0);

    // Initialize match
    const startNewMatch = () => {
        const homeTeam = createMockTeam('Arsenal', 'home');
        const awayTeam = createMockTeam('Chelsea', 'away');

        const engine = new MatchEngine(homeTeam, awayTeam);

        // Set up callback for state updates
        engine.setUpdateCallback((state) => {
            setMatchState(state);
        });

        engine.setGoalCallback((team, minute) => {
            console.log(`⚽ GOAL! ${team === 'home' ? 'Arsenal' : 'Chelsea'} scored at ${minute}'`);
        });

        engineRef.current = engine;
        setMatchState(engine.getState());
        setIsPlaying(false);
        setIsFinished(false);
        setSpeed(1);
    };

    // Animation loop
    useEffect(() => {
        if (!isPlaying || !engineRef.current || isFinished) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            return;
        }

        const animate = (timestamp: number) => {
            if (!lastTickRef.current) {
                lastTickRef.current = timestamp;
            }

            const deltaTime = timestamp - lastTickRef.current;
            const tickInterval = 100 / speed; // Base 100ms, faster with speed multiplier

            if (deltaTime >= tickInterval) {
                lastTickRef.current = timestamp;

                if (engineRef.current) {
                    const canContinue = engineRef.current.simulateTick();

                    if (!canContinue) {
                        setIsFinished(true);
                        setIsPlaying(false);
                        console.log('🏁 Match Finished!');
                        return;
                    }
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, speed, isFinished]);

    // Reset on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const changeSpeed = () => {
        const speeds = [1, 2, 5];
        const currentIndex = speeds.indexOf(speed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setSpeed(nextSpeed);
    };

    const resetMatch = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        startNewMatch();
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">⚽ Live Match Simulation</h1>
                    <p className="text-slate-400">Real-time playback with visual controls</p>
                </div>

                {/* Controls */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6 flex items-center justify-between">
                    <div className="flex gap-3">
                        {!matchState && (
                            <button
                                onClick={startNewMatch}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                <Play size={18} />
                                Start Match
                            </button>
                        )}

                        {matchState && !isFinished && (
                            <>
                                <button
                                    onClick={togglePlayPause}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                >
                                    {isPlaying ? (
                                        <>
                                            <Pause size={18} />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play size={18} />
                                            Play
                                        </>
                                    )}
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

                        {matchState && (
                            <button
                                onClick={resetMatch}
                                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                <RotateCcw size={18} />
                                Reset
                            </button>
                        )}
                    </div>

                    {matchState && (
                        <div className="text-slate-100 text-xl font-mono">
                            {Math.floor(matchState.time)}' / 90'
                        </div>
                    )}
                </div>

                {/* Match Display */}
                {matchState && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pitch */}
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <div className="flex justify-center">
                                <PitchCanvas
                                    homeTeam={matchState.homeTeam}
                                    awayTeam={matchState.awayTeam}
                                    ballPosition={matchState.ballPosition}
                                    possession={matchState.possession}
                                    width={400}
                                    height={600}
                                />
                            </div>
                        </div>

                        {/* Stats & Events */}
                        <div className="space-y-6">
                            {/* Score */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg border border-slate-700">
                                <div className="text-center">
                                    <div className="text-sm text-slate-400 mb-2">{isFinished ? 'FULL TIME' : 'LIVE'}</div>
                                    <div className="text-4xl font-bold text-slate-100 mb-2">
                                        <span className="text-emerald-400">Arsenal</span>
                                        {' '}
                                        <span className="text-white">{matchState.score[0]}</span>
                                        {' - '}
                                        <span className="text-white">{matchState.score[1]}</span>
                                        {' '}
                                        <span className="text-blue-400">Chelsea</span>
                                    </div>
                                </div>
                            </div>

                            {/* Live Stats */}
                            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-bold text-slate-100 mb-4">📊 Live Statistics</h3>
                                <div className="space-y-3 text-sm">
                                    <StatRow
                                        label="Possession"
                                        homeValue={`${matchState.statistics.possession[0]}%`}
                                        awayValue={`${matchState.statistics.possession[1]}%`}
                                    />
                                    <StatRow
                                        label="Shots"
                                        homeValue={`${matchState.statistics.shots[0]} (${matchState.statistics.shotsOnTarget[0]})`}
                                        awayValue={`${matchState.statistics.shots[1]} (${matchState.statistics.shotsOnTarget[1]})`}
                                    />
                                    <StatRow
                                        label="xG"
                                        homeValue={matchState.statistics.xG[0].toFixed(2)}
                                        awayValue={matchState.statistics.xG[1].toFixed(2)}
                                    />
                                    <StatRow
                                        label="Passes"
                                        homeValue={matchState.statistics.passes[0].toString()}
                                        awayValue={matchState.statistics.passes[1].toString()}
                                    />
                                </div>
                            </div>

                            {/* Recent Events */}
                            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                                <h3 className="text-lg font-bold text-slate-100 mb-4">📋 Recent Events</h3>
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                    {matchState.eventLog.slice(-10).reverse().map((event, index) => (
                                        <div
                                            key={index}
                                            className={`text-xs py-1.5 px-2 rounded ${event.description.includes('GOAL')
                                                ? 'bg-emerald-900/30 text-emerald-200'
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
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Compact stat row
const StatRow: React.FC<{ label: string; homeValue: string; awayValue: string }> = ({
    label,
    homeValue,
    awayValue
}) => (
    <div className="flex justify-between items-center">
        <span className="text-emerald-400 font-semibold">{homeValue}</span>
        <span className="text-slate-400">{label}</span>
        <span className="text-blue-400 font-semibold">{awayValue}</span>
    </div>
);

// Mock team creation (same as before)
function createMockTeam(name: string, side: 'home' | 'away'): TeamState {
    const mockPlayers: PlayerState[] = [];
    const positions = ['GK', 'DC', 'DC', 'DC', 'DC', 'MC', 'MC', 'MC', 'ST', 'ST', 'ST'];

    for (let i = 0; i < 11; i++) {
        const isDefender = i > 0 && i < 5;
        const isForward = i > 7;

        mockPlayers.push({
            id: side === 'home' ? i : i + 11,
            name: `${name} #${i + 1}`,
            position: positions[i],
            attributes: {
                Corners: 12 + Math.floor(Math.random() * 4),
                Crossing: 12 + Math.floor(Math.random() * 4),
                Dribbling: (isForward ? 14 : 10) + Math.floor(Math.random() * 4),
                Finishing: (isForward ? 15 : 8) + Math.floor(Math.random() * 4),
                FirstTouch: 13 + Math.floor(Math.random() * 4),
                FreeKickTaking: 10 + Math.floor(Math.random() * 4),
                Heading: (isDefender ? 14 : 11) + Math.floor(Math.random() * 4),
                LongShots: 11 + Math.floor(Math.random() * 4),
                LongThrows: 10 + Math.floor(Math.random() * 2),
                Marking: (isDefender ? 15 : 10) + Math.floor(Math.random() * 4),
                Passing: 13 + Math.floor(Math.random() * 4),
                PenaltyTaking: 12 + Math.floor(Math.random() * 4),
                Tackling: (isDefender ? 15 : 10) + Math.floor(Math.random() * 4),
                Technique: 13 + Math.floor(Math.random() * 4),
                Aggression: 12 + Math.floor(Math.random() * 4),
                Anticipation: 13 + Math.floor(Math.random() * 4),
                Bravery: 12 + Math.floor(Math.random() * 4),
                Composure: 13 + Math.floor(Math.random() * 4),
                Concentration: 12 + Math.floor(Math.random() * 4),
                Decisions: 13 + Math.floor(Math.random() * 4),
                Determination: 14 + Math.floor(Math.random() * 4),
                Flair: (isForward ? 13 : 10) + Math.floor(Math.random() * 4),
                Leadership: 12 + Math.floor(Math.random() * 4),
                OffTheBall: (isForward ? 14 : 11) + Math.floor(Math.random() * 4),
                Positioning: 13 + Math.floor(Math.random() * 4),
                Teamwork: 14 + Math.floor(Math.random() * 3),
                Vision: 12 + Math.floor(Math.random() * 4),
                WorkRate: 14 + Math.floor(Math.random() * 3),
                Acceleration: 13 + Math.floor(Math.random() * 4),
                Agility: 12 + Math.floor(Math.random() * 4),
                Balance: 13 + Math.floor(Math.random() * 4),
                JumpingReach: (isDefender ? 13 : 11) + Math.floor(Math.random() * 4),
                NaturalFitness: 14 + Math.floor(Math.random() * 3),
                Pace: (isForward ? 14 : 12) + Math.floor(Math.random() * 4),
                Stamina: 100,
                Strength: (isDefender ? 14 : 12) + Math.floor(Math.random() * 4)
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
