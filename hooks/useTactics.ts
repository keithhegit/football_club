import { useState, useEffect } from 'react';
import { Team, Player, Formation, PlayerPosition, Duty } from '../types';

// Default Formations
import { GUIDED_FORMATIONS } from '../utils/tacticsPresets';

export function useTactics(initialTeam: Team | null) {
    const [currentFormationId, setCurrentFormationId] = useState<string>(initialTeam?.tactics?.formation || '4-4-2');
    const [lineup, setLineup] = useState<{ positionId: string; playerId: string }[]>([]);

    // Initialize lineup when team loads
    useEffect(() => {
        if (initialTeam && initialTeam.players.length > 0) {
            const formation = GUIDED_FORMATIONS[currentFormationId] || GUIDED_FORMATIONS['4-4-2'];
            // If team has saved lineup, use it; else auto-pick first 11
            const saved = initialTeam.tactics?.lineup;
            const newLineup = (saved && saved.length > 0)
                ? saved.map(l => ({ positionId: l.positionId, playerId: l.playerId }))
                : formation.positions.map((pos, index) => ({
                    positionId: pos.id,
                    playerId: initialTeam.players[index]?.id || ''
                })).filter(l => l.playerId !== '');

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
