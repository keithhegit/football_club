import React, { useState } from 'react';
import { Player } from '../types';
import { negotiateTransfer, TransferResponse } from '../services/transferService';
import { getWindowStatus } from '../services/transferWindow';
import { X, Check, DollarSign, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContractConfirmation } from './ContractConfirmation';

interface Props {
    player: Player;
    leagueName?: string;
    teamBudget?: {
        balance?: number;
        transferBudget?: number;
        wageBudget?: number;
        wageSpending?: number;
    };
    onClose: () => void;
    onTransferComplete?: (player: Player, fee: number, wage: number) => void;
}

export const TransferOfferModal: React.FC<Props> = ({ player, leagueName, teamBudget, onClose, onTransferComplete }) => {
    const { t } = useTranslation();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const playerValue = player.value || (player.ca * 50000); // Fallback: CA * 50k
    const [offerAmount, setOfferAmount] = useState(playerValue);
    const [wageAmount, setWageAmount] = useState(player.ca * 800); // Default guess
    const [response, setResponse] = useState<TransferResponse | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const windowStatus = getWindowStatus(leagueName || (player as any)?.league, todayStr);
    const windowOpen = windowStatus.isOpen;
    const windowMessage = windowStatus.isOpen ? undefined : (windowStatus.message || '当前不在转会窗口开放期');
    const wageEnough = (teamBudget?.wageBudget ?? Number.MAX_SAFE_INTEGER) >= ((teamBudget?.wageSpending ?? 0) + wageAmount);
    const budgetMessage = (() => {
        if ((teamBudget?.transferBudget ?? Number.MAX_SAFE_INTEGER) < offerAmount) return '转会预算不足';
        if (!wageEnough) return '工资预算不足';
        return undefined;
    })();

    const handleOffer = () => {
        if (!windowOpen) {
            setResponse({
                accepted: false,
                message: windowMessage || '转会窗口未开放，无法提交报价。'
            });
            return;
        }

        if (budgetMessage) {
            setResponse({
                accepted: false,
                message: budgetMessage
            });
            return;
        }

        const result = negotiateTransfer(player, {
            playerId: player.id,
            amount: offerAmount,
            wage: wageAmount,
            transferBudget: teamBudget?.transferBudget,
            wageBudget: teamBudget?.wageBudget,
            wageSpending: teamBudget?.wageSpending,
            windowOpen,
            windowMessage,
            budgetMessage,
        });
        setResponse(result);

        // If accepted, show confirmation screen instead of immediate transfer
        if (result.accepted) {
            setShowConfirmation(true);
        }
    };

    const handleConfirmTransfer = () => {
        if (onTransferComplete) {
            onTransferComplete(player, offerAmount, wageAmount);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Briefcase className="text-emerald-500" size={20} />
                        Transfer Negotiation
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400 border border-slate-700">
                            {player.position}
                        </div>
                        <div>
                            <div className="font-bold text-xl text-white">{player.name}</div>
                            <div className="text-sm text-slate-400">Market Value: £{playerValue.toLocaleString()}</div>
                        </div>
                    </div>

                    {!response || !response.accepted ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Transfer Fee (£)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 text-slate-500" size={16} />
                                    <input
                                        type="number"
                                        value={offerAmount}
                                        onChange={(e) => setOfferAmount(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weekly Wage (£)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 text-slate-500" size={16} />
                                    <input
                                        type="number"
                                        value={wageAmount}
                                        onChange={(e) => setWageAmount(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="text-xs text-slate-400 space-y-1">
                                <div>{windowStatus.countdown || windowMessage || '窗口状态未知'}</div>
                                <div>联赛：{leagueName || (player as any)?.league || 'Premier League'}</div>
                            </div>

                            {response && !response.accepted && (
                                <div className="bg-red-900/20 border border-red-800/50 p-3 rounded-lg text-red-200 text-sm flex items-start gap-2">
                                    <X size={16} className="mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-bold">Offer Rejected</div>
                                        <div>{response.message}</div>
                                        {response.counterOffer && (
                                            <div className="mt-1 text-xs opacity-80">
                                                Counter: Fee £{response.counterOffer.amount.toLocaleString()}, Wage £{response.counterOffer.wage.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleOffer}
                                disabled={!windowOpen || !!budgetMessage}
                                className={`w-full font-bold py-3 rounded-lg shadow-lg transition-all mt-2 ${(!windowOpen || budgetMessage) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                            >
                                {(!windowOpen || budgetMessage) ? (budgetMessage || windowMessage || '窗口未开放') : 'Submit Offer'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/50">
                                <Check size={32} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Deal Done!</h3>
                                <p className="text-slate-400 text-sm">{response.message}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Contract Confirmation Modal */}
            {showConfirmation && (
                <ContractConfirmation
                    player={player}
                    transferFee={offerAmount}
                    weeklyWage={wageAmount}
                    onConfirm={handleConfirmTransfer}
                    onCancel={() => setShowConfirmation(false)}
                />
            )}
        </div>
    );
};
