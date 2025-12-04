// Player Rating Calculator
// Calculates 1-10 ratings based on match performance

import { MatchEvent, PlayerState } from './types';

interface PlayerPerformance {
    playerId: number;
    events: MatchEvent[];
    successRate: number;
    keyActions: number;
    goals: number;
    assists: number;
}

/**
 * Calculate player ratings from match events
 * Returns Map of playerId -> rating (1-10)
 */
export function calculatePlayerRatings(
    events: MatchEvent[],
    homeTeamPlayers: PlayerState[],
    awayTeamPlayers: PlayerState[]
): Map<number, number> {
    const ratings = new Map<number, number>();
    const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers];

    // Track performance for each player
    const performances = new Map<number, PlayerPerformance>();

    // Initialize performance tracking
    for (const player of allPlayers) {
        performances.set(player.id, {
            playerId: player.id,
            events: [],
            successRate: 0,
            keyActions: 0,
            goals: 0,
            assists: 0
        });
    }

    // Process events
    for (const event of events) {
        const perf = performances.get(event.actor.id);
        if (!perf) continue;

        perf.events.push(event);

        // Count successes
        if (event.outcome === 'SUCCESS') {
            perf.keyActions++;
        }

        // Count goals
        if (event.description.includes('GOAL')) {
            perf.goals += 2; // Goals heavily weighted
        }

        // Count defensive actions
        if (event.type === 'TACKLE' || event.type === 'INTERCEPT') {
            if (event.outcome === 'SUCCESS') {
                perf.keyActions++;
            }
        }
    }

    // Calculate ratings
    for (const [playerId, perf] of performances) {
        const totalEvents = perf.events.length;

        if (totalEvents === 0) {
            ratings.set(playerId, 6.0); // Default rating
            continue;
        }

        // Base rating from success rate
        const successCount = perf.events.filter(e => e.outcome === 'SUCCESS').length;
        const successRate = successCount / totalEvents;
        let rating = 5.0 + (successRate * 3); // 5-8 base range

        // Bonus for goals
        rating += perf.goals * 0.5; // +0.5 per goal

        // Bonus for key actions
        rating += Math.min(perf.keyActions / 10, 1.0); // Up to +1 for key actions

        // Clamp to 1-10
        rating = Math.max(1.0, Math.min(10.0, rating));

        ratings.set(playerId, Math.round(rating * 10) / 10);
    }

    return ratings;
}

/**
 * Get rating color class based on rating value
 */
export function getRatingColor(rating: number): string {
    if (rating >= 8.5) return 'text-emerald-400'; // Excellent
    if (rating >= 7.5) return 'text-green-400'; // Good
    if (rating >= 6.5) return 'text-yellow-400'; // Average
    if (rating >= 5.5) return 'text-orange-400'; // Below average
    return 'text-red-400'; // Poor
}

/**
 * Get rating description
 */
export function getRatingDescription(rating: number): string {
    if (rating >= 9.0) return '世界级表现';
    if (rating >= 8.0) return '出色发挥';
    if (rating >= 7.0) return '优秀表现';
    if (rating >= 6.0) return '正常发挥';
    if (rating >= 5.0) return '表现一般';
    return '糟糕表现';
}
