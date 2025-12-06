// Convert D1/CSV player data to match engine PlayerState format
import { PlayerState } from '../engine/types';

export interface CSVPlayer {
    UID: number;
    Name: string;
    Club: string;
    Nation: string;
    Position: string;
    Age: number;

    // Technical
    Corners?: number;
    Crossing?: number;
    Dribbling?: number;
    Finishing?: number;
    FirstTouch?: number;
    FreeKickTaking?: number;
    Heading?: number;
    LongShots?: number;
    LongThrows?: number;
    Marking?: number;
    Passing?: number;
    PenaltyTaking?: number;
    Tackling?: number;
    Technique?: number;

    // Mental
    Aggression?: number;
    Anticipation?: number;
    Bravery?: number;
    Composure?: number;
    Concentration?: number;
    Decisions?: number;
    Determination?: number;
    Flair?: number;
    Leadership?: number;
    OffTheBall?: number;
    Positioning?: number;
    Teamwork?: number;
    Vision?: number;
    WorkRate?: number;

    // Physical
    Acceleration?: number;
    Agility?: number;
    Balance?: number;
    JumpingReach?: number;
    NaturalFitness?: number;
    Pace?: number;
    Stamina?: number;
    Strength?: number;

    // Goalkeeping
    AerialReach?: number;
    CommandOfArea?: number;
    Communication?: number;
    Eccentricity?: number;
    Handling?: number;
    Kicking?: number;
    OneOnOnes?: number;
    Reflexes?: number;
    RushingOut?: number;
    TendencyToPunch?: number;
    Throwing?: number;

    // Hidden
    Consistency?: number;
    Dirtiness?: number;
    ImportantMatches?: number;
    InjuryProneness?: number;
    Versatility?: number;

    // Ability
    CurrentAbility?: number;
    PotentialAbility?: number;
}

// Helper to safely get attribute from either PascalCase (CSV) or snake_case (D1)
function getAttr(obj: any, pascal: string, snake: string, defaultVal = 10): number {
    if (obj[pascal] !== undefined) return Number(obj[pascal]);
    if (obj[snake] !== undefined) return Number(obj[snake]);
    return defaultVal;
}

/**
 * Convert CSV/D1 player to match engine PlayerState
 */
