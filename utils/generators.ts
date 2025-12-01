
import { Player, Team, Position, TechnicalAttributes, MentalAttributes, PhysicalAttributes } from "../types";
import { REAL_PLAYER_DATABASE } from "./realPlayerDatabase";

const NAMES_FIRST = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Alessandro", "Luca", "Marco", "Andrea", "Leo", "Thiago", "Neymar", "Kylian", "Erling", "Kevin", "Mohamed", "Harry", "Bruno", "Marcus"];
const NAMES_LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Silva", "Santos", "Rossi", "Ferrari", "Russo", "Bianchi", "Mbappe", "Haaland", "De Bruyne", "Salah", "Kane", "Fernandes", "Rashford"];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp20 = (n: number) => Math.min(Math.max(Math.round(n), 1), 20);

class PlayerGenerator {
  
  static generateAttributes(ca: number, position: Position): Player['attributes'] {
    // Base attribute level (CA / 10 is the rough average)
    const base = ca / 10;
    const weights = this.getWeights(position);
    
    const generateCategory = (categoryWeights: Record<string, number>): any => {
      const stats: any = {};
      for (const [key, weight] of Object.entries(categoryWeights)) {
        const val = (base * weight) + randomInt(-2, 2);
        stats[key] = clamp20(val);
      }
      return stats;
    };

    return {
      technical: generateCategory(weights.technical),
      mental: generateCategory(weights.mental),
      physical: generateCategory(weights.physical)
    };
  }

  static getWeights(position: Position) {
    const defaultWeights = {
      technical: { finishing: 1, dribbling: 1, passing: 1, tackling: 1, technique: 1, firstTouch: 1 },
      mental: { vision: 1, decisions: 1, positioning: 1, composure: 1, workRate: 1, anticipation: 1 },
      physical: { pace: 1, acceleration: 1, stamina: 1, strength: 1, balance: 1, agility: 1 },
    };

    switch (position) {
      case Position.FWD:
        return {
          technical: { ...defaultWeights.technical, finishing: 1.5, dribbling: 1.2, tackling: 0.3 },
          mental: { ...defaultWeights.mental, composure: 1.4, anticipation: 1.3, positioning: 0.8 },
          physical: { ...defaultWeights.physical, pace: 1.4, acceleration: 1.4, strength: 1.2 }
        };
      case Position.MID:
        return {
          technical: { ...defaultWeights.technical, passing: 1.5, technique: 1.4, finishing: 0.8 },
          mental: { ...defaultWeights.mental, vision: 1.5, decisions: 1.3, workRate: 1.2 },
          physical: { ...defaultWeights.physical, stamina: 1.4, agility: 1.1 }
        };
      case Position.DEF:
        return {
          technical: { ...defaultWeights.technical, tackling: 1.5, passing: 0.8, finishing: 0.2 },
          mental: { ...defaultWeights.mental, positioning: 1.5, anticipation: 1.2, composure: 1.0 },
          physical: { ...defaultWeights.physical, strength: 1.4, pace: 1.0, balance: 1.2 }
        };
      case Position.GK:
        return {
           technical: { ...defaultWeights.technical, firstTouch: 0.5, tackling: 0.1, passing: 0.8 }, 
           mental: { ...defaultWeights.mental, decisions: 1.4, positioning: 1.5 },
           physical: { ...defaultWeights.physical, agility: 1.4, strength: 1.1, pace: 0.5 }
        };
      default:
        return defaultWeights;
    }
  }

  static generate(id: string, position: Position, targetCA: number, specificName?: string): Player {
    const age = randomInt(17, 35);
    const pa = Math.min(200, targetCA + (35 - age) * randomInt(0, 3)); 

    return {
      id,
      name: specificName || `${NAMES_FIRST[randomInt(0, NAMES_FIRST.length - 1)]} ${NAMES_LAST[randomInt(0, NAMES_LAST.length - 1)]}`,
      age,
      position,
      nationality: "Mixed",
      ca: targetCA,
      pa,
      attributes: this.generateAttributes(targetCA, position),
      hidden: {
        consistency: randomInt(1, 20),
        importantMatches: randomInt(1, 20),
        injuryProneness: randomInt(1, 20)
      },
      condition: 100,
      morale: 80,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      value: Math.pow(targetCA, 2.5) * 100
    };
  }
}

