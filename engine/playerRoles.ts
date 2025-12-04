// Player Roles & Duties - FM2023 Role Definitions
// Each role has implicit instructions and position-specific modifiers

import { TacticalModifiers } from './types';

export type PlayerDuty = 'Defend' | 'Support' | 'Attack';

export interface PlayerRole {
    name: string;
    position: string; // GK, DC, WB, MC, AMC, ST, etc.
    duty: PlayerDuty;
    implicitInstructions: string[];
    modifiers: TacticalModifiers;
    keyAttributes: string[]; // Required attributes for this role
    description: string;
}

/**
 * Goalkeeper Roles
 */
export const GK_ROLES: Record<string, PlayerRole> = {
    'Sweeper Keeper (Attack)': {
        name: 'Sweeper Keeper',
        position: 'GK',
        duty: 'Attack',
        implicitInstructions: ['Rush Out More Often', 'Take Risks', 'Distribute to Full-Backs'],
        modifiers: {
            PASS_LONG: 1.2,
            CLEARANCE: 0.9
        },
        keyAttributes: ['Reflexes', 'RushingOut', 'Acceleration', 'Anticipation', 'Decisions', 'Kicking'],
        description: 'Acts as sweeper, rushing out to clear danger'
    },

    'Goalkeeper (Defend)': {
        name: 'Goalkeeper',
        position: 'GK',
        duty: 'Defend',
        implicitInstructions: ['Stay on Line', 'Distribute to Center-Backs'],
        modifiers: {},
        keyAttributes: ['Reflexes', 'Handling', 'Positioning', 'OneOnOnes'],
        description: 'Traditional goalkeeper, stays on line'
    }
};

/**
 * Defender Roles
 */
export const DEFENDER_ROLES: Record<string, PlayerRole> = {
    'Ball-Playing Defender (Defend)': {
        name: 'Ball-Playing Defender',
        position: 'DC',
        duty: 'Defend',
        implicitInstructions: ['Take More Risks', 'Dribble More'],
        modifiers: {
            PASS_SHORT: 1.1,
            DRIBBLE: 1.2
        },
        keyAttributes: ['Passing', 'Technique', 'Composure', 'Tackling', 'Positioning'],
        description: 'Builds from back with passing'
    },

    'No-Nonsense Centre-Back (Defend)': {
        name: 'No-Nonsense Centre-Back',
        position: 'DC',
        duty: 'Defend',
        implicitInstructions: ['Clear Ball to Flanks', 'Mark Tighter', 'Tackle Harder'],
        modifiers: {
            CLEARANCE: 1.3,
            TACKLE: 1.2,
            HEADER: 1.1
        },
        keyAttributes: ['Tackling', 'Marking', 'Positioning', 'Strength', 'Bravery', 'JumpingReach'],
        description: 'Physical defender, clears danger'
    },

    'Wing-Back (Attack)': {
        name: 'Wing-Back',
        position: 'WB',
        duty: 'Attack',
        implicitInstructions: ['Get Forward', 'Cross More Often', 'Overlap'],
        modifiers: {
            CROSS: 1.3,
            RUN_FORWARD: 1.4,
            DRIBBLE: 1.1,
            TACKLE: 0.8
        },
        keyAttributes: ['Crossing', 'Dribbling', 'Pace', 'WorkRate', 'Stamina', 'Technique'],
        description: 'Attacking full-back, provides width'
    },

    'Full-Back (Support)': {
        name: 'Full-Back',
        position: 'WB',
        duty: 'Support',
        implicitInstructions: ['Support Attack'],
        modifiers: {
            CROSS: 1.1,
            TACKLE: 1.0
        },
        keyAttributes: ['Tackling', 'Marking', 'Pace', 'Stamina', 'Positioning'],
        description: 'Balanced full-back'
    }
};

/**
 * Midfielder Roles
 */
