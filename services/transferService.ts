import { Player } from '../types';

export interface TransferOffer {
    playerId: string;
    amount: number;
    wage: number;
}

export interface TransferResponse {
    accepted: boolean;
    message: string;
    counterOffer?: {
        amount: number;
        wage: number;
    };
}

export function negotiateTransfer(player: Player, offer: TransferOffer): TransferResponse {
    // 1. Calculate Minimum Acceptable Fee
    // Base value * multiplier based on age and potential
    let minFee = player.value;

    // Young high potential players cost more
    if (player.age < 23 && player.pa > 150) {
        minFee *= 1.5;
    } else if (player.age > 30) {
        minFee *= 0.8;
    }

    // Random variance (club willingness to sell)
    minFee *= (0.9 + Math.random() * 0.3); // 0.9 - 1.2

    // 2. Calculate Minimum Wage
    // Simple heuristic: CA * 1000
    let minWage = player.ca * 1000;
    if (player.age < 21) minWage *= 0.5; // Youngsters accept less

    // 3. Evaluate Offer
    const feeAcceptable = offer.amount >= minFee;
    const wageAcceptable = offer.wage >= minWage;

    if (feeAcceptable && wageAcceptable) {
        return {
            accepted: true,
            message: "The club and player have accepted your offer!"
        };
    } else if (!feeAcceptable) {
        return {
            accepted: false,
            message: "The transfer fee is too low. The club demands more.",
            counterOffer: {
                amount: Math.round(minFee * 1.1), // Ask for 10% more than min
                wage: offer.wage
            }
        };
    } else {
        return {
            accepted: false,
            message: "The player is insulted by the wage offer.",
            counterOffer: {
                amount: offer.amount,
                wage: Math.round(minWage * 1.1)
            }
        };
    }
}
