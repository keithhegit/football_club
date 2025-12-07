// Match Engine - Enhanced with step-by-step simulation for real-time playback
// Extends core simulation with frame-by-frame control

import {
    MatchState, MatchResult, TeamState, PlayerState, MatchEvent,
    ActionType, MatchPhase, Position, MatchConditions, CardType, PlayerSnapshot
} from './types';
import { computeActionSuccess, rollActionOutcome, calculateXG } from './probabilityEngine';
import { getActionModifier } from './tacticalMods';
import { getFormation, findNearestPlayer } from './formation';
import { MatchStatsTracker } from './matchStats';
import { weightedRandom, randomBetween, randomInt } from './utils/mathHelpers';
import { calculatePlayerRatings } from './playerRatings';

export class MatchEngine {
    private state: MatchState;
    private statsTracker: MatchStatsTracker;
    private snapshots: PlayerSnapshot[] = [];
    private matchDuration: number = 90; // minutes
    private isPaused: boolean = false;
    private simulationSpeed: number = 1; // 1x, 2x, 5x
    private teamStrengthDiff: number; // home - away (normalized -0.3 ~ +0.3)
    private luck: { home: number; away: number }; // 0.92 - 1.08 for variability

    // Callbacks for real-time updates
    private onStateUpdate?: (state: MatchState) => void;
    private onGoal?: (team: 'home' | 'away', minute: number) => void;

    constructor(homeTeam: TeamState, awayTeam: TeamState) {
        // Initialize match state
        this.state = {
            time: 0,
            score: [0, 0],
            possession: Math.random() < 0.5 ? 'home' : 'away',
            ballPosition: { x: 50, y: 50 }, // Kickoff position
            phase: 'TRANSITION',
            homeTeam,
            awayTeam,
            eventLog: [],
            statistics: {
                possession: [0, 0],
                shots: [0, 0],
                shotsOnTarget: [0, 0],
                passes: [0, 0],
                passAccuracy: [0, 0],
                xG: [0, 0],
                tackles: [0, 0],
                fouls: [0, 0],
                corners: [0, 0],
                freeKicks: [0, 0],
                yellowCards: [0, 0],
                redCards: [0, 0]
            },
            conditions: {
                weather: 'clear',
                pitch: 'good',
                temperature: 20
            }
        };

        this.statsTracker = new MatchStatsTracker(homeTeam.id, awayTeam.id);

        // Pre-compute team strength diff (approx CA gap as normalized multiplier)
        const homeStrength = this.computeTeamStrength(homeTeam);
        const awayStrength = this.computeTeamStrength(awayTeam);
        const strengthDelta = homeStrength - awayStrength;
        // Clamp to ±0.3 (each 0.1 ≈ 10% success swing)
        this.teamStrengthDiff = Math.max(-0.3, Math.min(0.3, strengthDelta / 100));

        // Luck factor per team (运气层 0.92 - 1.08)
        this.luck = {
            home: 0.92 + Math.random() * 0.16,
            away: 0.92 + Math.random() * 0.16
        };
    }

    /**
     * Set callback for state updates (for real-time visualization)
     */
    setUpdateCallback(callback: (state: MatchState) => void) {
        this.onStateUpdate = callback;
    }

    /**
     * Set callback for goal events
     */
    setGoalCallback(callback: (team: 'home' | 'away', minute: number) => void) {
        this.onGoal = callback;
    }

