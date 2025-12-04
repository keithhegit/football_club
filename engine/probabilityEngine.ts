// Probability Engine - Core match action success calculator
// Combines attributes, tactics, condition, and opponent to determine action outcome

import { ActionType, PlayerState, TacticalModifiers, MatchConditions } from './types';
import { computeBaseScore, computeDefenseScore } from './attributeCombinations';
import { clamp } from './utils/mathHelpers';

/**
 * Calculate the final success probability for a match action.
 * 
 * Formula: P(success) = BaseScore × TacticalMod × ConditionMod × MoraleMod × (1 - DefenseScore)
 * 
 * @param action - Type of action being performed
 * @param actor - Player performing the action
 * @param opponent - Defending player (if applicable)
 * @param tacticalMods - Team tactical instruction modifiers
 * @param conditions - Match environmental conditions
 * @returns Probability of success (0.0 - 1.0)
 */
export function computeActionSuccess(
    action: ActionType,
    actor: PlayerState,
    opponent: PlayerState | null,
    tacticalMods: TacticalModifiers,
    conditions: MatchConditions
): number {
    // 1. Base probability from player attributes
    let probability = computeBaseScore(action, actor.attributes as any);

    // 2. Apply tactical modifiers
    const tacticMod = tacticalMods[action] || 1.0;
    probability *= tacticMod;

    // 3. Apply condition/stamina modifiers
    const conditionMod = getConditionModifier(actor.condition, actor.stamina);
    probability *= conditionMod;

    // 4. Apply morale modifier
    const moraleMod = getMoraleModifier(actor.morale);
    probability *= moraleMod;

    // 5. Apply form modifier
    const formMod = getFormModifier(actor.form);
    probability *= formMod;

    // 6. Reduce by opponent's defensive capability
    if (opponent) {
        const defenseScore = computeDefenseScore(action, opponent.attributes as any);
        probability *= (1 - defenseScore);
    }

    // 7. Apply weather/pitch conditions
    const environmentMod = getEnvironmentModifier(action, conditions);
    probability *= environmentMod;

    // Clamp final probability
    return clamp(probability, 0.0, 1.0);
}

/**
 * Calculate modifier based on player condition and stamina.
 * Stamina < 50% significantly reduces physical performance.
 */
function getConditionModifier(condition: number, stamina: number): number {
    // Base condition modifier (80-100% = 0.8-1.0)
    const condMod = 0.8 + (condition / 100) * 0.2;

    // Stamina penalty when low
    const staminaMod = stamina < 50 ? 0.8 : 1.0;

    return condMod * staminaMod;
}

/**
 * Calculate modifier based on player morale.
 * Affects mental attributes (Decisions, Composure, etc.)
 */
function getMoraleModifier(morale: number): number {
    // Morale range: 0-100, impact ±10%
    // 50 = 1.0, 100 = 1.1, 0 = 0.9
    return 1.0 + (morale - 50) / 500;
}

/**
 * Calculate modifier based on player form.
 * Form affects overall consistency.
 */
function getFormModifier(form: number): number {
    // Form range: 0-100, impact ±5%
    // 50 = 1.0, 100 = 1.05, 0 = 0.95
    return 1.0 + (form - 50) / 1000;
}

/**
 * Calculate environmental modifiers (weather, pitch quality).
 */
function getEnvironmentModifier(action: ActionType, conditions: MatchConditions): number {
    let modifier = 1.0;

    // Rain affects first touch and passing
    if (conditions.weather === 'rain') {
        if (action === 'FIRST_TOUCH') {
            modifier *= 0.8; // -20% first touch in rain
        } else if (action === 'PASS_SHORT' || action === 'PASS_LONG') {
            modifier *= 0.9; // -10% passing accuracy
        }
    }

    // Poor pitch affects dribbling and ball control
    if (conditions.pitch === 'poor') {
        if (action === 'DRIBBLE' || action === 'FIRST_TOUCH') {
            modifier *= 0.85;
        }
    }

    return modifier;
}

/**
 * Determine if an action succeeds based on probability and random roll.
 */
export function rollActionOutcome(probability: number): boolean {
    return Math.random() < probability;
}

/**
 * Calculate expected goal (xG) value for a shot.
 * Based on shot position and defensive pressure.
 * 
 * @param position - Shot position on pitch
 * @param defenderProximity - Distance to nearest defender (0-100)
 * @returns xG value (0.0 - 1.0)
 */
export function calculateXG(
    position: { x: number; y: number },
    defenderProximity: number
): number {
    // Distance from goal center (x = 50, y = 100)
    const distanceFromGoal = Math.sqrt(
        Math.pow(position.x - 50, 2) + Math.pow(position.y - 100, 2)
    );

    // Base xG decreases with distance
    let xg = Math.max(0, 1 - distanceFromGoal / 100);

    // Angle to goal affects xG
    const angleToGoal = Math.abs(position.x - 50);
    xg *= (1 - angleToGoal / 100);

    // Defender proximity reduces xG
    xg *= (defenderProximity / 100);

    // Inside box (y > 75) bonus
    if (position.y > 75) {
        xg *= 1.5;
    }

    // Close range (y > 90) high xG
    if (position.y > 90) {
        xg *= 2.0;
    }

    return clamp(xg, 0.0, 1.0);
}
