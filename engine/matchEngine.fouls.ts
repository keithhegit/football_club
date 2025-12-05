// Foul and Card System Extension for MatchEngine
// Adds foul detection and card handling methods

import { MatchEngine } from './matchEngine';
import { PlayerState, CardType } from './types';

declare module './matchEngine' {
    interface MatchEngine {
        checkForFoul(actor: PlayerState, opponent: PlayerState | null): boolean;
        handleFoul(player: PlayerState): CardType;
    }
}

/**
 * Check if a foul should be generated (8-18 fouls per match)
 * Target: ~10 fouls/90min = 1 every 9 min = ~2% per tick
 */
(MatchEngine.prototype as any).checkForFoul = function (actor: PlayerState, opponent: PlayerState | null): boolean {
    if (!opponent) return false; // No opponent = no foul

    // Base foul probability: 2% per tick
    let foulChance = 0.02;

    // Increase based on actor's Aggression (higher = more fouls)
    const aggression = actor.attributes.Aggression || 10;
    foulChance *= (aggression / 10); // 20 Aggression = 2x fouls, 5 = 0.5x

    // Increase in defensive phase (more tackles = more fouls)
    if ((this as any).state.phase === 'DEFEND') {
        foulChance *= 1.5;
    }

    return Math.random() < foulChance;
};

/**
 * Handle foul and determine if card should be given
 * Returns card type: YELLOW, RED, or NONE
 */
(MatchEngine.prototype as any).handleFoul = function (player: PlayerState): CardType {
    // Base card probability: ~20% of fouls get yellow
    const aggression = player.attributes.Aggression || 10;
    const cardProb = (aggression / 20) * 0.20; // 20 Aggression = 20% yellow chance

    // Already has yellow card? Check for second yellow (red)
    if (player.yellowCards >= 1 && Math.random() < cardProb * 0.4) {
        player.redCard = true;
        return 'RED';
    }

    // Check for yellow card
    if (Math.random() < cardProb) {
        player.yellowCards++;
        return 'YELLOW';
    }

    return 'NONE';
};

export { };
