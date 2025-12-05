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

/**
 * Convert CSV/D1 player to match engine PlayerState
 */
export function convertToPlayerState(csvPlayer: CSVPlayer): PlayerState {
    // Default value for missing attributes
    const defaultAttr = 10;

    return {
        id: csvPlayer.UID,
        name: csvPlayer.Name,
        position: csvPlayer.Position,

        attributes: {
            // Technical
            Corners: csvPlayer.Corners ?? defaultAttr,
            Crossing: csvPlayer.Crossing ?? defaultAttr,
            Dribbling: csvPlayer.Dribbling ?? defaultAttr,
            Finishing: csvPlayer.Finishing ?? defaultAttr,
            FirstTouch: csvPlayer.FirstTouch ?? defaultAttr,
            FreeKickTaking: csvPlayer.FreeKickTaking ?? defaultAttr,
            Heading: csvPlayer.Heading ?? defaultAttr,
            LongShots: csvPlayer.LongShots ?? defaultAttr,
            LongThrows: csvPlayer.LongThrows ?? defaultAttr,
            Marking: csvPlayer.Marking ?? defaultAttr,
            Passing: csvPlayer.Passing ?? defaultAttr,
            PenaltyTaking: csvPlayer.PenaltyTaking ?? defaultAttr,
            Tackling: csvPlayer.Tackling ?? defaultAttr,
            Technique: csvPlayer.Technique ?? defaultAttr,

            // Mental
            Aggression: csvPlayer.Aggression ?? defaultAttr,
            Anticipation: csvPlayer.Anticipation ?? defaultAttr,
            Bravery: csvPlayer.Bravery ?? defaultAttr,
            Composure: csvPlayer.Composure ?? defaultAttr,
            Concentration: csvPlayer.Concentration ?? defaultAttr,
            Decisions: csvPlayer.Decisions ?? defaultAttr,
            Determination: csvPlayer.Determination ?? defaultAttr,
            Flair: csvPlayer.Flair ?? defaultAttr,
            Leadership: csvPlayer.Leadership ?? defaultAttr,
            OffTheBall: csvPlayer.OffTheBall ?? defaultAttr,
            Positioning: csvPlayer.Positioning ?? defaultAttr,
            Teamwork: csvPlayer.Teamwork ?? defaultAttr,
            Vision: csvPlayer.Vision ?? defaultAttr,
            WorkRate: csvPlayer.WorkRate ?? defaultAttr,

            // Physical
            Acceleration: csvPlayer.Acceleration ?? defaultAttr,
            Agility: csvPlayer.Agility ?? defaultAttr,
            Balance: csvPlayer.Balance ?? defaultAttr,
            JumpingReach: csvPlayer.JumpingReach ?? defaultAttr,
            NaturalFitness: csvPlayer.NaturalFitness ?? defaultAttr,
            Pace: csvPlayer.Pace ?? defaultAttr,
            Stamina: csvPlayer.Stamina ?? 100,
            Strength: csvPlayer.Strength ?? defaultAttr,

            // Goalkeeper (defaults to 1 for outfield players)
            Reflexes: csvPlayer.Reflexes ?? (csvPlayer.Position === 'GK' ? defaultAttr : 1),
            Handling: csvPlayer.Handling ?? (csvPlayer.Position === 'GK' ? defaultAttr : 1),
            OneOnOnes: csvPlayer.OneOnOnes ?? (csvPlayer.Position === 'GK' ? defaultAttr : 1),
            Kicking: csvPlayer.Kicking ?? (csvPlayer.Position === 'GK' ? defaultAttr : 1),
            CommandOfArea: csvPlayer.CommandOfArea ?? (csvPlayer.Position === 'GK' ? defaultAttr : 1)
        },

        // Match state
        condition: 100,
        stamina: csvPlayer.Stamina ?? 100,
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
export function convertPlayersToState(csvPlayers: CSVPlayer[]): PlayerState[] {
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
        const aIdx = positionOrder.indexOf(a.position);
        const bIdx = positionOrder.indexOf(b.position);
        return aIdx - bIdx;
    });

    // Take first 11
    return sorted.slice(0, 11);
}
