import { PlayerAttributes, PlayerAbility, AttributeDelta } from '../types/attributes';

/**
 * Position-specific attribute weights for CA calculation
 * Based on FM Scout research and FM2023 game mechanics
 */
export const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
    GK: {
        // Goalkeeper - GK attributes heavily weighted
        aerial_reach: 10,
        command_of_area: 9,
        communication: 7,
        handling: 10,
        kicking: 6,
        one_on_ones: 9,
        reflexes: 10,
        rushing_out: 7,
        tendency_to_punch: 5,
        throwing: 6,
        anticipation: 7,
        concentration: 8,
        decisions: 7,
        positioning: 9,
        agility: 7,
        pace: 3,
    },
    DC: {
        // Central Defender
        heading: 8,
        marking: 9,
        tackling: 9,
        positioning: 8,
        anticipation: 7,
        bravery: 7,
        concentration: 7,
        decisions: 6,
        jumping_reach: 7,
        pace: 5,
        strength: 8,
        aggression: 5,
    },
    ST: {
        // Striker
        finishing: 10,
        first_touch: 7,
        heading: 6,
        technique: 6,
        composure: 7,
        off_the_ball: 9,
        anticipation: 7,
        decisions: 6,
        acceleration: 6,
        pace: 7,
        strength: 5,
        balance: 5,
    },
    MC: {
        // Central Midfielder
        passing: 9,
        technique: 7,
        first_touch: 7,
        vision: 8,
        decisions: 7,
        teamwork: 7,
        work_rate: 7,
        stamina: 6,
        anticipation: 6,
        positioning: 6,
    },
    AMC: {
        // Attacking Midfielder
        passing: 8,
        technique: 8,
        dribbling: 7,
        first_touch: 7,
        vision: 9,
        flair: 7,
        off_the_ball: 7,
        decisions: 7,
        agility: 6,
    },
    DM: {
        // Defensive Midfielder
        tackling: 8,
        marking: 7,
        passing: 7,
        positioning: 8,
        anticipation: 7,
        decisions: 7,
        teamwork: 7,
        stamina: 6,
        work_rate: 7,
    },
    // ... Add more positions as needed
};

/**
 * Calculate Current Ability (CA) from player attributes
 * CA = Σ(position_weight * attribute_value)
 * @returns CA value (1-200)
 */
export function calculateCA(
    attributes: Partial<PlayerAttributes>,
    position: string
): number {
    const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS['MC'];
    let totalCA = 0;
    let totalWeight = 0;

    for (const [attrName, weight] of Object.entries(weights)) {
        const attrValue = (attributes as any)[attrName] || 0;
        totalCA += attrValue * weight;
        totalWeight += weight;
    }

    // Normalize to 1-200 range
    const ca = Math.round((totalCA / totalWeight) * 10);
    return Math.min(200, Math.max(1, ca));
}

/**
 * Calculate Recommended CA (RCA) - minimum CA needed to maintain current attributes
 */
export function calculateRCA(
    attributes: Partial<PlayerAttributes>,
    position: string
): number {
    // RCA is typically same as CA for balanced attributes
    return calculateCA(attributes, position);
}

/**
 * Distribute CA points to attributes based on position
 * Used for generating new players or rebalancing
 */
export function distributeCAToAttributes(
    targetCA: number,
    position: string,
    preferences?: Partial<PlayerAttributes>
): Partial<PlayerAttributes> {
    const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS['MC'];
    const attributes: any = {};

    // Calculate total weight
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

    // Distribute CA proportionally to weights
    for (const [attrName, weight] of Object.entries(weights)) {
        const baseValue = preferences?.[attrName as keyof PlayerAttributes] ||
            Math.round((targetCA / 10) * (weight / totalWeight));

        // Add some randomness (-2 to +2)
        const randomVariance = Math.floor(Math.random() * 5) - 2;
        attributes[attrName] = Math.min(20, Math.max(1, baseValue + randomVariance));
    }

    // Fill in non-weighted attributes with defaults
    const defaultValue = Math.max(1, Math.round(targetCA / 20));
    const allAttributes = [
        'corners', 'crossing', 'dribbling', 'finishing', 'first_touch',
        'aggression', 'anticipation', 'bravery', 'composure', 'decisions',
        'acceleration', 'agility', 'pace', 'stamina', 'strength'
    ];

    for (const attr of allAttributes) {
        if (!attributes[attr]) {
            attributes[attr] = Math.min(20, Math.max(1, defaultValue + Math.floor(Math.random() * 3) - 1));
        }
    }

    return attributes;
}

/**
 * Check if player can grow from current CA to potential PA
 * Based on age and growth curves
 */
export function canGrowToPA(
    currentCA: number,
    potentialPA: number,
    age: number
): boolean {
    if (potentialPA <= currentCA) return false;

    // Growth potential by age brackets
    if (age < 21) return true; // High growth potential
    if (age < 24) return currentCA < potentialPA * 0.95; // Can still grow to 95% of PA
    if (age < 27) return currentCA < potentialPA * 0.90; // Slower growth
    if (age < 30) return currentCA < potentialPA * 0.85; // Minimal growth

    return false; // 30+ no growth, only decline
}

/**
 * Calculate monthly CA growth delta
 * @returns CA change per month (can be negative for older players)
 */
export function calculateMonthlyGrowth(
    player: { ca: number; pa: number; age: number; determination: number }
): number {
    if (!canGrowToPA(player.ca, player.pa, player.age)) {
        // Check for decline
        if (player.age >= 30) {
            return -0.2 * (player.age - 29); // Faster decline with age
        }
        return 0;
    }

    // Growth rate based on age and determination
    let baseGrowth = 0;
    if (player.age < 21) baseGrowth = 2.0; // 2 CA per month
    else if (player.age < 24) baseGrowth = 1.0;
    else if (player.age < 27) baseGrowth = 0.5;
    else baseGrowth = 0.2;

    // Determination modifier (1-20 scale)
    const determinationMod = player.determination / 20;

    // Distance to PA modifier (slower as approaching PA)
    const gap = player.pa - player.ca;
    const gapMod = Math.min(1.0, gap / 20);

    return baseGrowth * determinationMod * gapMod;
}

/**
 * Generate random PA based on CA for new players
 * PA can be fixed or a range
 */
export function generatePA(currentCA: number, age: number): number {
    if (age < 23) {
        // Young players: PA higher than CA with variance
        const variance = Math.floor(Math.random() * 40) - 10; // -10 to +30
        return Math.min(200, Math.max(currentCA, currentCA + variance + 20));
    } else {
        // Older players: PA close to CA
        const variance = Math.floor(Math.random() * 20) - 10;
        return Math.min(200, Math.max(currentCA, currentCA + variance));
    }
}
