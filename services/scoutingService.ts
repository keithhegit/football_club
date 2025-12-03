import { Player } from '../types';
import { PlayerAttributes } from '../types/attributes';

export interface ScoutReport {
    playerId: string;
    currentStars: number; // 0.5 - 5.0
    potentialStars: number; // 0.5 - 5.0
    strengths: string[];
    weaknesses: string[];
    recommendation: 'Sign' | 'Shortlist' | 'Pass';
    estimatedValue: number;
}

export function generateScoutReport(player: Player, scoutAbility: number = 15): ScoutReport {
    // 1. Estimate Ability (Scout error margin based on ability)
    // Scout ability 1-20. Error margin: (20 - ability) * 2 CA points
    const errorMargin = (20 - scoutAbility) * 2;
    const estimatedCA = player.ca + (Math.random() * errorMargin * 2 - errorMargin);
    const estimatedPA = player.pa + (Math.random() * errorMargin * 2 - errorMargin);

    const currentStars = calculateStars(estimatedCA);
    const potentialStars = calculateStars(estimatedPA);

    // 2. Identify Strengths & Weaknesses
    const { strengths, weaknesses } = analyzeAttributes(player.attributes);

    // 3. Recommendation
    let recommendation: 'Sign' | 'Shortlist' | 'Pass' = 'Pass';
    if (currentStars >= 4 || potentialStars >= 4.5) recommendation = 'Sign';
    else if (currentStars >= 3 || potentialStars >= 4) recommendation = 'Shortlist';

    return {
        playerId: player.id,
        currentStars,
        potentialStars,
        strengths,
        weaknesses,
        recommendation,
        estimatedValue: player.value * (0.9 + Math.random() * 0.2) // +/- 10% valuation
    };
}

function calculateStars(ca: number): number {
    // Simple mapping (same as PlayerProfileCard but returning number)
    if (ca >= 170) return 5;
    if (ca >= 150) return 4.5;
    if (ca >= 130) return 4;
    if (ca >= 110) return 3.5; // Adjusted slightly for granularity
    if (ca >= 90) return 3;
    if (ca >= 70) return 2;
    return 1;
}

function analyzeAttributes(attrs: { technical: any; mental: any; physical: any }) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const thresholdHigh = 15;
    const thresholdLow = 8;

    const check = (category: any, type: string) => {
        Object.entries(category).forEach(([key, val]) => {
            const value = val as number;
            const name = key.replace(/([A-Z])/g, ' $1').trim(); // camelCase to Title Case
            if (value >= thresholdHigh) strengths.push(`${name} (${value})`);
            if (value <= thresholdLow) weaknesses.push(`${name} (${value})`);
        });
    };

    check(attrs.technical, 'Technical');
    check(attrs.mental, 'Mental');
    check(attrs.physical, 'Physical');

    // Limit to top 3
    return {
        strengths: strengths.slice(0, 3),
        weaknesses: weaknesses.slice(0, 3)
    };
}
