
import React, { useState, useMemo } from 'react';
import { Shirt } from 'lucide-react';
import { Layout } from './components/Layout';
import { INITIAL_TEAMS } from './utils/generators';
import { GameState, Team, Fixture, MatchState } from './types';
import { Dashboard } from './views/Dashboard';
import { PlayerProfileCard } from './components/PlayerProfileCard';
import { MatchView } from './views/MatchView';
import { TacticsView } from './views/TacticsView';

// Helper to generate a season fixture list (Double Round Robin)
const generateSeasonFixtures = (teams: Team[]): Fixture[] => {
  const fixtures: Fixture[] = [];
  const teamIds = teams.map(t => t.id);
  let week = 1;

  // Simple round robin generation logic (simplified for brevity)
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      fixtures.push({
        id: `f_${week}_${i}_${j}`,
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
        played: false,
        homeScore: 0,
        awayScore: 0,
        week: week
      });
      week++;
    }
  }
  return fixtures;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentWeek: 1,
    userTeamId: "t1", // London Blue (Chelsea)
    teams: INITIAL_TEAMS,
    fixtures: generateSeasonFixtures(INITIAL_TEAMS),
    currentView: 'DASHBOARD',
    activeMatchId: null
  });

  const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);
  
  // Computed State
  const nextFixture = useMemo(() => {
    return gameState.fixtures.find(f => !f.played && (f.homeTeamId === gameState.userTeamId || f.awayTeamId === gameState.userTeamId));
  }, [gameState.fixtures, gameState.userTeamId]);

  const opponent = useMemo(() => {
    if (!nextFixture) return undefined;
    const oppId = nextFixture.homeTeamId === gameState.userTeamId ? nextFixture.awayTeamId : nextFixture.homeTeamId;
    return gameState.teams.find(t => t.id === oppId);
  }, [nextFixture, gameState.teams]);

  const leagueTable = useMemo(() => {
    return [...gameState.teams].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
  }, [gameState.teams]);
  
  const userLeaguePos = leagueTable.findIndex(t => t.id === gameState.userTeamId) + 1;

  // Actions
  const handleMatchComplete = (homeScore: number, awayScore: number) => {
    if (!nextFixture) return;

    // Update Fixture
    const updatedFixtures = gameState.fixtures.map(f => {
        if (f.id === nextFixture.id) {
            return { ...f, played: true, homeScore, awayScore };
        }
        return f;
    });

    // Update Teams (Points, Goals)
    const updatedTeams = gameState.teams.map(team => {
        if (team.id === nextFixture.homeTeamId) {
            return {
                ...team,
                goalsFor: team.goalsFor + homeScore,
                goalsAgainst: team.goalsAgainst + awayScore,
                points: team.points + (homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0),
                wins: team.wins + (homeScore > awayScore ? 1 : 0),
                draws: team.draws + (homeScore === awayScore ? 1 : 0),
                losses: team.losses + (homeScore < awayScore ? 1 : 0)
            };
        }
        if (team.id === nextFixture.awayTeamId) {
            return {
                ...team,
                goalsFor: team.goalsFor + awayScore,
                goalsAgainst: team.goalsAgainst + homeScore,
                points: team.points + (awayScore > homeScore ? 3 : awayScore === homeScore ? 1 : 0),
                wins: team.wins + (awayScore > homeScore ? 1 : 0),
                draws: team.draws + (awayScore === homeScore ? 1 : 0),
                losses: team.losses + (awayScore < homeScore ? 1 : 0)
            };
        }
        return team;
    });

    setGameState({
        ...gameState,
        fixtures: updatedFixtures,
        teams: updatedTeams,
        currentView: 'DASHBOARD',
        activeMatchId: null
    });
  };

  const startMatch = () => {
    if (nextFixture) {
        setGameState(prev => ({ ...prev, currentView: 'MATCH', activeMatchId: nextFixture.id }));
    }
  };

  // Views
  if (!userTeam) return <div>Loading...</div>;

  if (gameState.currentView === 'MATCH' && nextFixture && opponent) {
      return (
          <MatchView 
            homeTeam={nextFixture.homeTeamId === userTeam.id ? userTeam : opponent}
            awayTeam={nextFixture.awayTeamId === userTeam.id ? userTeam : opponent}
            userTeamId={userTeam.id}
            onMatchComplete={handleMatchComplete}
          />
      );
  }

  return (
    <Layout 
        currentView={gameState.currentView} 
        onChangeView={(view) => setGameState(prev => ({ ...prev, currentView: view }))}
        teamName={userTeam.name}
    >
      
      {gameState.currentView === 'DASHBOARD' && (
        <Dashboard 
            team={userTeam}
            opponent={opponent}
            nextFixture={nextFixture}
            leaguePosition={userLeaguePos}
            onContinue={startMatch}
        />
      )}

      {gameState.currentView === 'SQUAD' && (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-slate-100 mb-2">First Team Squad</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userTeam.players.map(player => (
                    <PlayerProfileCard key={player.id} player={player} />
                ))}
            </div>
        </div>
      )}

      {gameState.currentView === 'LEAGUE' && (
          <div className="p-2">
            <h2 className="text-xl font-bold text-slate-100 mb-4 px-2">League Table</h2>
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400">
                        <tr>
                            <th className="p-3 font-semibold">Pos</th>
                            <th className="p-3 font-semibold">Team</th>
                            <th className="p-3 font-semibold text-center">P</th>
                            <th className="p-3 font-semibold text-center">GD</th>
                            <th className="p-3 font-semibold text-center text-white">Pts</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {leagueTable.map((team, idx) => (
                            <tr key={team.id} className={team.id === userTeam.id ? 'bg-slate-800/50' : ''}>
                                <td className={`p-3 font-mono ${idx < 4 ? 'text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-500'}`}>{idx + 1}</td>
                                <td className="p-3 font-medium text-slate-200">
                                    <span className="md:hidden">{team.shortName}</span>
                                    <span className="hidden md:inline">{team.name}</span>
                                </td>
                                <td className="p-3 text-center text-slate-400">{team.wins + team.draws + team.losses}</td>
                                <td className="p-3 text-center text-slate-400">{team.goalsFor - team.goalsAgainst}</td>
                                <td className="p-3 text-center font-bold text-white">{team.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      )}
      
      {gameState.currentView === 'TACTICS' && (
          <TacticsView team={userTeam} />
      )}

    </Layout>
  );
};

export default App;