    /**
     * Simulate one step (tick) of the match
     * Returns true if match continues, false if finished
     */
    simulateTick(): boolean {
        if (this.state.time >= this.matchDuration) {
            return false; // Match finished
        }

        // Generate event based on current phase
        const event = this.generateEvent();

        // Select players
        const possessingTeam = this.getPossessingTeam();
        const defendingTeam = this.getDefendingTeam();

        const actor = this.selectPlayer(possessingTeam, event, true);
        // Always select an opponent for interaction
        const opponent = this.selectPlayer(defendingTeam, event, false);

        // Calculate success probability
        const contextMod = this.getContextModifier();
        const probability = computeActionSuccess(
            event,
            actor,
            opponent,
            possessingTeam.tacticalModifiers,
            this.state.conditions,
            {
                teamStrengthMod: this.getTeamStrengthMod(),
                contextMod,
                luckMod: this.state.possession === 'home' ? this.luck.home : this.luck.away,
                importantMatch: false // placeholder flag; wire to fixture metadata when available
            }
        );

        // Check for foul (before executing the action)
        const foulGenerated = this.checkForFoul(actor, opponent);
        if (foulGenerated) {
            // Handle foul instead of normal action
            const card = this.handleFoul(actor);
            const foulEvent: MatchEvent = {
                time: Math.floor(this.state.time),
                type: 'FOUL',
                actor,
                opponent: opponent || undefined,
                outcome: 'FAILURE',
                position: this.state.ballPosition,
                description: `${actor.name} commits a foul${card !== 'NONE' ? ` and receives a ${card} CARD` : ''}`,
                teamId: possessingTeam.id // Actor is from possessing team
            };

            this.statsTracker.recordEvent(foulEvent, this.state.possession);
            this.state.eventLog.push(foulEvent);

            // Award free kick to defending side
            const fkTeam = this.state.possession === 'home' ? 'away' : 'home';
            const freeKickEvent: MatchEvent = {
                time: Math.floor(this.state.time),
                type: 'FREE_KICK',
                actor: opponent || actor, // best available reference
                opponent: actor,
                outcome: 'SUCCESS',
                position: this.state.ballPosition,
                description: `Free kick awarded to ${fkTeam === 'home' ? this.state.homeTeam.name : this.state.awayTeam.name}`,
                teamId: fkTeam === 'home' ? this.state.homeTeam.id : this.state.awayTeam.id
            };
            this.statsTracker.recordEvent(freeKickEvent, fkTeam);
            this.state.eventLog.push(freeKickEvent);

            // Record card
            if (card === 'YELLOW') {
                this.state.statistics.yellowCards[this.state.possession === 'home' ? 0 : 1]++;
            } else if (card === 'RED') {
                this.state.statistics.redCards[this.state.possession === 'home' ? 0 : 1]++;
            }

            // Foul results in turnover
            this.turnover();

            // Advance time slightly (Faster pace -> More events)
            const tickDuration = randomBetween(0.5, 1.5) / 60;
            this.state.time += tickDuration;

            if (this.onStateUpdate) {
                this.onStateUpdate({ ...this.state });
            }

            return true;
        }

        // Roll outcome
        const success = rollActionOutcome(probability);

        // Calculate xG for shooting events
        let xgValue: number | undefined;
        if (event === 'SHOOT' || event === 'SHOOT_LONG') {
            // Estimate defender proximity (simplified)
            const defenderProx = opponent ? 50 + (opponent.attributes.Positioning || 10) * 2 : 70;
            xgValue = calculateXG(this.state.ballPosition, defenderProx);
        }

        // Create event record
        const matchEvent: MatchEvent = {
            time: Math.floor(this.state.time),
            type: event,
            actor,
            opponent: opponent || undefined,
            outcome: success ? 'SUCCESS' : 'FAILURE',
            position: this.state.ballPosition,
            xGContribution: xgValue,
            description: this.generateEventDescription(event, actor, success),
            teamId: possessingTeam.id
        };

        // Handle outcome
        const scoredGoal = this.handleOutcome(event, matchEvent, success, xgValue);

        // Record event
        this.statsTracker.recordEvent(matchEvent, this.state.possession);
        this.state.eventLog.push(matchEvent);

        // Update possession time
        // Tick tuned for ~180-260 events，提升传球量
        const tickDuration = randomBetween(6, 8) / 60; // 6-8 秒/事件
        this.statsTracker.updatePossession(this.state.possession, tickDuration);

        // Update player stamina
        this.updateStamina(tickDuration);

        // Advance time
        this.state.time += tickDuration;

        // Update statistics (with finalized pass accuracy)

        this.updatePlayerPositions();
        this.state.statistics = this.statsTracker.finalize();

        // Snapshot per minute
        this.recordSnapshot(Math.floor(this.state.time));

        // Notify callbacks
        if (this.onStateUpdate) {
            this.onStateUpdate({ ...this.state });
        }

        if (scoredGoal && this.onGoal) {
            this.onGoal(this.state.possession, Math.floor(this.state.time));
        }

        return true; // Continue match
    }

