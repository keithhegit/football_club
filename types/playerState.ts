export interface PlayerState {
    playerId: number;
    condition: number; // 0-100, Match Fitness/Stamina (100 = Fresh)
    sharpness: number; // 0-100, Match Sharpness (100 = Peak form)
    morale: number; // 0-100, Morale (50 = Neutral, 100 = Superb)
    form: number[]; // Array of last 5 match ratings (e.g., [7.5, 6.8, 8.0])
    fatigue: number; // 0-100, Accumulated fatigue (0 = None)
    injury?: {
        type: string;
        daysRemaining: number;
        severity: 'light' | 'medium' | 'severe';
    };
}

export interface StateModifiers {
    attributeModifier: number; // Multiplier for attributes (e.g., 0.9 for fatigue)
    decisionModifier: number; // Multiplier for mental attributes
    physicalModifier: number; // Multiplier for physical attributes
}

/**
 * Calculate modifiers based on player state
 */
export function getStateModifiers(state: PlayerState): StateModifiers {
    const mods: StateModifiers = {
        attributeModifier: 1.0,
        decisionModifier: 1.0,
        physicalModifier: 1.0
    };

    // Fatigue Impact
    // If condition drops below 70, attributes start to suffer
    if (state.condition < 70) {
        // Linear drop from 70 (1.0) to 0 (0.5)
        const fatigueFactor = 0.5 + (state.condition / 140);
        mods.physicalModifier *= fatigueFactor;
        mods.attributeModifier *= Math.max(0.8, fatigueFactor); // Technical skills suffer less than physical
    }

    // Accumulated Fatigue (Jadedness)
    if (state.fatigue > 50) {
        mods.attributeModifier *= 0.95;
        mods.physicalModifier *= 0.9;
    }

    // Morale Impact
    // Morale affects decisions and mental attributes
    // 50 is neutral. 100 adds 10% boost. 0 removes 10%.
    const moraleFactor = 1.0 + (state.morale - 50) / 500; // +/- 0.1
    mods.decisionModifier *= moraleFactor;

    // Sharpness Impact
    // Low sharpness affects technical execution
    if (state.sharpness < 80) {
        mods.attributeModifier *= 0.95;
    }

    // Injury Impact
    if (state.injury) {
        if (state.injury.severity === 'light') {
            mods.physicalModifier *= 0.8;
            mods.attributeModifier *= 0.9;
        } else {
            // Should not be playing usually
            mods.physicalModifier *= 0.5;
            mods.attributeModifier *= 0.5;
        }
    }

    return mods;
}

/**
 * Get average form from last 5 matches
 */
export function getAverageForm(state: PlayerState): number {
    if (!state.form || state.form.length === 0) return 6.8; // Default average
    const sum = state.form.reduce((a, b) => a + b, 0);
    return parseFloat((sum / state.form.length).toFixed(2));
}

/**
 * Create a default initial state for a player
 */
export function createInitialPlayerState(playerId: number): PlayerState {
    return {
        playerId,
        condition: 100,
        sharpness: 80, // Pre-season level
        morale: 50, // Okay
        form: [],
        fatigue: 0,
        injury: undefined
    };
}
