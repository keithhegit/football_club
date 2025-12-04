// Match Engine Test View - For Phase 2.3 testing
// Standalone test interface for new match engine

import React, { useState } from 'react';
import { MatchEngine } from '../engine/matchEngine';
import { TeamState, PlayerState, MatchResult, MatchState } from '../engine/types';
import { getTacticalModifiers } from '../engine/tacticalMods';
import { PitchCanvas } from '../components/PitchCanvas';

export const MatchEngineTest: React.FC = () => {
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [matchState, setMatchState] = useState<MatchState | null>(null);

    const runTestMatch = () => {
        setIsSimulating(true);
        setMatchResult(null);

        // Create mock teams for testing
        const homeTeam = createMockTeam('Arsenal', 'home');
        const awayTeam = createMockTeam('Chelsea', 'away');

        // Run simulation (async to not block UI)
        setTimeout(() => {
            const engine = new MatchEngine(homeTeam, awayTeam);
            const result = engine.simulateMatch();
            const state = engine.getState();
            setMatchResult(result);
            setMatchState(state);
            setIsSimulating(false);
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">⚽ Match Engine Test</h1>
                    <p className="text-slate-400">Phase 2.3 - Probability-based match simulation</p>
                </div>

                {/* Start Button */}
                <button
                    onClick={runTestMatch}
                    disabled={isSimulating}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold mb-6 transition-colors w-full md:w-auto"
                >
                    {isSimulating ? '⏳ Simulating Match...' : '▶ Run Test Match'}
                </button>

                {/* Results */}
                {matchResult && (
                    <div className="space-y-6">
                        {/* Final Score */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-lg border border-slate-700 shadow-xl">
                            <div className="text-center">
                                <div className="text-sm text-slate-400 mb-2">FULL TIME</div>
                                <div className="text-5xl font-bold text-slate-100 mb-4">
                                    <span className="text-emerald-400">Arsenal</span>
                                    {' '}
                                    <span className="text-white">{matchResult.homeScore}</span>
                                    {' - '}
                                    <span className="text-white">{matchResult.awayScore}</span>
                                    {' '}
                                    <span className="text-blue-400">Chelsea</span>
                                </div>
                            </div>
                        </div>

                        {/* 2D Pitch Visualization */}
                        {matchState && (
                            <div className="bg-slate-800 p-6 rounded-lg  border border-slate-700">
                                <h2 className="text-2xl font-bold text-slate-100 mb-4">⚽ Final Positions</h2>
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
                                <div className="mt-4 text-center text-sm text-slate-400">
                                    <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                                    Arsenal (Home) |
                                    <span className="inline-block w-3 h-3 bg-red-500 rounded-full mx-1"></span>
                                    Chelsea (Away)
                                </div>
                            </div>
                        )}

                        {/* Match Statistics */}
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h2 className="text-2xl font-bold text-slate-100 mb-6">📊 Match Statistics</h2>

                            <div className="space-y-4">
                                {/* Possession */}
                                <StatRow
                                    label="Possession"
                                    homeValue={`${matchResult.statistics.possession[0]}%`}
                                    awayValue={`${matchResult.statistics.possession[1]}%`}
                                    homeBar={matchResult.statistics.possession[0]}
                                    awayBar={matchResult.statistics.possession[1]}
                                />

                                {/* Shots */}
                                <StatRow
                                    label="Shots (on target)"
                                    homeValue={`${matchResult.statistics.shots[0]} (${matchResult.statistics.shotsOnTarget[0]})`}
                                    awayValue={`${matchResult.statistics.shots[1]} (${matchResult.statistics.shotsOnTarget[1]})`}
                                />

                                {/* xG */}
                                <StatRow
                                    label="Expected Goals (xG)"
                                    homeValue={matchResult.statistics.xG[0].toFixed(2)}
                                    awayValue={matchResult.statistics.xG[1].toFixed(2)}
                                    homeBar={matchResult.statistics.xG[0] * 50}
                                    awayBar={matchResult.statistics.xG[1] * 50}
                                />

                                {/* Passes */}
                                <StatRow
                                    label="Passes (accuracy)"
                                    homeValue={`${matchResult.statistics.passes[0]} (${matchResult.statistics.passAccuracy[0]}%)`}
                                    awayValue={`${matchResult.statistics.passes[1]} (${matchResult.statistics.passAccuracy[1]}%)`}
                                />

                                {/* Tackles */}
                                <StatRow
                                    label="Tackles"
                                    homeValue={matchResult.statistics.tackles[0].toString()}
                                    awayValue={matchResult.statistics.tackles[1].toString()}
                                />

                                {/* Corners */}
                                <StatRow
                                    label="Corners"
                                    homeValue={matchResult.statistics.corners[0].toString()}
                                    awayValue={matchResult.statistics.corners[1].toString()}
                                />
                            </div>
                        </div>

                        {/* Event Log */}
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h2 className="text-2xl font-bold text-slate-100 mb-4">📋 Match Events</h2>
                            <p className="text-slate-400 text-sm mb-4">Last 30 events (newest first)</p>

                            <div className="space-y-1 max-h-96 overflow-y-auto">
                                {matchResult.eventLog.slice(-30).reverse().map((event, index) => (
                                    <div
                                        key={index}
                                        className={`text-sm py-2 px-3 rounded ${event.description.includes('GOAL')
                                            ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-200'
                                            : 'bg-slate-900 border border-slate-700 text-slate-300'
                                            }`}
                                    >
                                        <span className="text-emerald-400 font-mono font-bold">{event.time}'</span>
                                        {' '}
                                        <span>{event.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Technical Info */}
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h3 className="text-lg font-bold text-slate-100 mb-3">🔧 Technical Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-slate-400">Total Events</div>
                                    <div className="text-slate-100 font-semibold">{matchResult.eventLog.length}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400">Match Duration</div>
                                    <div className="text-slate-100 font-semibold">90 minutes</div>
                                </div>
                                <div>
                                    <div className="text-slate-400">Engine Version</div>
                                    <div className="text-slate-100 font-semibold">Phase 2.3</div>
                                </div>
                                <div>
                                    <div className="text-slate-400">Algorithm</div>
                                    <div className="text-slate-100 font-semibold">Probability-based</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Stat row component with visual bars
const StatRow: React.FC<{
    label: string;
    homeValue: string;
    awayValue: string;
    homeBar?: number;
    awayBar?: number;
}> = ({ label, homeValue, awayValue, homeBar, awayBar }) => (
    <div>
        <div className="mb-2">
            <span className="text-slate-300 font-semibold">{label}</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex-1 text-right text-emerald-400 font-bold text-lg">{homeValue}</div>

            {homeBar !== undefined && awayBar !== undefined && (
                <div className="flex-[2] flex gap-1">
                    <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${homeBar}%` }}
                        />
                    </div>
                    <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden flex justify-end">
                        <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${awayBar}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex-1 text-left text-blue-400 font-bold text-lg">{awayValue}</div>
        </div>
    </div>
);

// Helper function to create mock team with realistic FM2023 attributes
function createMockTeam(name: string, side: 'home' | 'away'): TeamState {
    const mockPlayers: PlayerState[] = [];

    // Create 11 mock players with realistic attribute distributions
    const positions = ['GK', 'DC', 'DC', 'DC', 'DC', 'MC', 'MC', 'MC', 'ST', 'ST', 'ST'];

    for (let i = 0; i < 11; i++) {
        const isDefender = i > 0 && i < 5;
        const isForward = i > 7;

        mockPlayers.push({
            id: side === 'home' ? i : i + 11,
            name: `${name} Player ${i + 1}`,
            position: positions[i],
            attributes: {
                // Technical attributes
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

                // Mental attributes
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

                // Physical attributes
                Acceleration: 13 + Math.floor(Math.random() * 4),
                Agility: 12 + Math.floor(Math.random() * 4),
                Balance: 13 + Math.floor(Math.random() * 4),
                JumpingReach: (isDefender ? 13 : 11) + Math.floor(Math.random() * 4),
                NaturalFitness: 14 + Math.floor(Math.random() * 3),
                Pace: (isForward ? 14 : 12) + Math.floor(Math.random() * 4),
                Stamina: 15 + Math.floor(Math.random() * 3),
                Strength: (isDefender ? 14 : 12) + Math.floor(Math.random() * 4)
            },
            condition: 100,
            stamina: 100,
            morale: 70 + Math.floor(Math.random() * 20),
            form: 70 + Math.floor(Math.random() * 20),
            currentPosition: { x: 50, y: side === 'home' ? 20 : 80 }
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
