import { Player } from '../types';
import { PlayerAttributes, AttributeDelta } from '../types/attributes';
import { canGrowToPA } from './capaCalculator';

export interface TrainingSession {
    name: string;
    focus: keyof PlayerAttributes | 'general';
    intensity: 'low' | 'medium' | 'high';
}

export interface TrainingSchedule {
    id: string;
    name: string;
    sessions: TrainingSession[];
    intensity: 'low' | 'medium' | 'high';
}

export interface Coach {
    id: string;
    name: string;
    attributes: {
        coaching: number; // 1-20
        manManagement: number; // 1-20
        determination: number; // 1-20
    };
}

// Default Schedules
export const DEFAULT_SCHEDULES: Record<string, TrainingSchedule> = {
    'GENERAL': {
        id: 'general',
        name: 'General / Balanced',
        intensity: 'medium',
        sessions: [
            { name: 'Possession', focus: 'passing', intensity: 'medium' },
            { name: 'Defending', focus: 'tackling', intensity: 'medium' },
            { name: 'Attacking', focus: 'finishing', intensity: 'medium' }
        ]
    },
    'FITNESS': {
        id: 'fitness',
        name: 'Physical / Fitness',
        intensity: 'high',
        sessions: [
            { name: 'Endurance', focus: 'stamina', intensity: 'high' },
            { name: 'Sprints', focus: 'pace', intensity: 'high' },
            { name: 'Gym', focus: 'strength', intensity: 'high' }
        ]
    },
    'TECHNICAL': {
        id: 'technical',
        name: 'Technical Skills',
        intensity: 'medium',
        sessions: [
            { name: 'Ball Control', focus: 'technique', intensity: 'medium' },
            { name: 'Shooting', focus: 'finishing', intensity: 'medium' },
            { name: 'Set Pieces', focus: 'free_kick_taking', intensity: 'low' }
        ]
    }
};

export function applyWeeklyTraining(
    player: Player,
    schedule: TrainingSchedule,
    coach: Coach
): AttributeDelta {
    const delta: AttributeDelta = {};

    // 1. Check Growth Potential
    const canGrow = canGrowToPA(player.ca, player.pa, player.age);

    // Even if at PA, players can shift attributes (re-distribution), but for MVP we limit growth
    if (!canGrow && player.age > 28) {
        // Older players might decline
        return applyDecline(player);
    }

    // 2. Calculate Base Growth Rate
    // Formula: (Coach★ * Session★ * Determination) / Scale
    const coachFactor = coach.attributes.coaching / 20; // 0.05 - 1.0
    const sessionFactor = schedule.intensity === 'high' ? 1.2 : schedule.intensity === 'medium' ? 1.0 : 0.8;
    const determinationFactor = (player.attributes.mental.determination || 10) / 20;
    const ageFactor = player.age < 21 ? 1.5 : player.age < 24 ? 1.2 : player.age < 29 ? 1.0 : 0.5;

    // Base gain per attribute per week (very small, e.g., 0.01 - 0.05)
    // 0.05 * 1.0 * 0.5 * 1.0 * 0.05 = ~0.00125
    // We want visible progress over a season (52 weeks). 
    // Target: +5-10 CA points per year for wonderkids.
    // 1 CA point ~ 10-15 attribute points total? No, 1 CA ~ 1 weighted attribute point.
    // So we need ~0.1 - 0.2 growth per week total.

    const baseGrowth = 0.02 * coachFactor * sessionFactor * determinationFactor * ageFactor;

    // 3. Apply to Focused Attributes
    schedule.sessions.forEach(session => {
        if (session.focus !== 'general') {
            const attrName = session.focus as string;
            // Check if attribute exists in player (flattened check logic needed or try/catch)
            // For MVP, we assume focus maps to valid keys.

            // Random variation
            const roll = Math.random() * 0.5 + 0.75; // 0.75 - 1.25
            const gain = baseGrowth * roll;

            delta[attrName] = (delta[attrName] || 0) + gain;
        }
    });

    // 4. General Growth (Physicals usually grow with any training)
    if (player.age < 21) {
        delta['stamina'] = (delta['stamina'] || 0) + baseGrowth * 0.5;
        delta['strength'] = (delta['strength'] || 0) + baseGrowth * 0.5;
    }

    return delta;
}

function applyDecline(player: Player): AttributeDelta {
    const delta: AttributeDelta = {};
    // Physicals decline first for players > 30
    if (player.age > 30) {
        const declineRate = -0.01 * (player.age - 29); // Accelerates with age
        delta['pace'] = declineRate;
        delta['acceleration'] = declineRate;
        delta['stamina'] = declineRate;
    }
    return delta;
}
