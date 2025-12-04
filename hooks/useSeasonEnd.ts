/**
 * Custom hook for season end processing
 * Handles CA growth updates for all squad players
 */

import { useCallback } from 'react';
import { Player, Team } from '../types';
import { calculateSquadGrowth } from '../services/playerGrowth';

export interface PlayerGrowthUpdate {
    playerId: string;
    name: string;
    ageOld: number;
    ageNew: number;
    caOld: number;
    caNew: number;
    caChange: number;
    factors: {
        baseGrowth: number;
        matchBonus: number;
        trainingBonus: number;
        injuryPenalty: number;
    };
}

interface UseSeasonEndReturn {
    processSeasonEnd: (
        team: Team,
        teamFactors?: {
            trainingFacilityLevel?: number;
            coachLevel?: number;
        }
    ) => PlayerGrowthUpdate[];
}

/**
 * Hook to handle season end player growth
 * Usage in App.tsx when advancing to next season
 */
export function useSeasonEnd(): UseSeasonEndReturn {

    const processSeasonEnd = useCallback((
        team: Team,
        teamFactors = {}
    ): PlayerGrowthUpdate[] => {
        const {
            trainingFacilityLevel = 5, // Default medium quality
            coachLevel = 10              // Default average coach
        } = teamFactors;

        // Calculate growth for all players
        const growthUpdates = calculateSquadGrowth(
            team.players.map(p => ({
                id: p.id,
                name: p.name,
                ca: p.ca,
                pa: p.pa,
                age: p.age,
                initialCA: p.initialCA || p.ca,
                seasonStats: p.seasonStats || {
                    matches: 0,
                    goals: 0,
                    assists: 0,
                    injuries: 0
                }
            })),
            {
                trainingFacilityLevel,
                coachLevel
            }
        );

        return growthUpdates;
    }, []);

    return { processSeasonEnd };
}

/**
 * Helper: Apply growth updates to team
 * This updates the team object with new CA/age values
 */
export function applyGrowthToTeam(
    team: Team,
    updates: PlayerGrowthUpdate[]
): Team {
    return {
        ...team,
        players: team.players.map(player => {
            const update = updates.find(u => u.playerId === player.id);
            if (!update) return player;

            return {
                ...player,
                ca: update.caNew,
                age: update.ageNew,
                // Reset season stats for new season
                seasonStats: {
                    matches: 0,
                    goals: 0,
                    assists: 0,
                    injuries: 0
                }
            };
        })
    };
}
