// Formation Parser - Convert formation strings to position grids
// Supports common FM2023 formations

import { Position } from './types';

export interface FormationGrid {
    formation: string;
    positions: Position[]; // 11 positions (GK + 10 outfield)
    lines: {
        goalkeeper: Position[];
        defense: Position[];
        midfield: Position[];
        attack: Position[];
    };
}

/**
 * Parse formation string (e.g., "4-3-3") into position grid.
 * Y-axis: 0 = own goal, 100 = opponent goal
 * X-axis: 0 = left touchline, 100 = right touchline
 */
export function parseFormation(formationString: string): FormationGrid {
    const parts = formationString.split('-').map(Number);

    // Validate formation
    if (parts.reduce((sum, n) => sum + n, 0) !== 10) {
        throw new Error(`Invalid formation: ${formationString}. Must have 10 outfield players.`);
    }

    const positions: Position[] = [];

    // Goalkeeper (always at center-bottom)
    positions.push({ x: 50, y: 5 });

    let currentY = 20; // Start defense at 20% from own goal
    const ySpacing = 25; // Space between lines

    // Process each line (defense, midfield, attack, etc.)
    for (const lineCount of parts) {
        const linePositions = generateLine(lineCount, currentY);
        positions.push(...linePositions);
        currentY += ySpacing;
    }

    return {
        formation: formationString,
        positions,
        lines: {
            goalkeeper: [positions[0]],
            defense: positions.slice(1, 1 + parts[0]),
            midfield: positions.slice(1 + parts[0], 1 + parts[0] + parts[1]),
            attack: positions.slice(1 + parts[0] + parts[1])
        }
    };
}

/**
 * Generate evenly-spaced positions for a line.
 */
function generateLine(playerCount: number, y: number): Position[] {
    const positions: Position[] = [];

    if (playerCount === 1) {
        // Single player in center
        positions.push({ x: 50, y });
    } else if (playerCount === 2) {
        // Two players
        positions.push({ x: 30, y }, { x: 70, y });
    } else if (playerCount === 3) {
        // Three players
        positions.push({ x: 20, y }, { x: 50, y }, { x: 80, y });
    } else if (playerCount === 4) {
        // Four players
        positions.push({ x: 15, y }, { x: 35, y }, { x: 65, y }, { x: 85, y });
    } else if (playerCount === 5) {
        // Five players
        positions.push({ x: 10, y }, { x: 30, y }, { x: 50, y }, { x: 70, y }, { x: 90, y });
    }

    return positions;
}

/**
 * Common FM2023 formations with their position grids.
 */
export const COMMON_FORMATIONS: Record<string, FormationGrid> = {
    '4-4-2': parseFormation('4-4-2'),
    '4-3-3': parseFormation('4-3-3'),
    '4-2-3-1': parseFormation('4-2-3-1'),
    '3-5-2': parseFormation('3-5-2'),
    '4-1-4-1': parseFormation('4-1-4-1'),
    '4-5-1': parseFormation('4-5-1'),
    '3-4-3': parseFormation('3-4-3'),
    '5-3-2': parseFormation('5-3-2'),
    '4-4-1-1': parseFormation('4-4-1-1'),
    '4-1-2-1-2': parseFormation('4-1-2-1-2')
};

/**
 * Get formation grid, either from common formations or by parsing.
 */
export function getFormation(formationString: string): FormationGrid {
    return COMMON_FORMATIONS[formationString] || parseFormation(formationString);
}

/**
 * Adjust formation positions based on tactical instructions.
 * E.g., High defensive line pushes defense up 10%
 */
export function adjustFormationPositions(
    formation: FormationGrid,
    adjustments: {
        defensiveLineHeight?: number; // -10 to +10
        width?: number; // -10 to +10
        attackDepth?: number; // -10 to +10
    }
): FormationGrid {
    const adjusted: Position[] = formation.positions.map((pos, index) => {
        let { x, y } = pos;

        // Defensive line adjustment
        if (adjustments.defensiveLineHeight && index > 0 && index <= formation.lines.defense.length) {
            y += adjustments.defensiveLineHeight;
        }

        // Width adjustment
        if (adjustments.width) {
            // Move players closer/farther from center
            const centerOffset = x - 50;
            x = 50 + centerOffset * (1 + adjustments.width / 100);
        }

        // Attack depth adjustment
        if (adjustments.attackDepth && index > formation.positions.length - formation.lines.attack.length) {
            y += adjustments.attackDepth;
        }

        return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    });

    return {
        ...formation,
        positions: adjusted
    };
}

/**
 * Find nearest player to a position (for player selection during events).
 */
export function findNearestPlayer(
    position: Position,
    playerPositions: Position[]
): number {
    let nearestIndex = 0;
    let minDistance = Infinity;

    playerPositions.forEach((playerPos, index) => {
        const distance = Math.sqrt(
            Math.pow(position.x - playerPos.x, 2) + Math.pow(position.y - playerPos.y, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = index;
        }
    });

    return nearestIndex;
}