    /**
     * Simulate entire match (original method for backward compatibility)
     */
    simulateMatch(): MatchResult {
        console.log(`âš?Match Start: ${this.state.homeTeam.name} vs ${this.state.awayTeam.name}`);

        let lastSnapshotMinute = -1;
        while (this.state.time < this.matchDuration) {
            this.simulateTick();
            const currentMinute = Math.floor(this.state.time);
            if (currentMinute > lastSnapshotMinute) {
                this.recordSnapshot(currentMinute);
                lastSnapshotMinute = currentMinute;
            }
        }

        console.log(`Full Time: ${this.state.homeTeam.name} ${this.state.score[0]} - ${this.state.score[1]} ${this.state.awayTeam.name}`);

        const finalStats = this.statsTracker.finalize();

        return {
            homeScore: this.state.score[0],
            awayScore: this.state.score[1],
            statistics: finalStats,
            eventLog: this.statsTracker.getEvents(),
            playerRatings: calculatePlayerRatings(
                this.statsTracker.getEvents(),
                this.state.homeTeam.players,
                this.state.awayTeam.players
            ),
            snapshots: this.snapshots
        };
    }

    private handleOutcome(action: ActionType, event: MatchEvent, success: boolean, xgValue?: number): boolean {
        let scoredGoal = false;

        if (success) {
            switch (action) {
                case 'SHOOT':
                case 'SHOOT_LONG':
                    // Goal!
                    const teamIndex = this.state.possession === 'home' ? 0 : 1;
                    this.state.score[teamIndex]++;
                    event.description += ' ⚽GOAL!';
                    scoredGoal = true;
                    this.resetToKickoff();
                    break;

                case 'PASS_SHORT':
                case 'PASS_LONG':
                    // Move ball forward
                    this.moveBall(action === 'PASS_LONG' ? 20 : 10);
                    break;

                case 'DRIBBLE':
                    this.moveBall(5);
                    break;

                case 'CROSS':
                    this.state.phase = 'ATTACK';
                    break;

                case 'TACKLE':
                case 'INTERCEPT':
                    this.turnover();
                    break;
            }
        } else {
            // Failure Outcomes - Generate Defensive Events
            const defender = event.opponent;

            if (defender) {
                let defensiveEvent: MatchEvent | null = null;

                if (action === 'DRIBBLE') {
                    // Dribble fail -> Tackle
                    defensiveEvent = {
                        time: event.time,
                        type: 'TACKLE',
                        actor: defender,
                        opponent: event.actor,
                        outcome: 'SUCCESS',
                        position: event.position,
                        description: `${defender.name} tackles ${event.actor.name}`,
                        teamId: this.getDefendingTeam().id
                    };
                    this.statsTracker.recordEvent(defensiveEvent, this.state.possession === 'home' ? 'away' : 'home');
                    this.state.statistics.tackles[this.state.possession === 'home' ? 1 : 0]++;
                }
                else if (action === 'PASS_SHORT' || action === 'PASS_LONG' || action === 'CROSS') {
                    // Pass fail -> Intercept (50% chance log)
                    if (Math.random() < 0.5) {
                        defensiveEvent = {
                            time: event.time,
                            type: 'INTERCEPT',
                            actor: defender,
                            opponent: event.actor,
                            outcome: 'SUCCESS',
                            position: event.position,
                            description: `${defender.name} intercepts the pass`,
                            teamId: this.getDefendingTeam().id
                        };
                        this.statsTracker.recordEvent(defensiveEvent, this.state.possession === 'home' ? 'away' : 'home');
                    }
                }
                else if (action === 'SHOOT' || action === 'SHOOT_LONG') {
                    // Shot fail -> Save or Block or Miss
                    if (Math.random() < 0.4) {
                        // SAVE
                        defensiveEvent = {
                            time: event.time,
                            type: 'SAVE',
                            actor: defender,
                            outcome: 'SUCCESS',
                            position: event.position,
                            description: `Good save by ${defender.name}!`,
                            teamId: this.getDefendingTeam().id
                        };
                        this.statsTracker.recordEvent(defensiveEvent, this.state.possession === 'home' ? 'away' : 'home');
                    }

                    // Possible Corner
                    if (Math.random() < 0.25) {
                        const cornerEvent: MatchEvent = {
                            time: event.time,
                            type: 'CORNER',
                            actor: event.actor, // Team taking corner
                            outcome: 'SUCCESS',
                            position: { x: this.state.possession === 'home' ? 100 : 0, y: 0 },
                            description: `Corner kick for ${this.state.homeTeam.id === event.actor?.id ? this.state.homeTeam.name : this.state.awayTeam.name}`,
                            teamId: this.state.possession === 'home' ? this.state.homeTeam.id : this.state.awayTeam.id
                        };
                        this.statsTracker.recordEvent(cornerEvent, this.state.possession);
                        this.state.eventLog.push(cornerEvent);
                        this.state.statistics.corners[this.state.possession === 'home' ? 0 : 1]++;
                        return false;
                    }
                }

                if (defensiveEvent) {
                    this.state.eventLog.push(defensiveEvent);
                }
            }

            // Most failures result in turnover
            this.turnover();
        }

        return scoredGoal;
    }

