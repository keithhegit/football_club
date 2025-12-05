// Match Statistics Tracker - Additional methods for card tracking

import { MatchStatsTracker as BaseTracker } from './matchStats';
import { CardType } from './types';

declare module './matchStats' {
    interface MatchStatsTracker {
        recordCard(teamSide: 'home' | 'away', cardType: CardType): void;
    }
}

/**
 * Record a yellow or red card
 */
BaseTracker.prototype.recordCard = function (teamSide: 'home' | 'away', cardType: CardType): void {
    const teamIndex = teamSide === 'home' ? 0 : 1;

    if (cardType === 'YELLOW') {
        this.getStats().yellowCards[teamIndex]++;
    } else if (cardType === 'RED') {
        this.getStats().redCards[teamIndex]++;
    }
};

export { };
