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
  // 英超（示例，可扩充到西甲20队）
  't_arsenal': { formation: '4-3-3', mentality: 'Positive', style: '高压反抢' },
  't_manufc': { formation: '4-2-3-1', mentality: 'Positive', style: '平衡' },
  't_mancity': { formation: '4-3-3', mentality: 'Positive', style: '控球' },
  't_liverpool': { formation: '4-3-3', mentality: 'Positive', style: '高压反抢' },
  't_chelsea': { formation: '4-2-3-1', mentality: 'Balanced', style: '控球' },
  't_tottenham': { formation: '4-2-3-1', mentality: 'Positive', style: '反击' },
  't_newcastle': { formation: '4-3-3', mentality: 'Positive', style: '高压反抢' },
  't_astonvilla': { formation: '4-4-2', mentality: 'Balanced', style: '反击' },
  't_brighton': { formation: '4-2-3-1', mentality: 'Positive', style: '控球' },
  't_westham': { formation: '4-2-3-1', mentality: 'Balanced', style: '反击' },
  // …其余英超与西甲队伍可依 FM23 风格补齐
};

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

export const applyTeamPreset = (team: Team): Team => {
  const preset = TEAM_TACTIC_PRESETS[String(team.id)];
  if (!preset) return team;
  const instr = STYLE_TO_INSTRUCTIONS(preset.style);
  return {
    ...team,
    tactics: {
      formation: preset.formation,
      mentality: preset.mentality,
      instructions: instr,
      lineup: team.tactics?.lineup || []
    }
  };
};