    /**
     * Approximate team strength using average of all visible attributes.
     * Normalized by player count and attribute count to avoid runaway values.
     */
    private computeTeamStrength(team: TeamState): number {
        const players = team.players || [];
        if (players.length === 0) return 0;

        let total = 0;
        let count = 0;
        for (const p of players) {
            const attrs = p.attributes as Record<string, number>;
            for (const val of Object.values(attrs)) {
                if (typeof val === 'number') {
                    total += val;
                    count++;
                }
            }
        }
        const avg = count > 0 ? total / count : 0;
        // Return rough CA-like number (0-100)
        return avg * 5; // attributes 1-20 -> ~5x to map toward CA scale
    }

    /**
     * Team strength modifier: clamp to 0.85-1.15 to avoid extremes.
     */
    private getTeamStrengthMod(): number {
        const diff = this.teamStrengthDiff; // -0.3 ~ +0.3
        const mod = 1 + diff;
        return Math.max(0.85, Math.min(1.15, mod));
    }

    /**
     * Context modifier: home advantage, score/time pressure.
     */
    private getContextModifier(): number {
        let mod = 1.0;

        // Home advantage
        mod *= this.state.possession === 'home' ? 1.08 : 0.97;

        // Time pressure: final 15 minutes
        const timeRemaining = Math.max(0, this.matchDuration - this.state.time);
        const scoreDiff = this.state.score[0] - this.state.score[1]; // home - away

        // Trailing team pushes harder, leading team stabilizes
        if (timeRemaining < 15) {
            if (scoreDiff < 0 && this.state.possession === 'home') mod *= 1.08;
            if (scoreDiff > 0 && this.state.possession === 'home') mod *= 0.96;
            if (scoreDiff > 0 && this.state.possession === 'away') mod *= 1.08;
            if (scoreDiff < 0 && this.state.possession === 'away') mod *= 0.96;
        }

        // Derby / high aggression hook (placeholder flag via tacticalModifiers.DERBY)
        const derbyBoost = this.getPossessingTeam().tacticalModifiers.derby ? 1.05 : 1.0;
        mod *= derbyBoost;

        return Math.max(0.85, Math.min(1.15, mod));
    }

