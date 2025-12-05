// Match Statistics Tracker
// Records all match events and calculates stats like possession, xG, etc.

import { MatchEvent, MatchStatistics, ActionType } from './types';

export class MatchStatsTracker {
    private stats: MatchStatistics;
    private events: MatchEvent[];
    private possessionTime: { home: number; away: number };

    constructor() {
        this.stats = {
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
        };
        this.events = [];
        this.possessionTime = { home: 0, away: 0 };
    }

    /**
     * Record a match event and update statistics
     */
    recordEvent(event: MatchEvent, teamSide: 'home' | 'away'): void {
        this.events.push(event);
        const teamIndex = teamSide === 'home' ? 0 : 1;

        // Update stats based on event type
        switch (event.type) {
            case 'SHOOT':
            case 'SHOOT_LONG':
                this.stats.shots[teamIndex]++;
                if (event.outcome === 'SUCCESS') {
                    this.stats.shotsOnTarget[teamIndex]++;
                }
                if (event.xGContribution) {
                    this.stats.xG[teamIndex] += event.xGContribution;
                }
                break;

            case 'PASS_SHORT':
            case 'PASS_LONG':
                this.stats.passes[teamIndex]++;
                break;

            case 'TACKLE':
            case 'INTERCEPT':
                this.stats.tackles[teamIndex]++;
                break;

            case 'CROSS':
                if (event.outcome === 'FAILURE') {
                    this.stats.corners[teamIndex === 0 ? 1 : 0]++; // Opponent corner
                }
                break;

            case 'FOUL':
                this.stats.fouls[teamIndex]++;
                break;
        }
    }

    /**
     * Update possession time (call each tick)
     */
    updatePossession(teamSide: 'home' | 'away', duration: number): void {
        this.possessionTime[teamSide] += duration;

        // Calculate possession percentages
        const total = this.possessionTime.home + this.possessionTime.away;
        if (total > 0) {
            this.stats.possession[0] = Math.round((this.possessionTime.home / total) * 100);
            this.stats.possession[1] = Math.round((this.possessionTime.away / total) * 100);
        }
    }

    /**
     * Calculate pass accuracy at end of match
     */
    finalize(): MatchStatistics {
        // Calculate pass accuracy from events
        const homePassAttempts = this.events.filter(e =>
            (e.type === 'PASS_SHORT' || e.type === 'PASS_LONG') &&
            this.isHomeTeamEvent(e)
        ).length;

        const homePassSuccess = this.events.filter(e =>
            (e.type === 'PASS_SHORT' || e.type === 'PASS_LONG') &&
            this.isHomeTeamEvent(e) &&
            e.outcome === 'SUCCESS'
        ).length;

        const awayPassAttempts = this.events.filter(e =>
            (e.type === 'PASS_SHORT' || e.type === 'PASS_LONG') &&
            !this.isHomeTeamEvent(e)
        ).length;

        const awayPassSuccess = this.events.filter(e =>
            (e.type === 'PASS_SHORT' || e.type === 'PASS_LONG') &&
            !this.isHomeTeamEvent(e) &&
            e.outcome === 'SUCCESS'
        ).length;

        this.stats.passAccuracy[0] = homePassAttempts > 0
            ? Math.round((homePassSuccess / homePassAttempts) * 100)
            : 0;

        this.stats.passAccuracy[1] = awayPassAttempts > 0
            ? Math.round((awayPassSuccess / awayPassAttempts) * 100)
            : 0;

        return this.stats;
    }

    private isHomeTeamEvent(event: MatchEvent): boolean {
        // Simple heuristic: check if actor ID is in home team range (0-10)
        // This should be improved with proper team tracking
        return event.actor.id < 11;
    }

    getStats(): MatchStatistics {
        return { ...this.stats };
    }

    getEvents(): MatchEvent[] {
        return [...this.events];
    }
}
