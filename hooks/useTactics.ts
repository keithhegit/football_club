import { useState, useEffect } from 'react';
import { Team, Player, Formation, PlayerPosition, Duty } from '../types';

// Default Formations
import { GUIDED_FORMATIONS, TEAM_TACTIC_PRESETS } from '../utils/tacticsPresets';

export function useTactics(initialTeam: Team | null) {
    const [currentFormationId, setCurrentFormationId] = useState<string>(initialTeam?.tactics?.formation || (() => {
        const key = (initialTeam?.name || '').toLowerCase();
        return TEAM_TACTIC_PRESETS[key]?.formation || '4-4-2';
    })());
    const [lineup, setLineup] = useState<{ positionId: string; playerId: string }[]>([]);

    // Initialize lineup when team loads
    useEffect(() => {
        if (initialTeam && initialTeam.players.length > 0) {
            const formation = GUIDED_FORMATIONS[currentFormationId] || GUIDED_FORMATIONS['4-4-2'];
            // If team has saved lineup, use it; else auto-pick by position / CA
            const saved = initialTeam.tactics?.lineup;
            const chooseByPosition = () => {
                const remaining = [...initialTeam.players];
                const pickBest = (targetId: string) => {
                    const target = targetId.toUpperCase();
                    let bestIdx = -1;
                    let bestScore = -1;
                    remaining.forEach((p, idx) => {
                        const pos = (p.position || '').toUpperCase();
                        let score = 0;
                        if (pos.includes(target)) score += 100;
                        // broad buckets
                        if (target === 'GK' && pos.includes('GK')) score += 50;
                        if (target.startsWith('D') && (pos.includes('D') || pos.includes('WB'))) score += 40;
                        if (target.startsWith('M') && (pos.includes('M') || pos.includes('DM') || pos.includes('AM'))) score += 40;
                        if (target.startsWith('A') || target === 'ST') {
                            if (pos.includes('ST') || pos.includes('AM')) score += 40;
                        }
                        score += p.ca || 0;
                        if (score > bestScore) {
                            bestScore = score;
                            bestIdx = idx;
                        }
                    });
                    if (bestIdx === -1) return '';
                    const chosen = remaining.splice(bestIdx, 1)[0];
                    return chosen?.id || '';
                };
                return formation.positions.map(pos => ({
                    positionId: pos.id,
                    playerId: pickBest(pos.id)
                })).filter(l => l.playerId);
            };

            const newLineup = (saved && saved.length > 0)
                ? saved.map(l => ({ positionId: l.positionId, playerId: l.playerId }))
                : chooseByPosition();

            setLineup(newLineup);
        }
    }, [initialTeam, currentFormationId]);

    const setFormation = (formationId: string) => {
        if (GUIDED_FORMATIONS[formationId]) {
            setCurrentFormationId(formationId);
        }
    };

    const updatePlayerPosition = (playerId: string, targetPositionId: string) => {
        setLineup(prev => {
            // Find if there is already a player at the target position
            const targetEntry = prev.find(l => l.positionId === targetPositionId);
            const sourceEntry = prev.find(l => l.playerId === playerId);

            // If dragging a player who is already on the pitch
            if (sourceEntry) {
                // If target is empty, just move
                if (!targetEntry) {
                    return prev.map(l => l.playerId === playerId ? { ...l, positionId: targetPositionId } : l);
                }
                // If target has a player, swap them
                return prev.map(l => {
                    if (l.playerId === playerId) return { ...l, positionId: targetPositionId };
                    if (l.positionId === targetPositionId) return { ...l, positionId: sourceEntry.positionId };
                    return l;
                });
            }

            // If dragging a player from bench (not in lineup)
            // If target has a player, replace them (move target player to bench)
            if (targetEntry) {
                return prev.map(l => l.positionId === targetPositionId ? { ...l, playerId } : l);
            }

            // If target is empty (shouldn't happen in standard formations but good to handle), add new entry
            return [...prev, { positionId: targetPositionId, playerId }];
        });
    };

    return {
        currentFormation: GUIDED_FORMATIONS[currentFormationId],
        availableFormations: Object.values(GUIDED_FORMATIONS),
        lineup,
        setFormation,
        updatePlayerPosition
    };
}