    private generateEvent(): ActionType {
        const phase = this.state.phase;
        const ballY = this.state.ballPosition.y;
        const mods = this.getPossessingTeam().tacticalModifiers || {};

        const inAttackingThird = this.state.possession === 'home'
            ? ballY > 66
            : ballY < 34;

        const tempoBias = mods.tempo || 0;
        const directBias = mods.directness || 0;
        const widthBias = mods.width || 0;
        const counterPress = mods.counterPress ? 1.05 : 1.0;
        const counter = mods.counter ? 1.05 : 1.0;

        if (phase === 'ATTACK') {
            if (inAttackingThird) {
                return weightedRandom<ActionType>(
                    ['PASS_SHORT', 'SHOOT', 'CROSS', 'DRIBBLE'],
                    [
                        0.70 - directBias * 0.04 - tempoBias * 0.02 + (mods.workBallIntoBox ? 0.05 : 0),
                        0.08 + tempoBias * 0.01 + (mods.shootOnSight ? 0.05 : 0),
                        0.18 + widthBias * 0.05 + (mods.hitEarlyCrosses ? 0.05 : 0),
                        0.04 + tempoBias * 0.01
                    ]
                );
            } else {
                return weightedRandom<ActionType>(
                    ['PASS_SHORT', 'PASS_LONG', 'DRIBBLE'],
                    [
                        0.80 - directBias * 0.05 + (mods.workBallIntoBox ? 0.05 : 0),
                        0.12 + directBias * 0.07 + (mods.counter ? 0.05 : 0),
                        0.08 + tempoBias * 0.015
                    ]
                );
            }
        } else if (phase === 'DEFEND') {
            return weightedRandom<ActionType>(
                ['TACKLE', 'INTERCEPT', 'CLEARANCE'],
                [
                    0.04 + (mods.pressingIntensity || 0) * 0.018 + (mods.tackleHarder ? 0.01 : 0),
                    0.32 + (mods.engagementLine || 0) * 0.02,
                    0.64 + (mods.defensiveLine || 0) * -0.01
                ]
            );
        } else {
            return weightedRandom<ActionType>(
                ['PASS_LONG', 'PASS_SHORT', 'DRIBBLE'],
                [
                    0.16 + directBias * 0.05 + counter * 0.02,
                    0.76 - directBias * 0.05 + (mods.workBallIntoBox ? 0.03 : 0),
                    0.08 + tempoBias * 0.01 + counterPress * 0.01
                ]
            );
        }
    }

    private selectPlayer(team: TeamState, action: ActionType, attacking: boolean): PlayerState {
        const formation = getFormation(team.formation);
        const nearestIndex = findNearestPlayer(this.state.ballPosition, formation.positions);
        return team.players[nearestIndex];
    }

    private turnover(): void {
        this.state.possession = this.state.possession === 'home' ? 'away' : 'home';
        this.state.phase = 'TRANSITION';
    }

    private resetToKickoff(): void {
        this.state.ballPosition = { x: 50, y: 50 };
        this.state.phase = 'TRANSITION';
        this.turnover();
    }

    /**
     * Apply a substitution (UI-driven). Updates lineup and bench; does not rewrite past events.
     */
    applySubstitution(team: 'home' | 'away', outPlayerId: number | string, inPlayerId: number | string): boolean {
        const teamState = team === 'home' ? this.state.homeTeam : this.state.awayTeam;
        if (!teamState.bench) teamState.bench = [];
        const outIdx = teamState.players.findIndex(p => p.id === outPlayerId);
        const inIdx = teamState.bench.findIndex(p => p.id === inPlayerId);
        if (outIdx === -1 || inIdx === -1) return false;
        const outP = teamState.players[outIdx];
        const inP = teamState.bench[inIdx];
        teamState.players[outIdx] = inP;
        teamState.bench.splice(inIdx, 1);
        teamState.bench.push(outP);
        return true;
    }

    private moveBall(distance: number): void {
        if (this.state.possession === 'home') {
            this.state.ballPosition.y = Math.min(100, this.state.ballPosition.y + distance);
            this.state.phase = this.state.ballPosition.y > 66 ? 'ATTACK' : 'TRANSITION';
        } else {
            this.state.ballPosition.y = Math.max(0, this.state.ballPosition.y - distance);
            this.state.phase = this.state.ballPosition.y < 34 ? 'ATTACK' : 'TRANSITION';
        }
    }

    private updateStamina(duration: number): void {
        const modsHome = this.state.homeTeam.tacticalModifiers || {};
        const modsAway = this.state.awayTeam.tacticalModifiers || {};

        const decayBase = duration * 0.5;

        const pressDecayHome = decayBase * (1 + (modsHome.pressingIntensity || 0) * 0.25);
        const pressDecayAway = decayBase * (1 + (modsAway.pressingIntensity || 0) * 0.25);

        const tempoDecayHome = pressDecayHome * (1 + (modsHome.tempo || 0) * 0.15);
        const tempoDecayAway = pressDecayAway * (1 + (modsAway.tempo || 0) * 0.15);

        for (const player of this.state.homeTeam.players) {
            player.stamina = Math.max(0, player.stamina - tempoDecayHome);
        }

        for (const player of this.state.awayTeam.players) {
            player.stamina = Math.max(0, player.stamina - tempoDecayAway);
        }
    }