export const MIDFIELDER_ROLES: Record<string, PlayerRole> = {
    'Deep-Lying Playmaker (Support)': {
        name: 'Deep-Lying Playmaker',
        position: 'MC',
        duty: 'Support',
        implicitInstructions: ['Hold Position', 'Take More Risks', 'More Direct Passes'],
        modifiers: {
            PASS_LONG: 1.3,
            PASS_SHORT: 1.2
        },
        keyAttributes: ['Passing', 'Vision', 'Technique', 'Composure', 'Decisions'],
        description: 'Dictates tempo from deep'
    },

    'Box-to-Box Midfielder (Support)': {
        name: 'Box-to-Box Midfielder',
        position: 'MC',
        duty: 'Support',
        implicitInstructions: ['Get Forward', 'Move Into Channels'],
        modifiers: {
            RUN_FORWARD: 1.2,
            TACKLE: 1.1,
            SHOOT_LONG: 1.1
        },
        keyAttributes: ['Stamina', 'WorkRate', 'Tackling', 'Passing', 'Technique', 'Determination'],
        description: 'All-action midfielder'
    },

    'Advanced Playmaker (Attack)': {
        name: 'Advanced Playmaker',
        position: 'AMC',
        duty: 'Attack',
        implicitInstructions: ['Roam From Position', 'Move Into Channels', 'Take More Risks'],
        modifiers: {
            PASS_CREATIVE: 1.4,
            DRIBBLE: 1.2,
            SHOOT_LONG: 1.1
        },
        keyAttributes: ['Vision', 'Passing', 'Technique', 'Flair', 'Decisions', 'OffTheBall'],
        description: 'Creates chances in final third'
    },

    'Mezzala (Support)': {
        name: 'Mezzala',
        position: 'MC',
        duty: 'Support',
        implicitInstructions: ['Move Into Channels', 'Roam From Position', 'Get Forward'],
        modifiers: {
            RUN_FORWARD: 1.3,
            DRIBBLE: 1.2,
            SHOOT_LONG: 1.2
        },
        keyAttributes: ['Passing', 'Technique', 'Dribbling', 'OffTheBall', 'Stamina'],
        description: 'Half-space operator, late runs'
    }
};

/**
 * Forward Roles
 */
export const FORWARD_ROLES: Record<string, PlayerRole> = {
    'Advanced Forward (Attack)': {
        name: 'Advanced Forward',
        position: 'ST',
        duty: 'Attack',
        implicitInstructions: ['Move Into Channels', 'Run At Defence'],
        modifiers: {
            SHOOT: 1.3,
            RUN_FORWARD: 1.2,
            DRIBBLE: 1.1
        },
        keyAttributes: ['Finishing', 'Pace', 'Dribbling', 'OffTheBall', 'Composure'],
        description: 'Runs in behind, beats offside trap'
    },

    'Complete Forward (Attack)': {
        name: 'Complete Forward',
        position: 'ST',
        duty: 'Attack',
        implicitInstructions: ['Roam From Position', 'Shoot More Often', 'Dribble More'],
        modifiers: {
            SHOOT: 1.3,
            DRIBBLE: 1.2,
            HOLD_UP: 1.1,
            HEADER: 1.1
        },
        keyAttributes: ['Finishing', 'Dribbling', 'Strength', 'FirstTouch', 'OffTheBall', 'Composure'],
        description: 'All-round striker, scores and creates'
    },

    'Poacher (Attack)': {
        name: 'Poacher',
        position: 'ST',
        duty: 'Attack',
        implicitInstructions: ['Stay in Position', 'Shoot More Often'],
        modifiers: {
            SHOOT: 1.4,
            POSITIONING: 1.3
        },
        keyAttributes: ['Finishing', 'Anticipation', 'OffTheBall', 'Composure'],
        description: 'Penalty box specialist'
    },

    'Winger (Attack)': {
        name: 'Winger',
        position: 'ML/MR',
        duty: 'Attack',
        implicitInstructions: ['Hug Touchline', 'Cross More Often', 'Run At Defence'],
        modifiers: {
            CROSS: 1.4,
            DRIBBLE: 1.3,
            RUN_FORWARD: 1.2
        },
        keyAttributes: ['Pace', 'Acceleration', 'Dribbling', 'Crossing', 'Technique'],
        description: 'Traditional winger, provides width'
    },

    'Inside Forward (Attack)': {
        name: 'Inside Forward',
        position: 'ML/MR',
        duty: 'Attack',
        implicitInstructions: ['Cut Inside', 'Shoot More Often', 'Sit Narrower'],
        modifiers: {
            SHOOT: 1.3,
            DRIBBLE: 1.2,
            CUT_INSIDE: 1.4
        },
        keyAttributes: ['Finishing', 'Dribbling', 'Pace', 'Technique', 'Flair'],
        description: 'Inverted winger, cuts inside to shoot'
    }
};

/**
 * All roles combined
 */
export const ALL_ROLES: Record<string, PlayerRole> = {
    ...GK_ROLES,
    ...DEFENDER_ROLES,
    ...MIDFIELDER_ROLES,
    ...FORWARD_ROLES
};

/**
 * Get role definition by name and duty.
 */
export function getPlayerRole(name: string, duty?: PlayerDuty): PlayerRole | null {
    const roleKey = duty ? `${name} (${duty})` : name;
    return ALL_ROLES[roleKey] || null;
}

/**
 * Get all available roles for a position.
 */
export function getRolesForPosition(position: string): PlayerRole[] {
    return Object.values(ALL_ROLES).filter(role => role.position === position);
}
