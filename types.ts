
export enum Position {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD'
}

export interface Manager {
  name: string;
  nationality: string;
  experience: 'Amateur' | 'Semi-Pro' | 'Professional';
  preference: 'Attacking' | 'Balanced' | 'Defensive';
}

export enum MatchState {
  PRE_MATCH = 'PRE_MATCH',
  PLAYING = 'PLAYING',
  HALF_TIME = 'HALF_TIME',
  FULL_TIME = 'FULL_TIME'
}

// New Attribute System (1-20 scale)
export interface TechnicalAttributes {
  finishing: number;
  dribbling: number;
  passing: number;
  tackling: number;
  technique: number;
  firstTouch: number;
}

export interface MentalAttributes {
  vision: number;
  decisions: number;
  positioning: number;
  composure: number;
  workRate: number;
  anticipation: number;
  determination: number;
}

export interface PhysicalAttributes {
  pace: number;
  acceleration: number;
  stamina: number;
  strength: number;
  balance: number;
  agility: number;
}

export interface HiddenAttributes {
  consistency: number;
  importantMatches: number;
  injuryProneness: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  position: Position;
  nationality: string;

  // CA/PA System
  ca: number; // Current Ability (1-200)
  pa: number; // Potential Ability (1-200)

  // Detailed Stats
  attributes: {
    technical: TechnicalAttributes;
    mental: MentalAttributes;
    physical: PhysicalAttributes;
  };
  hidden: HiddenAttributes;

  // Dynamic Game State
  condition: number; // 0-100%
  morale: number; // 0-100%

  // Season Stats
  goals: number;
  assists: number;
  cleanSheets: number;
  value: number; // Market value
}



export interface MatchEvent {
  minute: number;
  type: 'GOAL' | 'MISS' | 'CARD_YELLOW' | 'CARD_RED' | 'SUB' | 'INJURY' | 'HALF_TIME' | 'FULL_TIME';
  description: string;
  teamId?: string;
  playerId?: string;
}

export interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  played: boolean;
  homeScore: number;
  awayScore: number;
  week: number;
}

export interface GameState {
  currentWeek: number;
  userTeamId: string;
  teams: Team[];
  fixtures: Fixture[];
  currentView: 'MAIN_MENU' | 'MANAGER_CREATION' | 'CLUB_SELECTION' | 'DASHBOARD' | 'SQUAD' | 'LEAGUE' | 'MATCH' | 'TACTICS' | 'SEARCH';
  activeMatchId: string | null;
  manager?: Manager;
}

// Tactics System Types
export type Duty = 'Defend' | 'Support' | 'Attack' | 'Automatic';

export interface Role {
  id: string;
  name: string;
  description: string;
  availableDuties: Duty[];
}

export interface PlayerPosition {
  id: string; // e.g., "GK", "DR", "MCR"
  name: string;
  x: number; // 0-100 (Left-Right)
  y: number; // 0-100 (Back-Front)
}

export interface Formation {
  id: string;
  name: string;
  positions: PlayerPosition[]; // Array of 11 positions
}

export interface TacticalInstructions {
  mentality: 'Very Defensive' | 'Defensive' | 'Cautious' | 'Balanced' | 'Positive' | 'Attacking' | 'Very Attacking';
  inPossession: {
    passingDirectness: number; // 0-100
    tempo: number; // 0-100
    width: number; // 0-100
  };
  inTransition: {
    counterPress: boolean;
    counter: boolean;
    distributeQuickly: boolean;
  };
  outOfPossession: {
    lineOfEngagement: number; // 0-100
    defensiveLine: number; // 0-100
    pressingIntensity: number; // 0-100
  };
}

// Update Team interface to include full tactics
export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  tactics: {
    formation: string; // Formation ID
    mentality: string; // Legacy, keep for compatibility or remove if fully migrated
    instructions: TacticalInstructions;
    lineup: {
      positionId: string; // e.g. "GK"
      playerId: string;
      role: string;
      duty: Duty;
    }[];
  };
}
