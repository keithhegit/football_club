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
    | 'CLEARANCE'
    | 'FOUL'
    | 'SAVE'
    | 'CORNER'
    | 'FREE_KICK'
    | 'OFFSIDE';

export type CardType = 'YELLOW' | 'RED' | 'NONE';

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
    hiddenConsistency?: number; // 1-20 (GenieScout: Consistency)
    hiddenImportantMatches?: number; // 1-20 (Important Matches)
    currentPosition: Position;
    yellowCards: number; // Match cards
    redCard: boolean; // Sent off
}

export interface MatchConditions {
    weather: 'clear' | 'rain' | 'snow';
    pitch: 'good' | 'poor';
    temperature: number;
}

export interface TacticalModifiers {
    // Core sliders (0 = neutral)
    mentality?: number;          // -2 .. +2
    tempo?: number;              // -2 .. +2
    directness?: number;         // -2 .. +2
    width?: number;              // -2 .. +2
    defensiveLine?: number;      // -2 .. +2
    engagementLine?: number;     // -2 .. +2
    pressingIntensity?: number;  // -2 .. +2
    timeWasting?: number;        // 0..1
    counterPress?: boolean;
    counter?: boolean;
    focusLeft?: boolean;
    focusRight?: boolean;
    focusCentre?: boolean;
    workBallIntoBox?: boolean;
    hitEarlyCrosses?: boolean;
    shootOnSight?: boolean;
    stayOnFeet?: boolean;
    tackleHarder?: boolean;
    closeDownMore?: boolean;
    markTighter?: boolean;
    showOntoFootLeft?: boolean;
    showOntoFootRight?: boolean;
    distributeQuickly?: boolean;
    derby?: boolean; // context flag

    // Legacy per-action override (kept for backward compat)
    [key: string]: number | boolean | undefined;
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
    teamId: string | number;
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
    freeKicks: [number, number];
    yellowCards: [number, number]; // Yellow cards
    redCards: [number, number]; // Red cards
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
    id: number | string;
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
    snapshots?: PlayerSnapshot[];
}

export interface PlayerSnapshotEntry {
    id: number | string;
    stamina: number;
    morale: number;
    condition: number;
}

export interface PlayerSnapshot {
    minute: number;
    home: PlayerSnapshotEntry[];
    away: PlayerSnapshotEntry[];
}

// Attribute combination formula definition
export interface AttributeFormula {
    primary: { [key: string]: number }; // Primary attributes with weights
    mental: { [key: string]: number }; // Mental attributes with weights
    technical: { [key: string]: number }; // Technical attributes with weights
    physical: { [key: string]: number }; // Physical attributes with weights
}
