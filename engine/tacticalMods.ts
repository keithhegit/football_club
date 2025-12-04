// Tactical Modifiers - Team Instructions to Probability Multipliers
// Based on FM2023 Team Instructions system

import { ActionType, TacticalModifiers } from './types';

/**
 * Team mentality presets with probability modifiers.
 * Affects overall team behavior and risk-taking.
 */
export const MENTALITY_MODIFIERS: Record<string, TacticalModifiers> = {
    'Very Attacking': {
        SHOOT: 1.3,
        SHOOT_LONG: 1.2,
        PASS_LONG: 1.2,
        DRIBBLE: 1.1,
        TACKLE: 0.8,
        INTERCEPT: 0.8,
        // Positioning risk increases (more space left behind)
        POSITIONING_RISK: 1.25
    },

    'Attacking': {
        SHOOT: 1.2,
        PASS_LONG: 1.1,
        DRIBBLE: 1.05,
        TACKLE: 0.9,
        POSITIONING_RISK: 1.15
    },

    'Balanced': {
        // No modifiers, baseline 1.0 for all
    },

    'Defensive': {
        SHOOT: 0.85,
        PASS_SHORT: 0.9,
        TACKLE: 1.15,
        INTERCEPT: 1.2,
        CLEARANCE: 1.2,
        PASS_LONG: 1.1, // Counter-attack
        POSITIONING_RISK: 0.8
    },

    'Very Defensive': {
        SHOOT: 0.7,
        PASS_SHORT: 0.85,
        TACKLE: 1.25,
        INTERCEPT: 1.3,
        CLEARANCE: 1.3,
        PASS_LONG: 1.2,
        POSITIONING_RISK: 0.7
    }
};

/**
 * Tempo modifiers - affects passing speed and decision time.
 */
export const TEMPO_MODIFIERS: Record<string, TacticalModifiers> = {
    'Much Higher': {
        PASS_SHORT: 1.2,
        PASS_LONG: 1.1,
        DRIBBLE: 0.9, // Less time on ball
        FIRST_TOUCH: 0.95,
        INTERCEPT: 0.8 // Opponent has less time to react
    },

    'Higher': {
        PASS_SHORT: 1.1,
        PASS_LONG: 1.05,
        DRIBBLE: 0.95
    },

    'Standard': {},

    'Lower': {
        PASS_SHORT: 0.95,
        DRIBBLE: 1.1,
        FIRST_TOUCH: 1.05
    },

    'Much Lower': {
        PASS_SHORT: 0.9,
        DRIBBLE: 1.2,
        FIRST_TOUCH: 1.1
    }
};

/**
 * Passing directness - short build-up vs direct play.
 */
export const DIRECTNESS_MODIFIERS: Record<string, TacticalModifiers> = {
    'Much More Direct': {
        PASS_LONG: 1.3,
        CROSS: 1.2,
        PASS_SHORT: 0.8,
        HEADER: 1.1 // More aerial play
    },

    'More Direct': {
        PASS_LONG: 1.15,
        CROSS: 1.1,
        PASS_SHORT: 0.9
    },

    'Standard': {},

    'Shorter': {
        PASS_SHORT: 1.1,
        PASS_LONG: 0.9,
        DRIBBLE: 1.05
    },

    'Much Shorter': {
        PASS_SHORT: 1.2,
        PASS_LONG: 0.8,
        DRIBBLE: 1.1,
        FIRST_TOUCH: 1.05
    }
};

/**
 * Pressing intensity - how aggressively team presses without ball.
 */
export const PRESSING_MODIFIERS: Record<string, TacticalModifiers> = {
    'Much Higher': {
        TACKLE: 1.4,
        INTERCEPT: 1.3,
        // Cost: faster stamina drain and more space behind
        STAMINA_DECAY: 1.5,
        SPACE_BEHIND: 1.3
    },

    'Higher': {
        TACKLE: 1.2,
        INTERCEPT: 1.15,
        STAMINA_DECAY: 1.25,
        SPACE_BEHIND: 1.15
    },

    'Standard': {},

    'Lower': {
        TACKLE: 0.9,
        INTERCEPT: 0.95,
        STAMINA_DECAY: 0.9
    },

    'Much Lower': {
        TACKLE: 0.8,
        INTERCEPT: 0.85,
        STAMINA_DECAY: 0.8
    }
};

/**
 * Defensive line height - affects offside trap and space.
 */
export const DEFENSIVE_LINE_MODIFIERS: Record<string, TacticalModifiers> = {
    'Much Higher': {
        INTERCEPT: 1.2,
        OFFSIDE_TRAP: 1.3,
        SPACE_BEHIND: 1.4 // High risk of through balls
    },

    'Higher': {
        INTERCEPT: 1.1,
        OFFSIDE_TRAP: 1.15,
        SPACE_BEHIND: 1.2
    },

    'Standard': {},

    'Deeper': {
        CLEARANCE: 1.1,
        OFFSIDE_TRAP: 0.8,
        SPACE_BEHIND: 0.8
    },

    'Much Deeper': {
        CLEARANCE: 1.2,
        HEADER: 1.1,
        OFFSIDE_TRAP: 0.6,
        SPACE_BEHIND: 0.6
    }
};

/**
 * Merge multiple tactical instruction sets into a single modifier map.
 * Later modifiers override earlier ones if keys conflict.
 */
export function mergeTacticalModifiers(
    ...modifierSets: TacticalModifiers[]
): TacticalModifiers {
    const merged: TacticalModifiers = {};

    for (const set of modifierSets) {
        for (const [action, modifier] of Object.entries(set)) {
            merged[action] = modifier;
        }
    }

    return merged;
}

/**
 * Get combined tactical modifiers from all team instructions.
 */
export function getTacticalModifiers(instructions: {
    mentality?: string;
    tempo?: string;
    directness?: string;
    pressing?: string;
    defensiveLine?: string;
}): TacticalModifiers {
    const modifierSets: TacticalModifiers[] = [];

    if (instructions.mentality) {
        modifierSets.push(MENTALITY_MODIFIERS[instructions.mentality] || {});
    }

    if (instructions.tempo) {
        modifierSets.push(TEMPO_MODIFIERS[instructions.tempo] || {});
    }

    if (instructions.directness) {
        modifierSets.push(DIRECTNESS_MODIFIERS[instructions.directness] || {});
    }

    if (instructions.pressing) {
        modifierSets.push(PRESSING_MODIFIERS[instructions.pressing] || {});
    }

    if (instructions.defensiveLine) {
        modifierSets.push(DEFENSIVE_LINE_MODIFIERS[instructions.defensiveLine] || {});
    }

    return mergeTacticalModifiers(...modifierSets);
}

/**
 * Get modifier for a specific action, defaulting to 1.0 if not set.
 */
export function getActionModifier(
    modifiers: TacticalModifiers,
    action: ActionType
): number {
    return modifiers[action] || 1.0;
}