export function convertToPlayerState(csvPlayer: any): PlayerState {
    // Determine Position (Handle Case Sensitivity)
    const position = csvPlayer.Position || csvPlayer.position || 'M (C)';

    // Default value for missing attributes
    const d = 10;

    return {
        id: csvPlayer.UID || csvPlayer.id,
        name: csvPlayer.Name || csvPlayer.name,
        position: position,

        attributes: {
            // Technical
            Corners: getAttr(csvPlayer, 'Corners', 'corners', d),
            Crossing: getAttr(csvPlayer, 'Crossing', 'crossing', d),
            Dribbling: getAttr(csvPlayer, 'Dribbling', 'dribbling', d),
            Finishing: getAttr(csvPlayer, 'Finishing', 'finishing', d),
            FirstTouch: getAttr(csvPlayer, 'FirstTouch', 'first_touch', d),
            FreeKickTaking: getAttr(csvPlayer, 'FreeKickTaking', 'free_kicks', d),
            Heading: getAttr(csvPlayer, 'Heading', 'heading', d),
            LongShots: getAttr(csvPlayer, 'LongShots', 'long_shots', d),
            LongThrows: getAttr(csvPlayer, 'LongThrows', 'long_throws', d),
            Marking: getAttr(csvPlayer, 'Marking', 'marking', d),
            Passing: getAttr(csvPlayer, 'Passing', 'passing', d),
            PenaltyTaking: getAttr(csvPlayer, 'PenaltyTaking', 'penalty_taking', d),
            Tackling: getAttr(csvPlayer, 'Tackling', 'tackling', d),
            Technique: getAttr(csvPlayer, 'Technique', 'technique', d),

            // Mental
            Aggression: getAttr(csvPlayer, 'Aggression', 'aggression', d),
            Anticipation: getAttr(csvPlayer, 'Anticipation', 'anticipation', d),
            Bravery: getAttr(csvPlayer, 'Bravery', 'bravery', d),
            Composure: getAttr(csvPlayer, 'Composure', 'composure', d),
            Concentration: getAttr(csvPlayer, 'Concentration', 'concentration', d),
            Decisions: getAttr(csvPlayer, 'Decisions', 'decisions', d),
            Determination: getAttr(csvPlayer, 'Determination', 'determination', d),
            Flair: getAttr(csvPlayer, 'Flair', 'flair', d),
            Leadership: getAttr(csvPlayer, 'Leadership', 'leadership', d),
            OffTheBall: getAttr(csvPlayer, 'OffTheBall', 'off_the_ball', d),
            Positioning: getAttr(csvPlayer, 'Positioning', 'positioning', d),
            Teamwork: getAttr(csvPlayer, 'Teamwork', 'teamwork', d),
            Vision: getAttr(csvPlayer, 'Vision', 'vision', d),
            WorkRate: getAttr(csvPlayer, 'WorkRate', 'work_rate', d),

            // Physical
            Acceleration: getAttr(csvPlayer, 'Acceleration', 'acceleration', d),
            Agility: getAttr(csvPlayer, 'Agility', 'agility', d),
            Balance: getAttr(csvPlayer, 'Balance', 'balance', d),
            JumpingReach: getAttr(csvPlayer, 'JumpingReach', 'jumping_reach', d),
            NaturalFitness: getAttr(csvPlayer, 'NaturalFitness', 'natural_fitness', d),
            Pace: getAttr(csvPlayer, 'Pace', 'pace', d),
            Stamina: getAttr(csvPlayer, 'Stamina', 'stamina', 100),
            Strength: getAttr(csvPlayer, 'Strength', 'strength', d),

            // Goalkeeper (defaults to 1 for outfield players)
            Reflexes: getAttr(csvPlayer, 'Reflexes', 'reflexes', position.includes('GK') ? d : 1),
            Handling: getAttr(csvPlayer, 'Handling', 'handling', position.includes('GK') ? d : 1),
            OneOnOnes: getAttr(csvPlayer, 'OneOnOnes', 'one_on_ones', position.includes('GK') ? d : 1),
            Kicking: getAttr(csvPlayer, 'Kicking', 'kicking', position.includes('GK') ? d : 1),
            CommandOfArea: getAttr(csvPlayer, 'CommandOfArea', 'command_of_area', position.includes('GK') ? d : 1),
        },

        // Match state (do not inject CA/PA defaults here)
        condition: 100,
        stamina: getAttr(csvPlayer, 'Stamina', 'stamina', 100),
        morale: 75,  // Default morale
        form: 75,    // Default form
        yellowCards: 0,
        redCard: false,

        // Initial position (will be updated during match)
        currentPosition: { x: 50, y: 50 }
    };
}

/**
 * Convert array of CSV players to PlayerState array
 */
export function convertPlayersToState(csvPlayers: any[]): PlayerState[] {
    return csvPlayers.map(convertToPlayerState);
}

/**
 * Get starting XI from squad
 * Assumes first 11 players in formation order: GK, defenders, midfielders, forwards
 */
export function getStartingXI(allPlayers: PlayerState[]): PlayerState[] {
    // Sort by position priority
    const positionOrder = ['GK', 'DC', 'DL', 'DR', 'WBL', 'WBR', 'DM', 'MC', 'ML', 'MR', 'AM', 'ST'];

    const sorted = [...allPlayers].sort((a, b) => {
        const aPos = a.position.split(' ')[0]; // Handle 'M (C)' -> 'M' roughly, or just simple match
        const bPos = b.position.split(' ')[0];
        // Simplified sort - relying on detailed positions requires complex parsing
        // Fallback to simple CA sort if positions are messy
        return 0;
    });

    // Better logic: Find best player for each role
    // For now, keep original logic or rely on the input order if pre-sorted
    // Reverting to simple slice as placeholder
    return allPlayers.slice(0, 11);
}
