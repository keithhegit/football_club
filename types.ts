
export enum Position {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD'
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
    formation: string; // e.g. "4-4-2"
    mentality: 'Defensive' | 'Balanced' | 'Attacking';
  };
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
  currentView: 'DASHBOARD' | 'SQUAD' | 'LEAGUE' | 'MATCH' | 'TACTICS';
  activeMatchId: string | null;
}
