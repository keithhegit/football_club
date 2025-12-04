/**
 * Player Growth Service
 * Calculates CA changes per season based on FM mechanics
 */

interface SeasonStats {
    matches: number;      // Matches played this season
    goals: number;
    assists: number;
    injuries: number;     // Injuries sustained
}

interface TeamFactors {
    trainingFacilityLevel: number;  // 1-10 scale
    coachLevel: number;              // 1-20 scale
}

interface GrowthResult {
    caChange: number;
    caNew: number;
    factors: {
        baseGrowth: number;
        matchBonus: number;
        trainingBonus: number;
        injuryPenalty: number;
    };
}

/**
 * Calculate CA growth for a single season
 * @param player Player data including ca, pa, age
 * @param seasonStats Player's performance this season
 * @param teamFactors Team-level growth factors
 * @returns Growth calculation result
 */
export function calculateSeasonCAGrowth(
    player: {
        ca: number;
        pa: number;
        age: number;
        initialCA: number;
    },
    seasonStats: SeasonStats,
    teamFactors: TeamFactors
): GrowthResult {
    const { ca, pa, age, initialCA } = player;

    // 1. Base growth rate (age curve)
    const baseGrowth = getAgeGrowthRate(age);

    // 2. PA gap multiplier (closer to PA = slower growth)
    const paGap = pa - ca;
    const gapMultiplier = paGap > 0
        ? Math.min(1.5, Math.max(0.3, paGap / 50))  // 0.3x to 1.5x
        : 0;  // No growth if CA >= PA

    // 3. Match experience bonus
    const matchBonus = calculateMatchBonus(seasonStats.matches);

    // 4. Training quality bonus
    const trainingBonus = calculateTrainingBonus(teamFactors);

    // 5. Injury penalty
    const injuryPenalty = seasonStats.injuries * -2;

    // Calculate total change
    let totalChange = Math.round(
        baseGrowth * gapMultiplier +
        matchBonus +
        trainingBonus +
        injuryPenalty
    );

    // Apply limits
    let newCA = ca + totalChange;

    // CA cannot exceed PA
    newCA = Math.min(pa, newCA);

    // CA cannot drop below 80% of initial value
    const minCA = Math.floor(initialCA * 0.8);
    newCA = Math.max(minCA, newCA);

    return {
        caChange: newCA - ca,
        caNew: newCA,
        factors: {
            baseGrowth: Math.round(baseGrowth * gapMultiplier * 10) / 10,
            matchBonus,
            trainingBonus,
            injuryPenalty
        }
    };
}

/**
 * Age-based growth rate (FM-style curve)
 */
function getAgeGrowthRate(age: number): number {
    if (age <= 18) return 10;   // Rapid youth development
    if (age <= 21) return 7;    // Strong growth
    if (age <= 24) return 4;    // Steady improvement
    if (age <= 27) return 1;    // Peak maintenance
    if (age <= 30) return 0;    // Stable peak
    if (age <= 33) return -1.5; // Gradual decline
    return -3;                  // Sharp decline
}

/**
 * Calculate bonus from match experience
 * More matches = better growth
 */
function calculateMatchBonus(matches: number): number {
    // Full season = 38 matches in EPL
    // Playing full season gives max +5 CA
    // Playing 19 matches (half) gives +2.5 CA
    return Math.min(5, (matches / 38) * 5);
}

/**
 * Calculate bonus from training facilities
 */
function calculateTrainingBonus(factors: TeamFactors): number {
    const facilityBonus = (factors.trainingFacilityLevel - 5) / 2.5; // -2 to +2
    const coachBonus = (factors.coachLevel - 10) / 10; // -1 to +1
    return Math.round((facilityBonus + coachBonus) * 10) / 10;
}

/**
 * Batch calculate growth for entire squad
 */
export function calculateSquadGrowth(
    players: Array<{
        id: string;
        name: string;
        ca: number;
        pa: number;
        age: number;
        initialCA: number;
        seasonStats: SeasonStats;
    }>,
    teamFactors: TeamFactors
) {
    return players.map(player => {
        const growth = calculateSeasonCAGrowth(player, player.seasonStats, teamFactors);
        return {
            playerId: player.id,
            name: player.name,
            ageOld: player.age,
            ageNew: player.age + 1,
            caOld: player.ca,
            caNew: growth.caNew,
            caChange: growth.caChange,
            factors: growth.factors
        };
    });
}
