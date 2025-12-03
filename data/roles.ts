import { Duty, Position } from '../types';

export interface RoleDefinition {
    id: string;
    name: string;
    description: string;
    position: Position; // General position category (GK, DEF, MID, FWD)
    availableDuties: Duty[];
    keyAttributes: {
        technical: string[];
        mental: string[];
        physical: string[];
    };
}

export const ROLES: RoleDefinition[] = [
    // GOALKEEPER
    {
        id: 'gk_sweeper_keeper',
        name: 'Sweeper Keeper',
        description: 'A goalkeeper who aims to control the space behind the defensive line.',
        position: Position.GK,
        availableDuties: ['Defend', 'Support', 'Attack'],
        keyAttributes: {
            technical: ['reflexes', 'rushingOut', 'passing', 'firstTouch'],
            mental: ['anticipation', 'decisions', 'composure', 'vision'],
            physical: ['acceleration', 'agility']
        }
    },
    {
        id: 'gk_standard',
        name: 'Goalkeeper',
        description: 'A traditional goalkeeper focusing on shot stopping and safety.',
        position: Position.GK,
        availableDuties: ['Defend'],
        keyAttributes: {
            technical: ['reflexes', 'handling', 'aerialReach'],
            mental: ['positioning', 'concentration'],
            physical: ['agility', 'strength']
        }
    },

    // DEFENDERS (DC)
    {
        id: 'dc_no_nonsense',
        name: 'No-Nonsense Centre Back',
        description: 'A defender who clears the ball as soon as possible.',
        position: Position.DEF,
        availableDuties: ['Defend', 'Cover', 'Stopper'] as any, // Cast for extended duties if needed
        keyAttributes: {
            technical: ['tackling', 'marking', 'heading'],
            mental: ['positioning', 'bravery', 'concentration'],
            physical: ['strength', 'jumpingReach']
        }
    },
    {
        id: 'dc_ball_playing',
        name: 'Ball Playing Defender',
        description: 'A defender comfortable with the ball, looking to launch counter attacks.',
        position: Position.DEF,
        availableDuties: ['Defend', 'Cover', 'Stopper'] as any,
        keyAttributes: {
            technical: ['tackling', 'marking', 'passing', 'technique'],
            mental: ['vision', 'composure', 'decisions'],
            physical: ['strength', 'pace']
        }
    },

    // FULL BACKS / WING BACKS (DEF/MID)
    {
        id: 'dlr_wing_back',
        name: 'Wing Back',
        description: 'Runs up and down the flank, fulfilling both defensive and attacking duties.',
        position: Position.DEF,
        availableDuties: ['Defend', 'Support', 'Attack'],
        keyAttributes: {
            technical: ['crossing', 'dribbling', 'tackling', 'marking'],
            mental: ['workRate', 'offTheBall', 'teamwork'],
            physical: ['pace', 'stamina', 'acceleration']
        }
    },

    // MIDFIELDERS (MID)
    {
        id: 'mc_roaming_playmaker',
        name: 'Roaming Playmaker',
        description: 'The heartbeat of the team, driving forward with the ball and spraying passes.',
        position: Position.MID,
        availableDuties: ['Support'],
        keyAttributes: {
            technical: ['passing', 'technique', 'dribbling', 'firstTouch'],
            mental: ['vision', 'decisions', 'flair', 'teamwork', 'anticipation'],
            physical: ['stamina', 'acceleration']
        }
    },
    {
        id: 'mc_box_to_box',
        name: 'Box To Box Midfielder',
        description: 'Non-stop dynamism, contributing to both defense and attack.',
        position: Position.MID,
        availableDuties: ['Support'],
        keyAttributes: {
            technical: ['passing', 'tackling', 'finishing'],
            mental: ['workRate', 'offTheBall', 'positioning', 'determination'],
            physical: ['stamina', 'strength', 'pace']
        }
    },
    {
        id: 'mc_ball_winning',
        name: 'Ball Winning Midfielder',
        description: 'Focuses on winning the ball back in the center of the pitch.',
        position: Position.MID,
        availableDuties: ['Defend', 'Support'],
        keyAttributes: {
            technical: ['tackling', 'marking'],
            mental: ['aggression', 'bravery', 'workRate', 'positioning'],
            physical: ['strength', 'stamina']
        }
    },

    // ATTACKING MIDFIELDERS / WINGERS (MID/FWD)
    {
        id: 'amc_advanced_playmaker',
        name: 'Advanced Playmaker',
        description: 'Operates in the hole, looking to create chances for forwards.',
        position: Position.MID, // Can be AMC
        availableDuties: ['Support', 'Attack'],
        keyAttributes: {
            technical: ['passing', 'technique', 'firstTouch'],
            mental: ['vision', 'flair', 'decisions', 'anticipation', 'offTheBall'],
            physical: ['agility']
        }
    },
    {
        id: 'amrl_inside_forward',
        name: 'Inside Forward',
        description: 'Cuts inside from the flank to shoot or thread passes.',
        position: Position.FWD, // Or AMRL
        availableDuties: ['Support', 'Attack'],
        keyAttributes: {
            technical: ['dribbling', 'finishing', 'longShots', 'passing'],
            mental: ['offTheBall', 'flair', 'vision'],
            physical: ['acceleration', 'pace', 'agility']
        }
    },

    // STRIKERS (FWD)
    {
        id: 'st_complete_forward',
        name: 'Complete Forward',
        description: 'A technical and physical beast who can do it all.',
        position: Position.FWD,
        availableDuties: ['Support', 'Attack'],
        keyAttributes: {
            technical: ['finishing', 'dribbling', 'heading', 'technique', 'firstTouch'],
            mental: ['anticipation', 'composure', 'decisions', 'offTheBall', 'vision'],
            physical: ['strength', 'pace', 'jumpingReach', 'balance']
        }
    },
    {
        id: 'st_advanced_forward',
        name: 'Advanced Forward',
        description: 'Leads the line, looking to run onto through balls and score.',
        position: Position.FWD,
        availableDuties: ['Attack'],
        keyAttributes: {
            technical: ['finishing', 'dribbling', 'firstTouch'],
            mental: ['offTheBall', 'anticipation', 'composure'],
            physical: ['pace', 'acceleration', 'balance']
        }
    },
    {
        id: 'st_target_man',
        name: 'Target Man',
        description: 'Uses physical presence to hold up play and win aerial duels.',
        position: Position.FWD,
        availableDuties: ['Support', 'Attack'],
        keyAttributes: {
            technical: ['heading', 'firstTouch'],
            mental: ['bravery', 'teamwork', 'aggression'],
            physical: ['strength', 'jumpingReach', 'balance']
        }
    }
];

export const getRolesForPosition = (pos: Position) => {
    return ROLES.filter(r => r.position === pos);
};
