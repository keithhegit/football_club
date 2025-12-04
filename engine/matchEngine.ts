// Match Engine - Core simulation loop
// Simulates 90-minute football matches using probability-based event system

import {
    MatchState, MatchResult, TeamState, PlayerState, MatchEvent,
    ActionType, MatchPhase, Position, MatchConditions
} from './types';
import { computeActionSuccess, rollActionOutcome, calculateXG } from './probabilityEngine';
import { getActionModifier } from './tacticalMods';
import { getFormation, findNearestPlayer } from './formation';
import { MatchStatsTracker } from './matchStats';
import { weightedRandom, randomBetween, randomInt } from './utils/mathHelpers';

export class MatchEngine {
    private state: MatchState;
    private statsTracker: MatchStatsTracker;
    private matchDuration: number = 90; // minutes

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
                corners: [0, 0]
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
     * Simulate entire match
     */
    simulateMatch(): MatchResult {
        console.log(`⚽ Match Start: ${this.state.homeTeam.name} vs ${this.state.awayTeam.name}`);

        while (this.state.time < this.matchDuration) {
            this.simulateTick();
        }

        console.log(`🏁 Full Time: ${this.state.homeTeam.name} ${this.state.score[0]} - ${this.state.score[1]} ${this.state.awayTeam.name}`);

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
     * Simulate one game tick (3-5 seconds of match time)
     */
    private simulateTick(): void {
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
        if (success) {
            this.handleSuccess(event, matchEvent);
        } else {
            this.handleFailure(event, matchEvent);
        }

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
    }

    /**
     * Generate event type based on current phase and position
     */
    private generateEvent(): ActionType {
        const phase = this.state.phase;
        const ballY = this.state.ballPosition.y;

        // Determine if in attacking third
        const inAttackingThird = this.state.possession === 'home'
            ? ballY > 66
            : ballY < 34;

        if (phase === 'ATTACK') {
            if (inAttackingThird) {
                // Final third - more shots and crosses
                return weightedRandom<ActionType>(
                    ['PASS_SHORT', 'SHOOT', 'CROSS', 'DRIBBLE'],
                    [0.3, 0.3, 0.2, 0.2]
                );
            } else {
                // Build-up play
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
            // Transition
            return weightedRandom<ActionType>(
                ['PASS_LONG', 'PASS_SHORT', 'DRIBBLE'],
                [0.4, 0.4, 0.2]
            );
        }
    }

    /**
     * Select player from team based on ball position
     */
    private selectPlayer(team: TeamState, action: ActionType, attacking: boolean): PlayerState {
        const formation = getFormation(team.formation);
        const nearestIndex = findNearestPlayer(this.state.ballPosition, formation.positions);
        return team.players[nearestIndex];
    }

    /**
     * Handle successful action
     */
    private handleSuccess(action: ActionType, event: MatchEvent): void {
        switch (action) {
            case 'SHOOT':
            case 'SHOOT_LONG':
                // Goal!
                const teamIndex = this.state.possession === 'home' ? 0 : 1;
                this.state.score[teamIndex]++;
                event.description += ' ⚽ GOAL!';
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
    }

    /**
     * Handle failed action
     */
    private handleFailure(action: ActionType, event: MatchEvent): void {
        // Most failures result in turnover
        if (action !== 'SHOOT' && action !== 'SHOOT_LONG') {
            this.turnover();
        }
    }

    /**
     * Switch possession
     */
    private turnover(): void {
        this.state.possession = this.state.possession === 'home' ? 'away' : 'home';
        this.state.phase = 'TRANSITION';
    }

    /**
     * Reset to kickoff after goal
     */
    private resetToKickoff(): void {
        this.state.ballPosition = { x: 50, y: 50 };
        this.state.phase = 'TRANSITION';
        this.turnover(); // Kick off for team that conceded
    }

    /**
     * Move ball position
     */
    private moveBall(distance: number): void {
        if (this.state.possession === 'home') {
            this.state.ballPosition.y = Math.min(100, this.state.ballPosition.y + distance);
            this.state.phase = this.state.ballPosition.y > 66 ? 'ATTACK' : 'TRANSITION';
        } else {
            this.state.ballPosition.y = Math.max(0, this.state.ballPosition.y - distance);
            this.state.phase = this.state.ballPosition.y < 34 ? 'ATTACK' : 'TRANSITION';
        }
    }

    /**
     * Update player stamina
     */
    private updateStamina(duration: number): void {
        // Stamina decreases over time
        const staminaDecay = duration * 0.5; // 0.5% per minute

        for (const player of this.state.homeTeam.players) {
            player.stamina = Math.max(0, player.stamina - staminaDecay);
        }

        for (const player of this.state.awayTeam.players) {
            player.stamina = Math.max(0, player.stamina - staminaDecay);
        }
    }

    /**
     * Generate event description
     */
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

    /**
     * Get current match state (for UI updates)
     */
    getState(): MatchState {
        return { ...this.state };
    }
}
