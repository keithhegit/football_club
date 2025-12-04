// Attribute Combinations for Match Actions
// Based on FM2023 Match Engine mechanics from strategy guide

import { ActionType, AttributeFormula } from './types';

/**
 * Action formulas define how player attributes combine to determine
 * the base probability of success for each action type.
 * 
 * Formula: success_prob = Σ(attribute_value / 20 * weight)
 * Each action uses a weighted combination of primary, mental, technical, and physical attributes.
 */
export const ACTION_FORMULAS: Record<ActionType, AttributeFormula> = {
    PASS_SHORT: {
        primary: { Passing: 0.4 },
        mental: { Vision: 0.2, Decisions: 0.2 },
        technical: { Technique: 0.2 },
        physical: {}
    },

    PASS_LONG: {
        primary: { Passing: 0.3, Crossing: 0.2 },
        mental: { Vision: 0.2, Decisions: 0.1 },
        technical: { Technique: 0.2 },
        physical: {}
    },

    SHOOT: {
        primary: { Finishing: 0.15 },  // Reduced from 0.4 - shooting is hard!
        mental: { Composure: 0.10, Decisions: 0.05 },
        technical: { Technique: 0.05 },
        physical: {}
    },

    SHOOT_LONG: {
        primary: { LongShots: 0.12 },  // Reduced from 0.4 - long shots rarely score
        mental: { Composure: 0.08, Decisions: 0.05 },
        technical: { Technique: 0.05 },
        physical: { Balance: 0.05 }
    },

    TACKLE: {
        primary: { Tackling: 0.4 },
        mental: { Anticipation: 0.2, Decisions: 0.1, Aggression: 0.1 },
        technical: {},
        physical: { Strength: 0.1, Balance: 0.1 }
    },

    DRIBBLE: {
        primary: { Dribbling: 0.4 },
        mental: { Flair: 0.1, OffTheBall: 0.1 },
        technical: { Technique: 0.2 },
        physical: { Acceleration: 0.1, Agility: 0.05, Pace: 0.05 }
    },

    HEADER: {
        primary: { Heading: 0.5 },
        mental: { Anticipation: 0.1, Decisions: 0.1 },
        technical: {},
        physical: { JumpingReach: 0.2, Strength: 0.1 }
    },

    INTERCEPT: {
        primary: { Anticipation: 0.3, Positioning: 0.3 },
        mental: { Decisions: 0.2 },
        technical: { Tackling: 0.2 },
        physical: {}
    },

    CROSS: {
        primary: { Crossing: 0.5 },
        mental: { Vision: 0.2, Decisions: 0.1 },
        technical: { Technique: 0.2 },
        physical: {}
    },

    FIRST_TOUCH: {
        primary: { FirstTouch: 0.4 },
        mental: { Anticipation: 0.1, Decisions: 0.1, Flair: 0.1, Vision: 0.1 },
        technical: { Technique: 0.2 },
        physical: { Balance: 0.1 }
    },

    CLEARANCE: {
        primary: { Heading: 0.3, Tackling: 0.2 },
        mental: { Decisions: 0.2, Concentration: 0.1 },
        technical: {},
        physical: { Strength: 0.2 }
    }
};

/**
 * Calculate base success probability for an action based on player attributes.
 * 
 * @param action - The type of action being performed
 * @param attributes - Player's attribute set
 * @returns Base probability (0.0 - 1.0) before modifiers
 */
export function computeBaseScore(
    action: ActionType,
    attributes: Record<string, number>
): number {
    const formula = ACTION_FORMULAS[action];
    let score = 0;

    // Helper function to add weighted attributes
    const addWeightedAttributes = (attrGroup: { [key: string]: number }) => {
        for (const [attr, weight] of Object.entries(attrGroup)) {
            const attrValue = attributes[attr] || 0;
            score += (attrValue / 20) * weight;
        }
    };

    // Sum all attribute groups
    addWeightedAttributes(formula.primary);
    addWeightedAttributes(formula.mental);
    addWeightedAttributes(formula.technical);
    addWeightedAttributes(formula.physical);

    // Clamp to valid probability range
    return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Calculate defensive resistance score for an opponent.
 * This reduces the attacker's success probability.
 * 
 * @param action - The action being defended against
 * @param attributes - Defender's attribute set
 * @returns Defense score (0.0 - 1.0)
 */
export function computeDefenseScore(
    action: ActionType,
    attributes: Record<string, number>
): number {
    // Map actions to relevant defensive attributes
    const defenseFormulas: Record<ActionType, { [key: string]: number }> = {
        PASS_SHORT: { Marking: 0.15, Positioning: 0.15, Anticipation: 0.1, WorkRate: 0.1 },  // Halved - passes should succeed more
        PASS_LONG: { Positioning: 0.2, Anticipation: 0.15, JumpingReach: 0.15 },  // Halved
        SHOOT: { Positioning: 0.35, Anticipation: 0.25, Bravery: 0.15, JumpingReach: 0.1 },  // GK resistance
        SHOOT_LONG: { Positioning: 0.40, Anticipation: 0.25, JumpingReach: 0.15 },  // Slightly reduced
        TACKLE: { Strength: 0.3, Balance: 0.3, Dribbling: 0.2, Agility: 0.2 },
        DRIBBLE: { Tackling: 0.3, Marking: 0.2, Positioning: 0.2, Pace: 0.2, Strength: 0.1 },
        HEADER: { JumpingReach: 0.4, Marking: 0.3, Positioning: 0.2, Strength: 0.1 },
        INTERCEPT: { Pace: 0.2, Anticipation: 0.2, Positioning: 0.15, Passing: 0.15 },  // Reduced
        CROSS: { Positioning: 0.25, Anticipation: 0.2, JumpingReach: 0.2 },  // Reduced
        FIRST_TOUCH: { Marking: 0.25, Tackling: 0.2, Aggression: 0.2 },  // Reduced
        CLEARANCE: { Marking: 0.3, Tackling: 0.2, Positioning: 0.15 }  // Reduced
    };

    const formula = defenseFormulas[action];
    let score = 0;

    for (const [attr, weight] of Object.entries(formula)) {
        const attrValue = attributes[attr] || 0;
        score += (attrValue / 20) * weight;
    }

    // Defense reduces success, clamped to reasonable range (max 50% reduction)
    return Math.min(0.5, Math.max(0.0, score));  // Changed from 0.8 to 0.5
}
