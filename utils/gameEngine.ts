
import { Team, Player, MatchEvent, Position } from "../types";

export const calculateTeamStats = (team: Team) => {
  // Simple avg of top 11 players for now
  const starters = team.players.slice(0, 11);
  
  // Mapping new detailed attributes to old abstract engine concepts
  // Att: Shooting, Pace, Finishing, Composure
  const avgAtt = starters.reduce((acc, p) => 
    acc + p.attributes.technical.finishing + p.attributes.physical.pace + p.attributes.mental.composure, 0) / (3 * 11);
    
  // Mid: Passing, Vision, Technique, WorkRate
  const avgMid = starters.reduce((acc, p) => 
    acc + p.attributes.technical.passing + p.attributes.mental.vision + p.attributes.technical.technique, 0) / (3 * 11);
    
  // Def: Tackling, Positioning, Strength, Marking (using Positioning as proxy)
  const avgDef = starters.reduce((acc, p) => 
    acc + p.attributes.technical.tackling + p.attributes.mental.positioning + p.attributes.physical.strength, 0) / (3 * 11);

  // Normalize approx to 1-20 scale then * 5 for 1-100 range equivalent
  return { att: avgAtt * 5, mid: avgMid * 5, def: avgDef * 5 };
};

export const simulateMinute = (
  minute: number,
  home: Team,
  away: Team,
  score: { home: number; away: number }
): MatchEvent | null => {
  const homeStats = calculateTeamStats(home);
  const awayStats = calculateTeamStats(away);

  // Midfield Battle determines possession/opportunity
  const totalMid = homeStats.mid + awayStats.mid;
  const homeMidAdvantage = homeStats.mid / totalMid; // e.g. 0.55

  const rand = Math.random();
  
  // Event Chance (higher if teams are aggressive)
  if (rand > 0.92) { // 8% chance of significant event per minute
    
    // Who attacks?
    const attacker = Math.random() < homeMidAdvantage ? home : away;
    const defender = attacker === home ? away : home;
    const attStats = attacker === home ? homeStats.att : awayStats.att;
    const defStats = attacker === home ? awayStats.def : homeStats.def;
    
    // Attack Calculation
    // Base 10% chance to score on an attack, modified by Att vs Def
    // Engine uses "200" scale concepts, so we use the raw stat values (1-20) roughly scaled
    let goalChance = 0.10 + ((attStats - defStats) / 100); 
    
    // Mentality modifier
    if (attacker.tactics.mentality === 'Attacking') goalChance += 0.05;
    if (defender.tactics.mentality === 'Defensive') goalChance -= 0.05;

    if (Math.random() < goalChance) {
      // GOAL!
      // Pick a random scorer (weighted towards FWD)
      const fwds = attacker.players.filter(p => p.position === Position.FWD);
      const others = attacker.players.filter(p => p.position !== Position.FWD && p.position !== Position.GK);
      const scorer = Math.random() < 0.7 && fwds.length > 0
        ? fwds[Math.floor(Math.random() * fwds.length)] 
        : others[Math.floor(Math.random() * others.length)];
      
      const safeScorer = scorer || attacker.players[0];

      return {
        minute,
        type: 'GOAL',
        description: `GOAL! ${safeScorer.name} fires it home with a brilliant finish!`,
        teamId: attacker.id,
        playerId: safeScorer.id
      };
    } else {
      // MISS / SAVE
      return {
        minute,
        type: 'MISS',
        description: `${attacker.name} creates a chance but the shot goes wide!`,
        teamId: attacker.id
      };
    }
  }

  // Random Cards / Injuries (Rare)
  if (rand < 0.002) {
    return {
      minute,
      type: 'CARD_YELLOW',
      description: `Yellow Card shown to a player from ${Math.random() > 0.5 ? home.name : away.name} for a rough challenge.`,
    };
  }

  return null;
};