// -- Team Generators --

// Tries to find players for a specific team code (e.g., 'mci') in the Real Player DB.
// Fills the rest with generated players.
const generateTeamFromDB = (id: string, name: string, shortName: string, primaryColor: string, prefix: string, targetCA: number): Team => {
  const realPlayers = REAL_PLAYER_DATABASE.filter(p => p.id?.startsWith(prefix));
  
  // Convert Partial<Player> to full Player and add standard defaults
  const players: Player[] = realPlayers.map(p => ({
    ...p,
    age: 25, // Default if missing
    pa: (p.ca || 150) + 10,
    hidden: { consistency: 15, importantMatches: 15, injuryProneness: 5 },
    condition: 100,
    morale: 80,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    value: Math.pow(p.ca || 150, 2.5) * 100
  } as Player));

  // If we don't have a full squad (11 starters + 5 subs = 16), fill with generated
  let pid = 1;
  const currentCount = players.length;
  const needed = 16 - currentCount;

  if (needed > 0) {
     // Naive fill logic
     for (let i=0; i<needed; i++) {
        const pos = i === 0 && !players.some(p => p.position === Position.GK) ? Position.GK : 
                    i < 3 ? Position.DEF : 
                    i < 5 ? Position.MID : Position.FWD;
        players.push(PlayerGenerator.generate(`${id}_gen_${pid++}`, pos, targetCA - 20));
     }
  }

  // Ensure sorting
  players.sort((a, b) => b.ca - a.ca);

  return {
    id,
    name,
    shortName,
    primaryColor,
    secondaryColor: "#ffffff",
    players,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    tactics: {
      formation: "4-4-2",
      mentality: "Balanced"
    }
  };
}

export const generateTeam = (id: string, name: string, shortName: string, primaryColor: string, avgCA: number): Team => {
  const players: Player[] = [];
  let pid = 1;
  
  for (let i = 0; i < 2; i++) players.push(PlayerGenerator.generate(`${id}_gk_${pid++}`, Position.GK, avgCA));
  for (let i = 0; i < 6; i++) players.push(PlayerGenerator.generate(`${id}_def_${pid++}`, Position.DEF, avgCA));
  for (let i = 0; i < 6; i++) players.push(PlayerGenerator.generate(`${id}_mid_${pid++}`, Position.MID, avgCA));
  for (let i = 0; i < 4; i++) players.push(PlayerGenerator.generate(`${id}_fwd_${pid++}`, Position.FWD, avgCA));

  players.sort((a, b) => b.ca - a.ca);

  return {
    id,
    name,
    shortName,
    primaryColor,
    secondaryColor: "#ffffff",
    players,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    tactics: {
      formation: "4-4-2",
      mentality: "Balanced"
    }
  };
};

// Use the new DB loader for our user team and main rival
const userTeam = generateTeamFromDB("t1", "London Blue", "CHE", "#1e3a8a", "che", 155);
const rivalTeam = generateTeamFromDB("t3", "Manchester Blue", "MCI", "#0ea5e9", "mci", 175);

export const INITIAL_TEAMS: Team[] = [
  userTeam,
  generateTeam("t2", "Manchester Red", "MUN", "#b91c1c", 152),
  rivalTeam,
  generateTeam("t4", "Liverpool Red", "LIV", "#dc2626", 160),
  generateTeam("t5", "North London White", "TOT", "#f8fafc", 148),
  generateTeam("t6", "North London Red", "ARS", "#ef4444", 158),
  generateTeam("t7", "Newcastle Stripe", "NEW", "#171717", 145),
  generateTeam("t8", "Birmingham Claret", "AVL", "#7f1d1d", 142),
];
