import { Formation, Team } from '../types';

export const GUIDED_FORMATIONS: Record<string, Formation> = {
  '4-4-2': {
    id: '4-4-2',
    name: '4-4-2 标准',
    positions: [
      { id: 'GK', name: 'GK', x: 50, y: 90 },
      { id: 'DR', name: 'DR', x: 88, y: 74 },
      { id: 'DCR', name: 'DCR', x: 64, y: 74 },
      { id: 'DCL', name: 'DCL', x: 36, y: 74 },
      { id: 'DL', name: 'DL', x: 12, y: 74 },
      { id: 'MR', name: 'MR', x: 88, y: 46 },
      { id: 'MCR', name: 'MCR', x: 64, y: 46 },
      { id: 'MCL', name: 'MCL', x: 36, y: 46 },
      { id: 'ML', name: 'ML', x: 12, y: 46 },
      { id: 'STR', name: 'ST', x: 60, y: 18 },
      { id: 'STL', name: 'ST', x: 40, y: 18 },
    ]
  },
  '4-3-3': {
    id: '4-3-3',
    name: '4-3-3 DM 宽',
    positions: [
      { id: 'GK', name: 'GK', x: 50, y: 90 },
      { id: 'DR', name: 'DR', x: 88, y: 74 },
      { id: 'DCR', name: 'DCR', x: 64, y: 74 },
      { id: 'DCL', name: 'DCL', x: 36, y: 74 },
      { id: 'DL', name: 'DL', x: 12, y: 74 },
      { id: 'DM', name: 'DM', x: 50, y: 60 },
      { id: 'MCR', name: 'MC', x: 66, y: 44 },
      { id: 'MCL', name: 'MC', x: 34, y: 44 },
      { id: 'AMR', name: 'AMR', x: 80, y: 26 },
      { id: 'AML', name: 'AML', x: 20, y: 26 },
      { id: 'ST', name: 'ST', x: 50, y: 16 },
    ]
  },
  '4-2-3-1': {
    id: '4-2-3-1',
    name: '4-2-3-1 宽',
    positions: [
      { id: 'GK', name: 'GK', x: 50, y: 90 },
      { id: 'DR', name: 'DR', x: 88, y: 74 },
      { id: 'DCR', name: 'DCR', x: 64, y: 74 },
      { id: 'DCL', name: 'DCL', x: 36, y: 74 },
      { id: 'DL', name: 'DL', x: 12, y: 74 },
      { id: 'MCR', name: 'MC', x: 60, y: 58 },
      { id: 'MCL', name: 'MC', x: 40, y: 58 },
      { id: 'AMR', name: 'AMR', x: 80, y: 30 },
      { id: 'AMC', name: 'AMC', x: 50, y: 30 },
      { id: 'AML', name: 'AML', x: 20, y: 30 },
      { id: 'ST', name: 'ST', x: 50, y: 16 },
    ]
  },
  '4-1-4-1': {
    id: '4-1-4-1',
    name: '4-1-4-1 控球',
    positions: [
      { id: 'GK', name: 'GK', x: 50, y: 90 },
      { id: 'DR', name: 'DR', x: 88, y: 74 },
      { id: 'DCR', name: 'DCR', x: 64, y: 74 },
      { id: 'DCL', name: 'DCL', x: 36, y: 74 },
      { id: 'DL', name: 'DL', x: 12, y: 74 },
      { id: 'DM', name: 'DM', x: 50, y: 60 },
      { id: 'MR', name: 'MR', x: 88, y: 46 },
      { id: 'MCR', name: 'MC', x: 64, y: 46 },
      { id: 'MCL', name: 'MC', x: 36, y: 46 },
      { id: 'ML', name: 'ML', x: 12, y: 46 },
      { id: 'ST', name: 'ST', x: 50, y: 18 },
    ]
  },
  '3-4-3': {
    id: '3-4-3',
    name: '3-4-3 高压',
    positions: [
      { id: 'GK', name: 'GK', x: 50, y: 90 },
      { id: 'DCR', name: 'DCR', x: 65, y: 74 },
      { id: 'DC', name: 'DC', x: 50, y: 74 },
      { id: 'DCL', name: 'DCL', x: 35, y: 74 },
      { id: 'WBR', name: 'WBR', x: 88, y: 50 },
      { id: 'WBL', name: 'WBL', x: 12, y: 50 },
      { id: 'DMR', name: 'DMR', x: 70, y: 58 },
      { id: 'DML', name: 'DML', x: 30, y: 58 },
      { id: 'AMR', name: 'AMR', x: 78, y: 28 },
      { id: 'AML', name: 'AML', x: 22, y: 28 },
      { id: 'ST', name: 'ST', x: 50, y: 14 },
    ]
  }
};

