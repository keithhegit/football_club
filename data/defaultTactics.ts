import { Position } from '../types';

export interface DefaultLineup {
    clubId: number;
    clubName: string;
    formation: string;
    lineup: {
        positionId: string;
        preferredPosition: Position;
    }[];
}

// Default formations and lineup positions for all 40 clubs
// Based on FM23 data and common formations
export const DEFAULT_CLUB_TACTICS: Record<number, DefaultLineup> = {
    // Premier League (league_id: 1)
    1: { // Arsenal
        clubId: 1,
        clubName: 'Arsenal',
        formation: '4-3-3',
        lineup: [
            { positionId: 'gk', preferredPosition: Position.GK },
            { positionId: 'lb', preferredPosition: Position.DEF },
            { positionId: 'dcl', preferredPosition: Position.DEF },
            { positionId: 'dcr', preferredPosition: Position.DEF },
            { positionId: 'rb', preferredPosition: Position.DEF },
            { positionId: 'dmc', preferredPosition: Position.MID },
            { positionId: 'mcl', preferredPosition: Position.MID },
            { positionId: 'mcr', preferredPosition: Position.MID },
            { positionId: 'aml', preferredPosition: Position.FWD },
            { positionId: 'amr', preferredPosition: Position.FWD },
            { positionId: 'st', preferredPosition: Position.FWD }
        ]
    },
    // Add all other clubs with their preferred formations
    // For now, using 4-3-3 as default for all clubs
};

// Generate default lineup based on formation
export function generateDefaultLineup(formation: string): { positionId: string; preferredPosition: Position }[] {
    const formationPatterns: Record<string, typeof DEFAULT_CLUB_TACTICS[1]['lineup']> = {
        '4-3-3': [
            { positionId: 'gk', preferredPosition: Position.GK },
            { positionId: 'lb', preferredPosition: Position.DEF },
            { positionId: 'dcl', preferredPosition: Position.DEF },
            { positionId: 'dcr', preferredPosition: Position.DEF },
            { positionId: 'rb', preferredPosition: Position.DEF },
            { positionId: 'dmc', preferredPosition: Position.MID },
            { positionId: 'mcl', preferredPosition: Position.MID },
            { positionId: 'mcr', preferredPosition: Position.MID },
            { positionId: 'aml', preferredPosition: Position.FWD },
            { positionId: 'amr', preferredPosition: Position.FWD },
            { positionId: 'st', preferredPosition: Position.FWD }
        ],
        '4-4-2': [
            { positionId: 'gk', preferredPosition: Position.GK },
            { positionId: 'lb', preferredPosition: Position.DEF },
            { positionId: 'dcl', preferredPosition: Position.DEF },
            { positionId: 'dcr', preferredPosition: Position.DEF },
            { positionId: 'rb', preferredPosition: Position.DEF },
            { positionId: 'ml', preferredPosition: Position.MID },
            { positionId: 'mcl', preferredPosition: Position.MID },
            { positionId: 'mcr', preferredPosition: Position.MID },
            { positionId: 'mr', preferredPosition: Position.MID },
            { positionId: 'stl', preferredPosition: Position.FWD },
            { positionId: 'str', preferredPosition: Position.FWD }
        ],
        '4-2-3-1': [
            { positionId: 'gk', preferredPosition: Position.GK },
            { positionId: 'lb', preferredPosition: Position.DEF },
            { positionId: 'dcl', preferredPosition: Position.DEF },
            { positionId: 'dcr', preferredPosition: Position.DEF },
            { positionId: 'rb', preferredPosition: Position.DEF },
            { positionId: 'dmcl', preferredPosition: Position.MID },
            { positionId: 'dmcr', preferredPosition: Position.MID },
            { positionId: 'aml', preferredPosition: Position.MID },
            { positionId: 'amc', preferredPosition: Position.MID },
            { positionId: 'amr', preferredPosition: Position.MID },
            { positionId: 'st', preferredPosition: Position.FWD }
        ],
    };

    return formationPatterns[formation] || formationPatterns['4-3-3'];
}
