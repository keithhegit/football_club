// Match Engine Type Definitions
// Based on FM2023 Match Engine mechanics

export type ActionType =
    | 'PASS_SHORT'
    | 'PASS_LONG'
    | 'SHOOT'
    | 'SHOOT_LONG'
    | 'TACKLE'
    | 'DRIBBLE'
    | 'HEADER'
    | 'INTERCEPT'
    | 'CROSS'
    | 'FIRST_TOUCH'
    | 'CLEARANCE';

export type MatchPhase = 'ATTACK' | 'DEFEND' | 'TRANSITION';

export type PossessionTeam = 'home' | 'away';

export interface Position {
    x: number; // 0-100 (left to right)
    y: number; // 0-100 (bottom to top)
}

export interface PlayerAttributes {
    // Technical
    Corners: number;
    Crossing: number;
    Dribbling: number;
    Finishing: number;
    FirstTouch: number;
    FreeKickTaking: number;
    Heading: number;
    LongShots: number;
    LongThrows: number;
    Marking: number;
    Passing: number;
    PenaltyTaking: number;
    Tackling: number;
    Technique: number;

    // Mental
    Aggression: number;
    Anticipation: number;
    Bravery: number;
    Composure: number;
    Concentration: number;
    Decisions: number;
    Determination: number;
    Flair: number;
    Leadership: number;
    OffTheBall: number;
    Positioning: number;
    Teamwork: number;
    Vision: number;
    WorkRate: number;

    // Physical
    Acceleration: number;
    Agility: number;
    Balance: number;
    JumpingReach: number;
    NaturalFitness: number;
    Pace: number;
    Stamina: number;
    Strength: number;

    // Goalkeeper (optional)
    AerialReach?: number;
    CommandOfArea?: number;
    Communication?: number;
    Eccentricity?: number;
    Handling?: number;
    Kicking?: number;
    OneOnOnes?: number;
    Reflexes?: number;
    RushingOut?: number;
    Punching?: number;
    Throwing?: number;
}

export interface PlayerState {
    id: number;
    name: string;
    position: string;
    attributes: PlayerAttributes;
    condition: number; // 0-100
    stamina: number; // 0-100
    morale: number; // 0-100
    form: number; // 0-100
    currentPosition: Position;
}

export interface MatchConditions {
    weather: 'clear' | 'rain' | 'snow';
    pitch: 'good' | 'poor';
    temperature: number;
}

export interface TacticalModifiers {
    [key: string]: number; // Action type -> multiplier
}

export interface MatchEvent {
    time: number; // Match minute
    type: ActionType;
    actor: PlayerState;
    opponent?: PlayerState;
    outcome: 'SUCCESS' | 'FAILURE';
    position: Position;
    xGContribution?: number;
    description: string;
}

export interface MatchStatistics {
    possession: [number, number]; // [home%, away%]
    shots: [number, number];
    shotsOnTarget: [number, number];
    passes: [number, number];
    passAccuracy: [number, number]; // percentage
    xG: [number, number]; // Expected goals
    tackles: [number, number];
    fouls: [number, number];
    corners: [number, number];
}

export interface MatchState {
    time: number; // 0-90+ minutes
    score: [number, number];
    possession: PossessionTeam;
    ballPosition: Position;
    phase: MatchPhase;
    homeTeam: TeamState;
    awayTeam: TeamState;
    eventLog: MatchEvent[];
    statistics: MatchStatistics;
    conditions: MatchConditions;
}

export interface TeamState {
    id: number;
    name: string;
    players: PlayerState[];
    formation: string; // e.g., "4-3-3"
    tacticalModifiers: TacticalModifiers;
}

export interface MatchResult {
    homeScore: number;
    awayScore: number;
    statistics: MatchStatistics;
    eventLog: MatchEvent[];
    playerRatings: Map<number, number>; // playerId -> rating (1-10)
}

// Attribute combination formula definition
export interface AttributeFormula {
    primary: { [key: string]: number }; // Primary attributes with weights
    mental: { [key: string]: number }; // Mental attributes with weights
    technical: { [key: string]: number }; // Technical attributes with weights
    physical: { [key: string]: number }; // Physical attributes with weights
}
