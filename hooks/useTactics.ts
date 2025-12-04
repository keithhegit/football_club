import { useState, useEffect } from 'react';
import { Team, Player, Formation, PlayerPosition, Duty } from '../types';

// Default Formations
const FORMATIONS: Record<string, Formation> = {
    '4-4-2': {
        id: '4-4-2',
        name: '4-4-2 Standard',
        positions: [
            { id: 'GK', name: 'GK', x: 50, y: 90 },
            { id: 'DR', name: 'DR', x: 90, y: 75 },
            { id: 'DCR', name: 'DCR', x: 65, y: 75 },
            { id: 'DCL', name: 'DCL', x: 35, y: 75 },
            { id: 'DL', name: 'DL', x: 10, y: 75 },
            { id: 'MR', name: 'MR', x: 90, y: 45 },
            { id: 'MCR', name: 'MCR', x: 65, y: 45 },
            { id: 'MCL', name: 'MCL', x: 35, y: 45 },
            { id: 'ML', name: 'ML', x: 10, y: 45 },
            { id: 'STR', name: 'ST', x: 65, y: 15 },
            { id: 'STL', name: 'ST', x: 35, y: 15 },
        ]
    },
    '4-3-3': {
        id: '4-3-3',
        name: '4-3-3 DM Wide',
        positions: [
            { id: 'GK', name: 'GK', x: 50, y: 90 },
            { id: 'DR', name: 'DR', x: 90, y: 75 },
            { id: 'DCR', name: 'DCR', x: 65, y: 75 },
            { id: 'DCL', name: 'DCL', x: 35, y: 75 },
            { id: 'DL', name: 'DL', x: 10, y: 75 },
            { id: 'DM', name: 'DM', x: 50, y: 60 },
            { id: 'MCR', name: 'MC', x: 65, y: 45 },
            { id: 'MCL', name: 'MC', x: 35, y: 45 },
            { id: 'AMR', name: 'AMR', x: 90, y: 25 },
            { id: 'AML', name: 'AML', x: 10, y: 25 },
            { id: 'ST', name: 'ST', x: 50, y: 15 },
        ]
    },
    '4-2-3-1': {
        id: '4-2-3-1',
        name: '4-2-3-1 Wide',
        positions: [
            { id: 'GK', name: 'GK', x: 50, y: 90 },
            { id: 'DR', name: 'DR', x: 90, y: 75 },
            { id: 'DCR', name: 'DCR', x: 65, y: 75 },
            { id: 'DCL', name: 'DCL', x: 35, y: 75 },
            { id: 'DL', name: 'DL', x: 10, y: 75 },
            { id: 'MCR', name: 'MC', x: 60, y: 60 },
            { id: 'MCL', name: 'MC', x: 40, y: 60 },
            { id: 'AMR', name: 'AMR', x: 90, y: 30 },
            { id: 'AMC', name: 'AMC', x: 50, y: 30 },
            { id: 'AML', name: 'AML', x: 10, y: 30 },
            { id: 'ST', name: 'ST', x: 50, y: 15 },
        ]
    }
};

export function useTactics(initialTeam: Team | null) {
    const [currentFormationId, setCurrentFormationId] = useState<string>('4-4-2');
    const [lineup, setLineup] = useState<{ positionId: string; playerId: string }[]>([]);

    // Initialize lineup when team loads
    useEffect(() => {
        if (initialTeam && initialTeam.players.length > 0) {
            // Auto-pick first 11 players for now
            const formation = FORMATIONS[currentFormationId];
            const newLineup = formation.positions.map((pos, index) => ({
                positionId: pos.id,
                playerId: initialTeam.players[index]?.id || ''
            })).filter(l => l.playerId !== '');

            setLineup(newLineup);
        }
    }, [initialTeam, currentFormationId]);

    const setFormation = (formationId: string) => {
        if (FORMATIONS[formationId]) {
            setCurrentFormationId(formationId);
            // Logic to remap players to new positions could go here
            // For now, we just keep the players in index order or reset
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
        currentFormation: FORMATIONS[currentFormationId],
        availableFormations: Object.values(FORMATIONS),
        lineup,
        setFormation,
        updatePlayerPosition
    };
}
