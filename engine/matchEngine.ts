// Match Engine - Enhanced with step-by-step simulation for real-time playback
// Extends core simulation with frame-by-frame control

import {
    MatchState, MatchResult, TeamState, PlayerState, MatchEvent,
    ActionType, MatchPhase, Position, MatchConditions, CardType
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
    private matchDuration: number = 90; // minutes
    private isPaused: boolean = false;
    private simulationSpeed: number = 1; // 1x, 2x, 5x

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
                yellowCards: [0, 0],
                redCards: [0, 0]
            },
            conditions: {
                weather: 'clear',
                pitch: 'good',
                temperature: 20
            }
        };

        this.statsTracker = new MatchStatsTracker();
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
        const opponent = event !== 'DRIBBLE' && event !== 'SHOOT'
            ? this.selectPlayer(defendingTeam, event, false)
            : null;

        // Calculate success probability
        const probability = computeActionSuccess(
            event,
            actor,
            opponent,
            possessingTeam.tacticalModifiers,
            this.state.conditions
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
                description: `${actor.name} commits a foul${card !== 'NONE' ? ` and receives a ${card} CARD` : ''}`
            };

            this.statsTracker.recordEvent(foulEvent, this.state.possession);
            this.state.eventLog.push(foulEvent);

            // Record card
            if (card === 'YELLOW') {
                this.state.statistics.yellowCards[this.state.possession === 'home' ? 0 : 1]++;
            } else if (card === 'RED') {
                this.state.statistics.redCards[this.state.possession === 'home' ? 0 : 1]++;
            }

            // Foul results in turnover
            this.turnover();

            // Advance time slightly
            const tickDuration = randomBetween(2, 3) / 60;
            this.state.time += tickDuration;

            if (this.onStateUpdate) {
                this.onStateUpdate({ ...this.state });
            }

            return true;
        }

        // Roll outcome
        const success = rollActionOutcome(probability);

        // Create event record
        const matchEvent: MatchEvent = {
            time: Math.floor(this.state.time),
            type: event,
            actor,
            opponent: opponent || undefined,
            outcome: success ? 'SUCCESS' : 'FAILURE',
            position: this.state.ballPosition,
            description: this.generateEventDescription(event, actor, success)
        };

        // Handle outcome
        const scoredGoal = this.handleOutcome(event, matchEvent, success);

        // Record event
        this.statsTracker.recordEvent(matchEvent, this.state.possession);
        this.state.eventLog.push(matchEvent);

        // Update possession time
        const tickDuration = randomBetween(3, 5) / 60; // Convert seconds to minutes
        this.statsTracker.updatePossession(this.state.possession, tickDuration);

        // Update player stamina
        this.updateStamina(tickDuration);

        // Advance time
        this.state.time += tickDuration;

        // Update statistics from tracker
        this.state.statistics = this.statsTracker.getStats();

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

        while (this.state.time < this.matchDuration) {
            this.simulateTick();
        }

        console.log(`ðŸ�� Full Time: ${this.state.homeTeam.name} ${this.state.score[0]} - ${this.state.score[1]} ${this.state.awayTeam.name}`);

        const finalStats = this.statsTracker.finalize();

        return {
            homeScore: this.state.score[0],
            awayScore: this.state.score[1],
            statistics: finalStats,
            eventLog: this.statsTracker.getEvents(),
            playerRatings: new Map() // TODO: Calculate ratings
        };
    }

    /**
     * Handle action outcome and return if a goal was scored
     */
    private handleOutcome(action: ActionType, event: MatchEvent, success: boolean): boolean {
        let scoredGoal = false;

        if (success) {
            switch (action) {
                case 'SHOOT':
                case 'SHOOT_LONG':
                    // Goal!
                    const teamIndex = this.state.possession === 'home' ? 0 : 1;
                    this.state.score[teamIndex]++;
                    event.description += ' âš?GOAL!';
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
            // Most failures result in turnover
            if (action !== 'SHOOT' && action !== 'SHOOT_LONG') {
                this.turnover();
            }
        }

        return scoredGoal;
    }

    // ... rest of methods remain the same
    private generateEvent(): ActionType {
        const phase = this.state.phase;
        const ballY = this.state.ballPosition.y;

        const inAttackingThird = this.state.possession === 'home'
            ? ballY > 66
            : ballY < 34;

        if (phase === 'ATTACK') {
            if (inAttackingThird) {
                return weightedRandom<ActionType>(
                    ['PASS_SHORT', 'SHOOT', 'CROSS', 'DRIBBLE'],
                    [0.3, 0.3, 0.2, 0.2]
                );
            } else {
                return weightedRandom<ActionType>(
                    ['PASS_SHORT', 'PASS_LONG', 'DRIBBLE'],
                    [0.5, 0.3, 0.2]
                );
            }
        } else if (phase === 'DEFEND') {
            return weightedRandom<ActionType>(
                ['TACKLE', 'INTERCEPT', 'CLEARANCE'],
                [0.5, 0.3, 0.2]
            );
        } else {
            return weightedRandom<ActionType>(
                ['PASS_LONG', 'PASS_SHORT', 'DRIBBLE'],
                [0.4, 0.4, 0.2]
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
        const staminaDecay = duration * 0.5;

        for (const player of this.state.homeTeam.players) {
            player.stamina = Math.max(0, player.stamina - staminaDecay);
        }

        for (const player of this.state.awayTeam.players) {
            player.stamina = Math.max(0, player.stamina - staminaDecay);
        }
    }

    private generateEventDescription(action: ActionType, actor: PlayerState, success: boolean): string {
        const actionText = {
            PASS_SHORT: 'çŸ­ä¼ ',
            PASS_LONG: 'é•¿ä¼ ',
            SHOOT: 'å°„é—¨',
            SHOOT_LONG: 'è¿œå°„',
            TACKLE: 'æŠ¢æ–­',
            DRIBBLE: 'ç›˜å¸¦',
            CROSS: 'ä¼ ä¸­',
            INTERCEPT: 'æ‹¦æˆª',
            HEADER: 'å¤´ç�ƒ',
            FIRST_TOUCH: 'å�œç�ƒ',
            CLEARANCE: 'è§£å›´'
        };

        return `${actor.name} ${actionText[action]} - ${success ? 'æˆ�åŠŸ' : 'å¤±è´¥'}`;
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

        let foulChance = 0.02;
        const aggression = actor.attributes.Aggression || 10;
        foulChance *= (aggression / 10);

        if (this.state.phase === 'DEFEND') {
            foulChance *= 1.5;
        }

        return Math.random() < foulChance;
    }

    /**
     * Handle foul and determine card type
     */
    private handleFoul(player: PlayerState): CardType {
        const aggression = player.attributes.Aggression || 10;
        const cardProb = (aggression / 20) * 0.20;

        if (player.yellowCards >= 1 && Math.random() < cardProb * 0.4) {
            player.redCard = true;
            return 'RED';
        }

        if (Math.random() < cardProb) {
            player.yellowCards++;
            return 'YELLOW';
        }

        return 'NONE';
    }
}
