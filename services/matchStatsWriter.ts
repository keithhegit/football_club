import { Team, Fixture } from '../types';

/**
 * Update season stats for players based on a finished fixture.
 * We use simple attribution:
 * - Goals: distribute to random attackers/mids; fallback to any player.
 * - Assists: random teammate (not scorer) if goals > 0.
 * - MoM: best CA player on winning side (fallback scorer).
 * - Rating: simple model 6.5 base + goal *0.4 + assist*0.2; clamp 6.0-10
 */
export const updateSeasonPlayerStats = (
  teams: Team[],
  fixture: Fixture,
  homeGoals: number,
  awayGoals: number
) => {
  const findTeam = (id: string | number) => teams.find(t => String(t.id) === String(id));
  const home = findTeam(fixture.homeTeamId);
  const away = findTeam(fixture.awayTeamId);
  if (!home || !away) return teams;

  const addGoal = (team: Team, goals: number) => {
    for (let i = 0; i < goals; i++) {
      const pool = team.players.filter(p => (p.position || '').includes('F') || (p.position || '').includes('M'));
      const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : team.players[0];
      if (!pick) continue;
      pick.seasonStats = pick.seasonStats || {};
      pick.seasonStats.goals = (pick.seasonStats.goals || 0) + 1;
      // assist
      const mates = team.players.filter(p => p.id !== pick.id);
      const assister = mates[Math.floor(Math.random() * mates.length)];
      if (assister) {
        assister.seasonStats = assister.seasonStats || {};
        assister.seasonStats.assists = (assister.seasonStats.assists || 0) + 1;
      }
    }
  };

  addGoal(home, homeGoals);
  addGoal(away, awayGoals);

  const homeWin = homeGoals > awayGoals;
  const draw = homeGoals === awayGoals;

  const bestCA = (team: Team) => team.players.reduce((a, b) => (b.ca || 0) > (a?.ca || 0) ? b : a, team.players[0]);
  const momCandidate = draw ? null : bestCA(homeWin ? home : away);
  if (momCandidate) {
    momCandidate.seasonStats = momCandidate.seasonStats || {};
    momCandidate.seasonStats.mom = (momCandidate.seasonStats.mom || 0) + 1;
  }

  const applyRating = (team: Team, goals: number) => {
    team.players.forEach(p => {
      const g = p.seasonStats?.goals || 0;
      const a = p.seasonStats?.assists || 0;
      let rating = 6.5 + g * 0.4 + a * 0.2;
      rating = Math.max(6.0, Math.min(10, rating));
      p.seasonStats = p.seasonStats || {};
      // simple rolling average
      const prev = p.seasonStats.averageRating || 0;
      const count = p.seasonStats.appearances || 0;
      const newAvg = ((prev * count) + rating) / (count + 1);
      p.seasonStats.averageRating = Number(newAvg.toFixed(2));
      p.seasonStats.appearances = count + 1;
    });
  };

  applyRating(home, homeGoals);
  applyRating(away, awayGoals);

  return teams;
};

