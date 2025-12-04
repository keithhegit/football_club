import { PlayerAttributes } from '../types/attributes';

export interface ActionResult {
    success: boolean;
    quality: number; // 0-1, 1 being perfect
    events: string[]; // Potential follow-up events
}

export interface Modifiers {
    weather?: number; // 0.8 - 1.2
    fatigue?: number; // 0.5 - 1.0
    morale?: number; // 0.9 - 1.1
    homeAdvantage?: number; // 1.0 - 1.1
}

/**
 * Calculate the success probability of a pass
 */
export function calculatePassingSuccess(
    passer: PlayerAttributes,
    passType: 'short' | 'long' | 'through',
    opponent?: PlayerAttributes,
    modifiers: Modifiers = {}
): number {
    // Base probability formula:
    // Passing (40%) + Technique (20%) + Vision (20%) + Decisions (20%)
    let baseProb = (
        (passer.passing || 10) * 0.4 +
        (passer.technique || 10) * 0.2 +
        (passer.vision || 10) * 0.2 +
        (passer.decisions || 10) * 0.2
    ) / 20; // Normalize to 0-1

    // Pass type adjustments
    if (passType === 'long') {
        // Long passes rely more on Crossing and Technique
        const longPassFactor = ((passer.crossing || 10) * 0.3 + (passer.technique || 10) * 0.2) / 10; // 0.5 - 1.0 approx
        baseProb = baseProb * 0.7 + longPassFactor * 0.3;
    } else if (passType === 'through') {
        // Through balls rely heavily on Vision and Flair
        const throughFactor = ((passer.vision || 10) * 0.4 + (passer.flair || 10) * 0.3) / 14;
        baseProb = baseProb * 0.6 + throughFactor * 0.4;
    }

    // Opponent pressure
    if (opponent) {
        // Pressure based on Marking, Anticipation, and Positioning
        const pressure = (
            (opponent.marking || 10) * 0.4 +
            (opponent.anticipation || 10) * 0.3 +
            (opponent.positioning || 10) * 0.3
        ) / 20;

        // Pressure reduces success probability (e.g., 0.5 pressure -> 0.75 multiplier)
        baseProb *= (1 - pressure * 0.5);
    }

    // Apply external modifiers
    baseProb *= (modifiers.weather || 1.0);
    baseProb *= (modifiers.fatigue || 1.0);
    baseProb *= (modifiers.morale || 1.0);
    baseProb *= (modifiers.homeAdvantage || 1.0);

    return Math.max(0.05, Math.min(0.99, baseProb));
}

/**
 * Calculate the success probability of a shot
 */
export function calculateShotSuccess(
    shooter: PlayerAttributes,
    distance: 'close' | 'medium' | 'long',
    goalkeeper?: PlayerAttributes,
    modifiers: Modifiers = {}
): number {
    let baseProb = 0.1; // Base shot probability is generally lower than passing

    if (distance === 'close') {
        // Close range: Finishing (40%) + Composure (30%) + Technique (20%) + Decisions (10%)
        baseProb = (
            (shooter.finishing || 10) * 0.4 +
            (shooter.composure || 10) * 0.3 +
            (shooter.technique || 10) * 0.2 +
            (shooter.decisions || 10) * 0.1
        ) / 20;
    } else if (distance === 'medium') {
        // Medium range: Finishing (30%) + Long Shots (30%) + Technique (20%)
        baseProb = (
            (shooter.finishing || 10) * 0.3 +
            (shooter.long_shots || 10) * 0.3 +
            (shooter.technique || 10) * 0.2 +
            (shooter.decisions || 10) * 0.2
        ) / 25; // Slightly harder
    } else {
        // Long range: Long Shots (50%) + Technique (30%) + Strength (20%)
        baseProb = (
            (shooter.long_shots || 10) * 0.5 +
            (shooter.technique || 10) * 0.3 +
            (shooter.strength || 10) * 0.2
        ) / 30; // Much harder
    }

    // Goalkeeper factor
    if (goalkeeper) {
        // GK Save Ability: Reflexes (30%) + Positioning (30%) + Handling (20%) + One on Ones (20%)
        let gkAbility = (
            (goalkeeper.goalkeeper?.reflexes || 10) * 0.3 +
            (goalkeeper.positioning || 10) * 0.3 +
            (goalkeeper.goalkeeper?.handling || 10) * 0.2 +
            (goalkeeper.goalkeeper?.one_on_ones || 10) * 0.2
        ) / 20;

        // Distance affects GK ability (easier to save long shots)
        if (distance === 'long') gkAbility *= 1.2;
        if (distance === 'close') gkAbility *= 0.8;

        // GK reduces shot success
        // e.g., Shooter 0.8 vs GK 0.8 -> 0.8 * (1 - 0.8*0.8) = 0.28 goal prob
        baseProb *= (1 - Math.min(0.9, gkAbility * 0.8));
    } else {
        // Empty net / No GK logic (fallback)
        baseProb *= 0.9;
    }

    // Modifiers
    baseProb *= (modifiers.fatigue || 1.0);
    baseProb *= (modifiers.morale || 1.0);

    return Math.max(0.01, Math.min(0.95, baseProb));
}