export const TEAM_TACTIC_PRESETS: Record<string, { formation: string; mentality: string; style: '控球' | '高压反抢' | '反击' | '平衡' }> = {
  // 英超 20
  'man city': { formation: '4-3-3', mentality: 'Positive', style: '控球' },
  'liverpool': { formation: '4-3-3', mentality: 'Positive', style: '高压反抢' },
  'tottenham': { formation: '3-4-3', mentality: 'Positive', style: '反击' },
  'man ufc': { formation: '4-2-3-1', mentality: 'Positive', style: '平衡' },
  'chelsea': { formation: '4-2-3-1', mentality: 'Balanced', style: '控球' },
  'arsenal': { formation: '4-3-3', mentality: 'Positive', style: '高压反抢' },
  'west ham': { formation: '4-2-3-1', mentality: 'Balanced', style: '反击' },
  'aston villa': { formation: '4-4-2', mentality: 'Balanced', style: '反击' },
  'everton': { formation: '4-2-3-1', mentality: 'Balanced', style: '反击' },
  'bournemouth': { formation: '4-2-3-1', mentality: 'Cautious', style: '反击' },
  'newcastle': { formation: '4-3-3', mentality: 'Positive', style: '高压反抢' },
  'leicester': { formation: '4-1-4-1', mentality: 'Balanced', style: '控球' },
  'wolves': { formation: '4-2-3-1', mentality: 'Balanced', style: '反击' },
  'crystal palace': { formation: '4-2-3-1', mentality: 'Balanced', style: '高压反抢' },
  'leeds': { formation: '4-2-3-1', mentality: 'Positive', style: '高压反抢' },
  'fulham': { formation: '4-2-3-1', mentality: 'Balanced', style: '平衡' },
  'southampton': { formation: '4-4-2', mentality: 'Cautious', style: '反击' },
  'nottm forest': { formation: '3-4-3', mentality: 'Cautious', style: '反击' },
  'brighton': { formation: '4-2-3-1', mentality: 'Positive', style: '控球' },
  'brentford': { formation: '3-4-3', mentality: 'Balanced', style: '反击' },
  // 西甲 20
  'barcelona': { formation: '4-3-3', mentality: 'Positive', style: '控球' },
  'r. madrid': { formation: '4-3-3', mentality: 'Positive', style: '控球' },
  'a. madrid': { formation: '4-4-2', mentality: 'Balanced', style: '反击' },
  'sevilla': { formation: '4-3-3', mentality: 'Balanced', style: '控球' },
  'real san sebastián': { formation: '4-3-3', mentality: 'Balanced', style: '控球' },
  'valencia': { formation: '4-4-2', mentality: 'Balanced', style: '反击' },
  'cádiz': { formation: '4-4-2', mentality: 'Cautious', style: '反击' },
  'real hispalis': { formation: '4-2-3-1', mentality: 'Balanced', style: '控球' },
  'a. bilbao': { formation: '4-4-2', mentality: 'Balanced', style: '反击' },
  'getafe': { formation: '3-4-3', mentality: 'Cautious', style: '反击' },
  'villarreal': { formation: '4-4-2', mentality: 'Balanced', style: '控球' },
  'espanyol': { formation: '4-2-3-1', mentality: 'Balanced', style: '平衡' },
  'vallecano': { formation: '4-2-3-1', mentality: 'Balanced', style: '高压反抢' },
  'vigo': { formation: '4-4-2', mentality: 'Balanced', style: '控球' },
  'mallorca': { formation: '3-4-3', mentality: 'Cautious', style: '反击' },
  'valladolid': { formation: '4-3-3', mentality: 'Balanced', style: '平衡' },
  'girona': { formation: '3-4-3', mentality: 'Positive', style: '高压反抢' },
  'atlético pamplona': { formation: '4-4-2', mentality: 'Balanced', style: '反击' },
  'almería': { formation: '4-3-3', mentality: 'Balanced', style: '反击' },
  'elche': { formation: '4-4-2', mentality: 'Cautious', style: '反击' },
};

type SeasonTag = '22_23' | '23_24';

