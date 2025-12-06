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
 * Target: ~10 fouls/90min with slower ticks -> base 0.6% per tick
 */
(MatchEngine.prototype as any).checkForFoul = function (actor: PlayerState, opponent: PlayerState | null): boolean {
    if (!opponent) return false; // No opponent = no foul

    // Base foul probability: ~0.6% per tick
    let foulChance = 0.006;

    const aggression = actor.attributes.Aggression || 10;
    foulChance *= Math.max(0.75, Math.min(1.6, aggression / 9));

    if ((this as any).state.phase === 'DEFEND') {
        foulChance *= 1.6;
    }

    return Math.random() < foulChance;
};

/**
 * Handle foul and determine if card should be given
 * Returns card type: YELLOW, RED, or NONE
 */
(MatchEngine.prototype as any).handleFoul = function (player: PlayerState): CardType {
    const aggression = player.attributes.Aggression || 10;
    const baseCardProb = Math.max(0.05, Math.min(0.35, 0.22 * (aggression / 12)));

    if (player.yellowCards >= 1 && Math.random() < baseCardProb * 0.5) {
        player.redCard = true;
        return 'RED';
    }

    if (aggression > 15 && Math.random() < 0.03) {
        player.redCard = true;
        return 'RED';
    }

    if (Math.random() < baseCardProb) {
        player.yellowCards++;
        return 'YELLOW';
    }

    return 'NONE';
};

export { };
