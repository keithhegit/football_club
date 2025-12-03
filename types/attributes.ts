// Player attribute types based on FM2023
export interface TechnicalAttributes {
    corners: number;
    crossing: number;
    dribbling: number;
    finishing: number;
    first_touch: number;
    free_kick_taking: number;
    heading: number;
    long_shots: number;
    long_throws: number;
    marking: number;
    passing: number;
    penalty_taking: number;
    tackling: number;
    technique: number;
}

export interface MentalAttributes {
    aggression: number;
    anticipation: number;
    bravery: number;
    composure: number;
    concentration: number;
    decisions: number;
    determination: number;
    flair: number;
    leadership: number;
    off_the_ball: number;
    positioning: number;
    teamwork: number;
    vision: number;
    work_rate: number;
}

export interface PhysicalAttributes {
    acceleration: number;
    agility: number;
    balance: number;
    jumping_reach: number;
    natural_fitness: number;
    pace: number;
    stamina: number;
    strength: number;
}

export interface GoalkeeperAttributes {
    aerial_reach: number;
    command_of_area: number;
    communication: number;
    eccentricity: number;
    handling: number;
    kicking: number;
    one_on_ones: number;
    reflexes: number;
    rushing_out: number;
    punching: number;
    throwing: number;
}

export interface HiddenAttributes {
    consistency: number; // 1-20
    important_matches: number; // 1-20
    injury_proneness: number; // 1-20
    versatility: number; // 1-20
}

export interface PlayerAttributes extends TechnicalAttributes, MentalAttributes, PhysicalAttributes {
    // GK attributes are optional
    goalkeeper?: GoalkeeperAttributes;
    hidden: HiddenAttributes;
}

export interface PlayerAbility {
    player_id: number;
    current_ability: number; // CA: 1-200
    potential_ability: number; // PA: 1-200
    recommended_ca: number; // RCA
    position_primary: 'GK' | 'DC' | 'DL' | 'DR' | 'WBL' | 'WBR' | 'DM' | 'MC' | 'ML' | 'MR' | 'AMC' | 'AML' | 'AMR' | 'ST';
    position_weights: Record<string, number>; // JSON object
    last_updated: string;
}

// Utility type for attribute deltas (training/match impact)
export interface AttributeDelta {
    [key: string]: number; // e.g., { finishing: 0.5, pace: -0.1 }
}