/**
 * Calculate the success probability of a tackle
 */
export function calculateTackleSuccess(
    defender: PlayerAttributes,
    attacker: PlayerAttributes,
    tackleType: 'standing' | 'sliding',
    modifiers: Modifiers = {}
): number {
    // Defender Ability
    let defAbility = 0;
    if (tackleType === 'standing') {
        // Tackling (40%) + Positioning (30%) + Strength (20%) + Decisions (10%)
        defAbility = (
            (defender.tackling || 10) * 0.4 +
            (defender.positioning || 10) * 0.3 +
            (defender.strength || 10) * 0.2 +
            (defender.decisions || 10) * 0.1
        ) / 20;
    } else {
        // Sliding: Tackling (30%) + Bravery (30%) + Agility (20%) + Aggression (20%)
        defAbility = (
            (defender.tackling || 10) * 0.3 +
            (defender.bravery || 10) * 0.3 +
            (defender.agility || 10) * 0.2 +
            (defender.aggression || 10) * 0.2
        ) / 20;
    }

    // Attacker Evasion
    // Dribbling (40%) + Agility (30%) + Balance (20%) + Flair (10%)
    const attEvasion = (
        (attacker.dribbling || 10) * 0.4 +
        (attacker.agility || 10) * 0.3 +
        (attacker.balance || 10) * 0.2 +
        (attacker.flair || 10) * 0.1
    ) / 20;

    // Base success rate
    // If Def > Att, prob > 0.5
    let baseProb = 0.5 + (defAbility - attEvasion) * 0.5;

    // Sliding tackles are riskier (lower base success, higher reward/penalty)
    if (tackleType === 'sliding') baseProb -= 0.1;

    baseProb *= (modifiers.fatigue || 1.0);
    baseProb *= (modifiers.homeAdvantage || 1.0);

    return Math.max(0.1, Math.min(0.95, baseProb));
}

/**
 * Calculate the success probability of an interception
 */
export function calculateInterceptionSuccess(
    defender: PlayerAttributes,
    passQuality: number, // 0-1, quality of the pass being intercepted
    modifiers: Modifiers = {}
): number {
    // Interception: Anticipation (40%) + Positioning (30%) + Acceleration (20%) + Decisions (10%)
    const interceptionAbility = (
        (defender.anticipation || 10) * 0.4 +
        (defender.positioning || 10) * 0.3 +
        (defender.acceleration || 10) * 0.2 +
        (defender.decisions || 10) * 0.1
    ) / 20;

    // Harder to intercept high quality passes
    let baseProb = interceptionAbility * (1 - passQuality * 0.5);

    baseProb *= (modifiers.fatigue || 1.0);

    return Math.max(0.05, Math.min(0.9, baseProb));
}

/**
 * Calculate the success probability of a save (GK vs Shot)
 * Note: This is the inverse of Shot Success, but focused on GK perspective
 */
export function calculateSaveSuccess(
    goalkeeper: PlayerAttributes,
    shotQuality: number, // 0-1
    shotType: 'long' | 'close' | 'penalty',
    modifiers: Modifiers = {}
): number {
    let gkAbility = 0;

    if (shotType === 'close') {
        // Reflexes + One on Ones + Bravery
        gkAbility = (
            (goalkeeper.goalkeeper?.reflexes || 10) * 0.4 +
            (goalkeeper.goalkeeper?.one_on_ones || 10) * 0.3 +
            (goalkeeper.bravery || 10) * 0.3
        ) / 20;
    } else if (shotType === 'long') {
        // Positioning + Handling + Aerial Reach
        gkAbility = (
            (goalkeeper.positioning || 10) * 0.4 +
            (goalkeeper.goalkeeper?.handling || 10) * 0.3 +
            (goalkeeper.goalkeeper?.aerial_reach || 10) * 0.3
        ) / 20;
    } else {
        // Penalty
        gkAbility = (
            (goalkeeper.goalkeeper?.reflexes || 10) * 0.5 +
            (goalkeeper.anticipation || 10) * 0.3 +
            (goalkeeper.composure || 10) * 0.2
        ) / 20;
    }

    // Base save prob vs shot quality
    // If Shot Quality is 0.8, GK needs high ability to save
    let baseProb = gkAbility * (1.2 - shotQuality);

    baseProb *= (modifiers.fatigue || 1.0);
    baseProb *= (modifiers.morale || 1.0);

    return Math.max(0.05, Math.min(0.95, baseProb));
}
