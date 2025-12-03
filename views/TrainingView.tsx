import React, { useState, useEffect } from 'react';
import { Player, Team } from '../types';
import { DEFAULT_SCHEDULES, TrainingSchedule, applyWeeklyTraining, Coach } from '../services/trainingEngine';
import { Dumbbell, TrendingUp, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';

interface Props {
    team: Team;
    onTrainingComplete?: () => void;
    onBack?: () => void;
}

export const TrainingView: React.FC<Props> = ({ team, onTrainingComplete, onBack }) => {
    const [selectedScheduleId, setSelectedScheduleId] = useState<string>('GENERAL');
    const [report, setReport] = useState<Record<string, number>>({}); // PlayerID -> Total Gain
    const [isProcessing, setIsProcessing] = useState(false);
    const [week, setWeek] = useState(1);

    // Mock Coach for MVP
    const assistantCoach: Coach = {
        id: '1',
        name: 'Assistant Manager',
        attributes: { coaching: 15, manManagement: 14, determination: 15 }
    };

    const handleRunTraining = () => {
        setIsProcessing(true);
        const schedule = DEFAULT_SCHEDULES[selectedScheduleId];
        const newReport: Record<string, number> = {};

        // Simulate delay
        setTimeout(() => {
            team.players.forEach(player => {
                // Safety check: ensure player has attributes structure
                if (!player.attributes || !player.attributes.technical || !player.attributes.mental || !player.attributes.physical) {
                    console.warn(`Player ${player.name} missing attributes structure, skipping training`);
                    return;
                }

                const delta = applyWeeklyTraining(player, schedule, assistantCoach);

                // Apply delta to player attributes (In a real app, this would be a DB update or State dispatch)
                // For MVP UI demo, we just sum the gains to show the report
                let totalGain = 0;
                Object.entries(delta).forEach(([attr, val]) => {
                    totalGain += val;
                    // Mutate player object for immediate UI feedback (Not ideal for Prod, ok for MVP)
                    // We need to find where the attribute lives (technical, mental, physical)
                    if (attr in player.attributes.technical) (player.attributes.technical as any)[attr] = ((player.attributes.technical as any)[attr] as number) + val;
                    else if (attr in player.attributes.mental) (player.attributes.mental as any)[attr] = ((player.attributes.mental as any)[attr] as number) + val;
                    else if (attr in player.attributes.physical) (player.attributes.physical as any)[attr] = ((player.attributes.physical as any)[attr] as number) + val;
                });

                newReport[player.id] = totalGain;
            });

            setReport(newReport);
            setIsProcessing(false);
            setWeek(w => w + 1);
            if (onTrainingComplete) onTrainingComplete();
        }, 1000);
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Dumbbell className="text-emerald-500" /> Training Ground
                    </h1>
                </div>
                <div className="text-slate-400 font-mono text-sm">Week {week}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Left: Schedule Selection */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar size={18} /> Schedule
                    </h2>

                    <div className="space-y-3 flex-1">
                        {Object.entries(DEFAULT_SCHEDULES).map(([key, schedule]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedScheduleId(key)}
                                className={`w-full text-left p-4 rounded-lg border transition-all ${selectedScheduleId === key
                                    ? 'bg-emerald-900/30 border-emerald-500 ring-1 ring-emerald-500'
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${selectedScheduleId === key ? 'text-emerald-400' : 'text-white'}`}>
                                        {schedule.name}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${schedule.intensity === 'high' ? 'bg-red-900 text-red-200' :
                                        schedule.intensity === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                                            'bg-green-900 text-green-200'
                                        }`}>
                                        {schedule.intensity}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400">
                                    Focus: {schedule.sessions.map(s => s.name).join(', ')}
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleRunTraining}
                        disabled={isProcessing}
                        className={`mt-6 w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 ${isProcessing ? 'bg-slate-700 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                    >
                        {isProcessing ? 'Training in Progress...' : 'Run Training Week'}
                        {!isProcessing && <ChevronRight size={18} />}
                    </button>
                </div>

                {/* Right: Report */}
                <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col overflow-hidden">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={18} /> Performance Report
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {Object.keys(report).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                                <Dumbbell size={48} className="mb-4" />
                                <p>Select a schedule and run training to see results</p>
                            </div>
                        ) : (
                            team.players
                                .sort((a, b) => (report[b.id] || 0) - (report[a.id] || 0))
                                .map(player => {
                                    const gain = report[player.id] || 0;
                                    return (
                                        <div key={player.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded border border-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                                    {player.position}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-200 text-sm">{player.name}</div>
                                                    <div className="text-xs text-slate-500">Age {player.age}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className={`font-mono font-bold ${gain > 0.05 ? 'text-emerald-400' : gain > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                        +{gain.toFixed(3)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 uppercase">Attr. Gain</div>
                                                </div>
                                                {gain > 0.08 && <TrendingUp size={16} className="text-emerald-500" />}
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