    private recordSnapshot(minute: number): void {
        // Avoid duplicate minutes
        if (this.snapshots.length && this.snapshots[this.snapshots.length - 1].minute === minute) return;
        const home = this.state.homeTeam.players.map(p => ({
            id: p.id,
            stamina: Math.round(p.stamina),
            morale: Math.round(p.morale ?? 75),
            condition: Math.round(p.condition ?? p.stamina)
        }));
        const away = this.state.awayTeam.players.map(p => ({
            id: p.id,
            stamina: Math.round(p.stamina),
            morale: Math.round(p.morale ?? 75),
            condition: Math.round(p.condition ?? p.stamina)
        }));
        this.snapshots.push({ minute, home, away });
    }

    private updatePlayerPositions(): void {
        const ballY = this.state.ballPosition.y;
        // Home team players
        this.state.homeTeam.players.forEach((player, idx) => {
            const baseY = 20 + (idx * 7);
            const targetY = baseY * 0.7 + ballY * 0.3;
            player.currentPosition = {
                x: 30 + (idx % 3) * 20,
                y: Math.max(5, Math.min(95, targetY))
            };
        });
        // Away team players
        this.state.awayTeam.players.forEach((player, idx) => {
            const baseY = 80 - (idx * 7);
            const targetY = baseY * 0.7 + ballY * 0.3;
            player.currentPosition = {
                x: 30 + (idx % 3) * 20,
                y: Math.max(5, Math.min(95, targetY))
            };
        });
    }

    private generateEventDescription(action: ActionType, actor: PlayerState, success: boolean): string {
        const actionText = {
            PASS_SHORT: '短传',
            PASS_LONG: '长传',
            SHOOT: '射门',
            SHOOT_LONG: '远射',
            TACKLE: '抢断',
            DRIBBLE: '盘带',
            CROSS: '传中',
            INTERCEPT: '拦截',
            HEADER: '头球',
            FIRST_TOUCH: '停球',
            CLEARANCE: '解围'
        };

        return `${actor.name} ${actionText[action]} - ${success ? '成功' : '失败'}`;
    }

    private getPossessingTeam(): TeamState {
        return this.state.possession === 'home' ? this.state.homeTeam : this.state.awayTeam;
    }

    private getDefendingTeam(): TeamState {
        return this.state.possession === 'home' ? this.state.awayTeam : this.state.homeTeam;
    }

    getState(): MatchState {
        return { ...this.state };
    }

    isFinished(): boolean {
        return this.state.time >= this.matchDuration;
    }

    getCurrentTime(): number {
        return this.state.time;
    }

    /**
     * Check if a foul should be generated (8-18 fouls per match)
     */
    private checkForFoul(actor: PlayerState, opponent: PlayerState | null): boolean {
        if (!opponent) return false;

        // Base ~0.6% 每 tick，结合 tickDuration(4-7s) 目标 8-15 犯规/场
        let foulChance = 0.006;
        const aggression = actor.attributes.Aggression || 10;
        // Aggression 5 -> 0.75x, 10 -> 1.1x, 20 -> 1.6x
        foulChance *= Math.max(0.75, Math.min(1.6, aggression / 9));

        if (this.state.phase === 'DEFEND') {
            foulChance *= 1.6;
        }

        return Math.random() < foulChance;
    }

    /**
     * Handle foul and determine card type
     */
    private handleFoul(player: PlayerState): CardType {
        const aggression = player.attributes.Aggression || 10;
        // 基础黄牌概率：约 22% * (Agg/12)，夹在 5%-35%
        const baseCardProb = Math.max(0.05, Math.min(0.35, 0.22 * (aggression / 12)));

        // Second yellow 概率更高以提升红牌出现率
        if (player.yellowCards >= 1 && Math.random() < baseCardProb * 0.5) {
            player.redCard = true;
            return 'RED';
        }

        // 直接红牌小概率（高侵略性更易触发）
        if (aggression > 15 && Math.random() < 0.03) {
            player.redCard = true;
            return 'RED';
        }

        if (Math.random() < baseCardProb) {
            player.yellowCards++;
            return 'YELLOW';
        }

        return 'NONE';
    }
}
