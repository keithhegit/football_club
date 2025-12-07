import React, { useMemo, useState } from 'react';
import { Team, Fixture } from '../types';
import { ClubLogo } from '../components/ClubLogo';

interface LeagueViewProps {
  teams: Team[];
  fixtures: Fixture[];
  userTeamId: string;
}

export const LeagueView: React.FC<LeagueViewProps> = ({ teams, fixtures, userTeamId }) => {
  const [viewMode, setViewMode] = useState<'TABLE' | 'PLAYERS'>('TABLE');

  const leagueTable = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    });
  }, [teams]);

  const upcoming = useMemo(() => fixtures.filter(f => !f.played), [fixtures]);
  const completed = useMemo(() => fixtures.filter(f => f.played), [fixtures]);

  const teamById = (id: string | number) => teams.find(t => t.id === id);

  const topPlayers = useMemo(() => {
    const all = teams.flatMap(t => (t.players || []).map(p => ({
      id: p.id,
      name: p.name,
      teamId: t.id,
      teamName: t.name,
      goals: p.seasonStats?.goals ?? p.goals ?? 0,
      assists: p.seasonStats?.assists ?? 0,
      mom: p.seasonStats?.mom ?? 0,
      rating: p.seasonStats?.averageRating ?? 0
    })));
    const sorter = (k: 'goals' | 'assists' | 'mom' | 'rating') => [...all].sort((a, b) => (b[k] || 0) - (a[k] || 0)).slice(0, 10);
    return {
      goals: sorter('goals'),
      assists: sorter('assists'),
      mom: sorter('mom'),
      rating: sorter('rating'),
    };
  }, [teams]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-200">League</div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('TABLE')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'TABLE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            积分榜
          </button>
          <button
            onClick={() => setViewMode('PLAYERS')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'PLAYERS' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            球员榜
          </button>
        </div>
      </div>

      {viewMode === 'TABLE' && (
      <>
      {/* League Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 text-sm font-bold text-slate-200">League Table</div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs text-slate-200">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="p-2 text-left w-8">#</th>
                <th className="p-2 text-left">Team</th>
                <th className="p-2 text-center">P</th>
                <th className="p-2 text-center">GF</th>
                <th className="p-2 text-center">GA</th>
                <th className="p-2 text-center">GD</th>
                <th className="p-2 text-center">PTS</th>
              </tr>
            </thead>
            <tbody>
              {leagueTable.map((t, idx) => (
                <tr key={t.id} className={`border-b border-slate-800 ${t.id === userTeamId ? 'bg-emerald-900/20' : ''}`}>
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2 flex items-center gap-2">
                    <div className="w-6 h-6">
                      <ClubLogo clubId={t.id} clubName={t.name} size="md" className="w-6 h-6" />
                    </div>
                    <span className="truncate">{t.name}</span>
                  </td>
                  <td className="p-2 text-center">{t.wins + t.draws + t.losses}</td>
                  <td className="p-2 text-center">{t.goalsFor}</td>
                  <td className="p-2 text-center">{t.goalsAgainst}</td>
                  <td className="p-2 text-center">{t.goalsFor - t.goalsAgainst}</td>
                  <td className="p-2 text-center font-bold text-emerald-400">{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Fixtures */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="px-4 py-3 border-b border-slate-800 text-sm font-bold text-slate-200">Upcoming Fixtures</div>
        <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
          {upcoming.length === 0 && <div className="p-3 text-xs text-slate-500">No upcoming fixtures.</div>}
          {upcoming.map(f => {
            const home = teamById(f.homeTeamId);
            const away = teamById(f.awayTeamId);
            return (
              <div key={f.id} className="p-3 text-xs text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClubLogo clubId={home?.id} clubName={home?.name} size="sm" className="w-5 h-5" />
                  <span>{home?.name}</span>
                  <span className="text-slate-500">vs</span>
                  <span>{away?.name}</span>
                  <ClubLogo clubId={away?.id} clubName={away?.name} size="sm" className="w-5 h-5" />
                </div>
                <span className="text-slate-500">Wk {f.week}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Results */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="px-4 py-3 border-b border-slate-800 text-sm font-bold text-slate-200">Results</div>
        <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
          {completed.length === 0 && <div className="p-3 text-xs text-slate-500">No results yet.</div>}
          {completed.slice(-20).reverse().map(f => {
            const home = teamById(f.homeTeamId);
            const away = teamById(f.awayTeamId);
            return (
              <div key={f.id} className="p-3 text-xs text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClubLogo clubId={home?.id} clubName={home?.name} size="sm" className="w-5 h-5" />
                  <span>{home?.name}</span>
                  <span className="font-bold text-white">{f.homeScore}</span>
                  <span className="text-slate-500">-</span>
                  <span className="font-bold text-white">{f.awayScore}</span>
                  <span>{away?.name}</span>
                  <ClubLogo clubId={away?.id} clubName={away?.name} size="sm" className="w-5 h-5" />
                </div>
                <span className="text-slate-500">Wk {f.week}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Fixtures */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="px-4 py-3 border-b border-slate-800 text-sm font-bold text-slate-200">Upcoming Fixtures</div>
        <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
          {upcoming.length === 0 && <div className="p-3 text-xs text-slate-500">No upcoming fixtures.</div>}
          {upcoming.map(f => {
            const home = teamById(f.homeTeamId);
            const away = teamById(f.awayTeamId);
            return (
              <div key={f.id} className="p-3 text-xs text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClubLogo clubId={home?.id} clubName={home?.name} size="sm" className="w-5 h-5" />
                  <span>{home?.name}</span>
                  <span className="text-slate-500">vs</span>
                  <span>{away?.name}</span>
                  <ClubLogo clubId={away?.id} clubName={away?.name} size="sm" className="w-5 h-5" />
                </div>
                <span className="text-slate-500">Wk {f.week}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Results */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="px-4 py-3 border-b border-slate-800 text-sm font-bold text-slate-200">Results</div>
        <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
          {completed.length === 0 && <div className="p-3 text-xs text-slate-500">No results yet.</div>}
          {completed.slice(-20).reverse().map(f => {
            const home = teamById(f.homeTeamId);
            const away = teamById(f.awayTeamId);
            return (
              <div key={f.id} className="p-3 text-xs text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClubLogo clubId={home?.id} clubName={home?.name} size="sm" className="w-5 h-5" />
                  <span>{home?.name}</span>
                  <span className="font-bold text-white">{f.homeScore}</span>
                  <span className="text-slate-500">-</span>
                  <span className="font-bold text-white">{f.awayScore}</span>
                  <span>{away?.name}</span>
                  <ClubLogo clubId={away?.id} clubName={away?.name} size="sm" className="w-5 h-5" />
                </div>
                <span className="text-slate-500">Wk {f.week}</span>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      {viewMode === 'PLAYERS' && (
        <div className="grid grid-cols-1 gap-4">
          {[{ key: 'goals', label: '射手榜 (进球)' }, { key: 'assists', label: '助攻榜' }, { key: 'mom', label: 'MVP (MoM)' }, { key: 'rating', label: '场均评分' }].map(section => (
            <div key={section.key} className="bg-slate-900 rounded-xl border border-slate-800">
              <div className="px-4 py-3 border-b border-slate-800 text-sm font-bold text-slate-200">{section.label}</div>
              <div className="divide-y divide-slate-800">
                {(topPlayers as any)[section.key].map((p: any, idx: number) => (
                  <div key={p.id} className="p-3 text-xs text-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-slate-500">{idx + 1}</span>
                      <span className="font-bold truncate max-w-[140px]">{p.name}</span>
                      <span className="text-slate-500 truncate max-w-[120px]">{p.teamName}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">
                      {section.key === 'rating' ? (p.rating || 0).toFixed(2) : p[section.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