// Map simple style to instruction defaults
export const STYLE_TO_INSTRUCTIONS = (style: '控球' | '高压反抢' | '反击' | '平衡') => {
  switch (style) {
    case '控球':
      return {
        mentality: 'Positive',
        inPossession: { passingDirectness: 35, tempo: 45, width: 60 },
        inTransition: { counterPress: true, counter: true, distributeQuickly: true },
        outOfPossession: { lineOfEngagement: 60, defensiveLine: 60, pressingIntensity: 60 }
      };
    case '高压反抢':
      return {
        mentality: 'Positive',
        inPossession: { passingDirectness: 45, tempo: 60, width: 55 },
        inTransition: { counterPress: true, counter: true, distributeQuickly: true },
        outOfPossession: { lineOfEngagement: 65, defensiveLine: 65, pressingIntensity: 75 }
      };
    case '反击':
      return {
        mentality: 'Cautious',
        inPossession: { passingDirectness: 55, tempo: 45, width: 50 },
        inTransition: { counterPress: false, counter: true, distributeQuickly: true },
        outOfPossession: { lineOfEngagement: 45, defensiveLine: 45, pressingIntensity: 45 }
      };
    default:
      return {
        mentality: 'Balanced',
        inPossession: { passingDirectness: 50, tempo: 50, width: 50 },
        inTransition: { counterPress: true, counter: false, distributeQuickly: false },
        outOfPossession: { lineOfEngagement: 50, defensiveLine: 50, pressingIntensity: 50 }
      };
  }
};

const pickLineupForFormation = (team: Team, formationId: string) => {
  const formation = GUIDED_FORMATIONS[formationId];
  if (!formation) return [];
  const pool = [...team.players];
  const selectBest = (posId: string) => {
    const target = posId.toUpperCase();
    let bestIdx = -1;
    let bestScore = -1;
    pool.forEach((p, idx) => {
      const pos = (p.position || '').toUpperCase();
      let score = 0;
      if (pos.includes(target)) score += 100;
      if (target === 'GK' && pos.includes('GK')) score += 50;
      if (target.startsWith('D') && (pos.includes('D') || pos.includes('WB'))) score += 40;
      if (target.startsWith('M') && (pos.includes('M') || pos.includes('DM') || pos.includes('AM'))) score += 40;
      if ((target === 'ST' || target.startsWith('A')) && (pos.includes('ST') || pos.includes('AM'))) score += 40;
      score += p.ca || 0;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    });
    if (bestIdx === -1) return '';
    const chosen = pool.splice(bestIdx, 1)[0];
    return chosen?.id || '';
  };
  return formation.positions.map(pos => ({
    positionId: pos.id,
    playerId: selectBest(pos.id)
  })).filter(l => l.playerId);
};

export const applyTeamPreset = (team: Team): Team => {
  const key = String(team.name || '').toLowerCase();
  const preset = TEAM_TACTIC_PRESETS[key];
  if (!preset) return team;
  const instr = STYLE_TO_INSTRUCTIONS(preset.style);
  const lineup = team.tactics?.lineup && team.tactics.lineup.length > 0
    ? team.tactics.lineup
    : pickLineupForFormation(team, preset.formation);
  return {
    ...team,
    tactics: {
      formation: preset.formation,
      mentality: preset.mentality,
      instructions: instr,
      lineup
    }
  };
};

// Season presets: hardcoded formations & XI (names). Fallback to CA if not found.
const SEASON_PRESETS: Record<SeasonTag, Record<string, { formation: string; starters: string[] }>> = {
  '22_23': {},
  '23_24': {}
};

export const applySeasonPreset = (team: Team, season: SeasonTag): Team => {
  const preset = SEASON_PRESETS[season][String(team.name || '').toLowerCase()];
  if (!preset) return team;
  const formation = GUIDED_FORMATIONS[preset.formation] ? preset.formation : '4-2-3-1';
  const starters: { positionId: string; playerId: string }[] = [];
  if (team.players?.length) {
    preset.starters.forEach((name, idx) => {
      const p = team.players.find(pl => pl.name.toLowerCase() === name.toLowerCase());
      if (p && formation && formation.positions[idx]) {
        starters.push({ positionId: formation.positions[idx].id, playerId: p.id });
      }
    });
  }
  const finalLineup = starters.length >= 8 ? starters : pickLineupForFormation(team, formation);
  return {
    ...team,
    tactics: {
      ...team.tactics,
      formation,
      lineup: finalLineup
    }
  };
};

