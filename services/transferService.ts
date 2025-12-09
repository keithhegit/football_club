import { Player } from '../types';

export interface TransferOffer {
    playerId: string;
    amount: number;      // transfer fee (one-off)
    wage: number;        // weekly wage offer
    clubBalance?: number;
    transferBudget?: number;
    wageBudget?: number;
    wageSpending?: number;
    windowOpen?: boolean;
    windowMessage?: string;
    budgetMessage?: string;
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
    // 0. Window / budget checks
    if (offer.windowOpen === false) {
        return {
            accepted: false,
            message: offer.windowMessage || '转会窗口未开放，无法提交报价。'
        };
    }

    if (offer.transferBudget !== undefined && offer.amount > (offer.transferBudget || 0)) {
        return {
            accepted: false,
            message: '转会预算不足，无法满足报价金额。'
        };
    }

    if (offer.wageBudget !== undefined && offer.wageSpending !== undefined) {
        const projected = offer.wageSpending + offer.wage;
        if (projected > offer.wageBudget) {
            return {
                accepted: false,
                message: '工资预算不足，无法满足薪资要求。'
            };
        }
    }

    // 1. Calculate Minimum Acceptable Fee
    // Base value * multiplier based on age and potential
    let minFee = player.value || (player.ca * 50000); // Fallback calculation

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
