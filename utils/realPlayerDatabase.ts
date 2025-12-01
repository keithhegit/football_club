
import { Position, Player } from "../types";

// This data simulates the JSON output you would get from parsing the Kaggle CSV.
// Stats are based on FM24/25 generic values.

export const REAL_PLAYER_DATABASE: Partial<Player>[] = [
  // --- MANCHESTER BLUE (City) ---
  {
    id: "mci_haaland",
    name: "Erling Haaland",
    position: Position.FWD,
    nationality: "Norway",
    ca: 195,
    attributes: {
      technical: { finishing: 19, dribbling: 14, passing: 13, tackling: 4, technique: 16, firstTouch: 16 },
      mental: { vision: 14, decisions: 16, positioning: 19, composure: 18, workRate: 17, anticipation: 19 },
      physical: { pace: 19, acceleration: 18, stamina: 17, strength: 19, balance: 17, agility: 16 }
    }
  },
  {
    id: "mci_kdb",
    name: "Kevin De Bruyne",
    position: Position.MID,
    nationality: "Belgium",
    ca: 188,
    attributes: {
      technical: { finishing: 16, dribbling: 15, passing: 19, tackling: 10, technique: 19, firstTouch: 18 },
      mental: { vision: 20, decisions: 18, positioning: 14, composure: 18, workRate: 15, anticipation: 18 },
      physical: { pace: 14, acceleration: 14, stamina: 15, strength: 14, balance: 14, agility: 14 }
    }
  },
  {
    id: "mci_rodri",
    name: "Rodri",
    position: Position.MID,
    nationality: "Spain",
    ca: 182,
    attributes: {
      technical: { finishing: 12, dribbling: 13, passing: 17, tackling: 17, technique: 16, firstTouch: 16 },
      mental: { vision: 17, decisions: 18, positioning: 19, composure: 18, workRate: 17, anticipation: 19 },
      physical: { pace: 12, acceleration: 12, stamina: 18, strength: 17, balance: 16, agility: 13 }
    }
  },
  {
    id: "mci_dias",
    name: "Ruben Dias",
    position: Position.DEF,
    nationality: "Portugal",
    ca: 176,
    attributes: {
      technical: { finishing: 8, dribbling: 10, passing: 14, tackling: 17, technique: 13, firstTouch: 13 },
      mental: { vision: 13, decisions: 17, positioning: 18, composure: 17, workRate: 16, anticipation: 17 },
      physical: { pace: 13, acceleration: 13, stamina: 16, strength: 17, balance: 16, agility: 13 }
    }
  },
  {
    id: "mci_foden",
    name: "Phil Foden",
    position: Position.MID,
    nationality: "England",
    ca: 175,
    attributes: {
      technical: { finishing: 16, dribbling: 18, passing: 16, tackling: 8, technique: 18, firstTouch: 19 },
      mental: { vision: 17, decisions: 15, positioning: 15, composure: 16, workRate: 16, anticipation: 16 },
      physical: { pace: 16, acceleration: 17, stamina: 15, strength: 11, balance: 18, agility: 18 }
    }
  },
  {
    id: "mci_ederson",
    name: "Ederson",
    position: Position.GK,
    nationality: "Brazil",
    ca: 170,
    attributes: {
      technical: { finishing: 5, dribbling: 12, passing: 18, tackling: 6, technique: 16, firstTouch: 16 },
      mental: { vision: 16, decisions: 16, positioning: 17, composure: 19, workRate: 13, anticipation: 16 },
      physical: { pace: 13, acceleration: 12, stamina: 14, strength: 14, balance: 14, agility: 16 }
    }
  },
  // Fillers for City
  { id: "mci_walker", name: "Kyle Walker", position: Position.DEF, ca: 160, attributes: { technical: { finishing: 8, dribbling: 12, passing: 13, tackling: 15, technique: 12, firstTouch: 12 }, mental: { vision: 11, decisions: 13, positioning: 14, composure: 13, workRate: 16, anticipation: 14 }, physical: { pace: 19, acceleration: 18, stamina: 16, strength: 16, balance: 15, agility: 15 } } },
  { id: "mci_bernardo", name: "Bernardo Silva", position: Position.MID, ca: 178, attributes: { technical: { finishing: 14, dribbling: 18, passing: 17, tackling: 12, technique: 19, firstTouch: 19 }, mental: { vision: 17, decisions: 17, positioning: 15, composure: 17, workRate: 19, anticipation: 17 }, physical: { pace: 14, acceleration: 16, stamina: 18, strength: 10, balance: 18, agility: 19 } } },
  { id: "mci_gvardiol", name: "Josko Gvardiol", position: Position.DEF, ca: 165, attributes: { technical: { finishing: 10, dribbling: 13, passing: 14, tackling: 16, technique: 14, firstTouch: 14 }, mental: { vision: 13, decisions: 15, positioning: 15, composure: 16, workRate: 15, anticipation: 16 }, physical: { pace: 16, acceleration: 15, stamina: 15, strength: 16, balance: 15, agility: 14 } } },
  { id: "mci_stones", name: "John Stones", position: Position.DEF, ca: 168, attributes: { technical: { finishing: 9, dribbling: 13, passing: 16, tackling: 16, technique: 15, firstTouch: 15 }, mental: { vision: 14, decisions: 16, positioning: 16, composure: 18, workRate: 14, anticipation: 16 }, physical: { pace: 14, acceleration: 13, stamina: 15, strength: 15, balance: 15, agility: 14 } } },
  { id: "mci_alvarez", name: "Julian Alvarez", position: Position.FWD, ca: 160, attributes: { technical: { finishing: 15, dribbling: 14, passing: 13, tackling: 9, technique: 14, firstTouch: 14 }, mental: { vision: 13, decisions: 14, positioning: 15, composure: 14, workRate: 18, anticipation: 15 }, physical: { pace: 16, acceleration: 17, stamina: 17, strength: 13, balance: 15, agility: 16 } } },

  // --- LONDON BLUE (Chelsea) ---
  {
    id: "che_palmer",
    name: "Cole Palmer",
    position: Position.MID,
    nationality: "England",
    ca: 165,
    attributes: {
      technical: { finishing: 16, dribbling: 16, passing: 16, tackling: 6, technique: 17, firstTouch: 16 },
      mental: { vision: 17, decisions: 15, positioning: 13, composure: 18, workRate: 14, anticipation: 15 },
      physical: { pace: 14, acceleration: 15, stamina: 14, strength: 11, balance: 14, agility: 15 }
    }
  },
  {
    id: "che_enzo",
    name: "Enzo Fernandez",
    position: Position.MID,
    nationality: "Argentina",
    ca: 160,
    attributes: {
      technical: { finishing: 11, dribbling: 13, passing: 18, tackling: 13, technique: 16, firstTouch: 15 },
      mental: { vision: 17, decisions: 15, positioning: 14, composure: 15, workRate: 15, anticipation: 15 },
      physical: { pace: 12, acceleration: 13, stamina: 16, strength: 13, balance: 14, agility: 13 }
    }
  },
  {
    id: "che_james",
    name: "Reece James",
    position: Position.DEF,
    nationality: "England",
    ca: 162,
    attributes: {
      technical: { finishing: 11, dribbling: 14, passing: 15, tackling: 16, technique: 15, firstTouch: 14 },
      mental: { vision: 14, decisions: 14, positioning: 15, composure: 14, workRate: 15, anticipation: 15 },
      physical: { pace: 16, acceleration: 16, stamina: 14, strength: 17, balance: 16, agility: 15 }
    }
  },
  {
    id: "che_caicedo",
    name: "Moises Caicedo",
    position: Position.MID,
    nationality: "Ecuador",
    ca: 158,
    attributes: {
      technical: { finishing: 9, dribbling: 12, passing: 14, tackling: 17, technique: 14, firstTouch: 13 },
      mental: { vision: 13, decisions: 14, positioning: 16, composure: 15, workRate: 17, anticipation: 17 },
      physical: { pace: 14, acceleration: 15, stamina: 18, strength: 14, balance: 15, agility: 15 }
    }
  },
  {
    id: "che_nkunku",
    name: "C. Nkunku",
    position: Position.FWD,
    nationality: "France",
    ca: 163,
    attributes: {
      technical: { finishing: 15, dribbling: 16, passing: 15, tackling: 6, technique: 16, firstTouch: 16 },
      mental: { vision: 15, decisions: 15, positioning: 16, composure: 15, workRate: 14, anticipation: 16 },
      physical: { pace: 16, acceleration: 17, stamina: 14, strength: 12, balance: 15, agility: 16 }
    }
  },
  // Fillers for Chelsea
  { id: "che_colwill", name: "Levi Colwill", position: Position.DEF, ca: 150, attributes: { technical: { finishing: 6, dribbling: 11, passing: 15, tackling: 15, technique: 13, firstTouch: 13 }, mental: { vision: 13, decisions: 14, positioning: 15, composure: 16, workRate: 14, anticipation: 15 }, physical: { pace: 14, acceleration: 13, stamina: 14, strength: 15, balance: 14, agility: 13 } } },
  { id: "che_sanchez", name: "Robert Sanchez", position: Position.GK, ca: 145, attributes: { technical: { finishing: 4, dribbling: 9, passing: 14, tackling: 5, technique: 12, firstTouch: 11 }, mental: { vision: 11, decisions: 12, positioning: 14, composure: 12, workRate: 12, anticipation: 13 }, physical: { pace: 12, acceleration: 12, stamina: 13, strength: 14, balance: 13, agility: 14 } } },
  { id: "che_jackson", name: "Nicolas Jackson", position: Position.FWD, ca: 148, attributes: { technical: { finishing: 13, dribbling: 15, passing: 12, tackling: 6, technique: 13, firstTouch: 12 }, mental: { vision: 11, decisions: 11, positioning: 14, composure: 11, workRate: 16, anticipation: 13 }, physical: { pace: 17, acceleration: 17, stamina: 16, strength: 15, balance: 14, agility: 16 } } },
  { id: "che_disasi", name: "Axel Disasi", position: Position.DEF, ca: 146, attributes: { technical: { finishing: 7, dribbling: 9, passing: 12, tackling: 15, technique: 11, firstTouch: 11 }, mental: { vision: 10, decisions: 13, positioning: 14, composure: 13, workRate: 14, anticipation: 14 }, physical: { pace: 13, acceleration: 12, stamina: 15, strength: 17, balance: 12, agility: 11 } } },
  { id: "che_sterling", name: "Raheem Sterling", position: Position.MID, ca: 155, attributes: { technical: { finishing: 13, dribbling: 17, passing: 13, tackling: 6, technique: 15, firstTouch: 15 }, mental: { vision: 13, decisions: 12, positioning: 16, composure: 11, workRate: 13, anticipation: 15 }, physical: { pace: 16, acceleration: 17, stamina: 14, strength: 11, balance: 16, agility: 16 } } },
  { id: "che_gusto", name: "Malo Gusto", position: Position.DEF, ca: 148, attributes: { technical: { finishing: 8, dribbling: 13, passing: 13, tackling: 14, technique: 13, firstTouch: 13 }, mental: { vision: 11, decisions: 12, positioning: 13, composure: 12, workRate: 16, anticipation: 13 }, physical: { pace: 17, acceleration: 17, stamina: 16, strength: 13, balance: 14, agility: 15 } } },
];
