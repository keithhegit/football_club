import React, { useState } from 'react';
import { Player } from '../types';
import { negotiateTransfer, TransferResponse } from '../services/transferService';
import { X, Check, DollarSign, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    player: Player;
    onClose: () => void;
    onTransferComplete?: (player: Player, fee: number) => void;
}

export const TransferOfferModal: React.FC<Props> = ({ player, onClose, onTransferComplete }) => {
    const { t } = useTranslation();
    const playerValue = player.value || (player.ca * 50000); // Fallback: CA * 50k
    const [offerAmount, setOfferAmount] = useState(playerValue);
    const [wageAmount, setWageAmount] = useState(player.ca * 800); // Default guess
    const [response, setResponse] = useState<TransferResponse | null>(null);

    const handleOffer = () => {
        const result = negotiateTransfer(player, {
            playerId: player.id,
            amount: offerAmount,
            wage: wageAmount
        });
        setResponse(result);

        // If accepted, trigger the transfer callback
        if (result.accepted && onTransferComplete) {
            onTransferComplete(player, offerAmount);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Briefcase className="text-emerald-500" size={20} />
                        {t('transfer.title')}
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
                            <div className="text-sm text-slate-400">{t('transfer.marketValue')}: £{playerValue.toLocaleString()}</div>
                            );
};
