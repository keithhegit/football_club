

import React, { useState, useMemo, useEffect } from 'react';
import { Shirt } from 'lucide-react';
import { Layout } from './components/Layout';
import { GameState, Team, Fixture, MatchState, Manager, Player } from './types';
import { Dashboard } from './views/Dashboard';
import { PlayerProfileCard } from './components/PlayerProfileCard';
import { MatchView } from './views/MatchView';
import { TacticsView } from './views/TacticsView';
import { PlayerSearchView } from './components/PlayerSearchView';
import { SquadView } from './views/SquadView';
import { MainMenu } from './views/MainMenu';
import { ManagerCreation, ManagerData } from './views/ManagerCreation';
import { ClubSelection } from './views/ClubSelection';
import { useGameInit } from './hooks/useGameInit';
import { useI18n } from './hooks/useI18n';
import { Club } from './services/api';
import { ClubLogo } from './components/ClubLogo';
import { authService, User } from './services/auth';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { LoadGameView } from './views/LoadGameView';
import { saveService } from './services/save';
import { TrainingView } from './views/TrainingView';

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
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [selectedClubId, setSelectedClubId] = useState<number | undefined>(undefined);
  const [managerData, setManagerData] = useState<Manager | undefined>(undefined);
  const { loading, error, userTeam: initialUserTeam, allTeams: initialTeams } = useGameInit(selectedClubId);

  const [gameState, setGameState] = useState<GameState | null>({
    currentWeek: 1,
    userTeamId: '',
    teams: [],
    fixtures: [],
    currentView: 'MAIN_MENU',
    activeMatchId: null,
    manager: undefined
  });

  // Initialize game state once data is loaded after club selection
  useEffect(() => {
    if (!loading && !error && initialUserTeam && initialTeams.length > 0 && managerData) {
      setGameState({
        currentWeek: 1,
        userTeamId: initialUserTeam.id,
        teams: initialTeams,
        fixtures: generateSeasonFixtures(initialTeams),
        currentView: 'DASHBOARD',
        activeMatchId: null,
        manager: managerData
      });
    }
  }, [loading, error, initialUserTeam, initialTeams, managerData]);

  // Startup flow handlers
  const handleNewGame = () => {
    setGameState(prev => prev ? { ...prev, currentView: 'MANAGER_CREATION' } : null);
  };

  const handleLoadGame = () => {
    setGameState(prev => prev ? { ...prev, currentView: 'LOAD_GAME' } : null);
  };

  const handleGameLoaded = (loadedState: GameState) => {
    setGameState(loadedState);
  };

  const handleManagerCreated = (manager: ManagerData) => {
    setManagerData(manager);
    setGameState(prev => prev ? { ...prev, currentView: 'CLUB_SELECTION', manager } : null);
  };

  const handleClubSelected = (club: Club) => {
    setSelectedClubId(club.id);
    // Game state will update automatically when useGameInit loads the club data
  };

  const userTeam = gameState?.teams.find(t => t.id === gameState?.userTeamId);

  // Computed State
  const nextFixture = useMemo(() => {
    if (!gameState) return undefined;
    return gameState.fixtures.find(f => !f.played && (f.homeTeamId === gameState.userTeamId || f.awayTeamId === gameState.userTeamId));
  }, [gameState]);

  const opponent = useMemo(() => {
    if (!nextFixture || !gameState) return undefined;
    const oppId = nextFixture.homeTeamId === gameState.userTeamId ? nextFixture.awayTeamId : nextFixture.homeTeamId;
    return gameState.teams.find(t => t.id === oppId);
  }, [nextFixture, gameState]);

  const leagueTable = useMemo(() => {
    if (!gameState) return [];
    return [...gameState.teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
  }, [gameState]);

  const userLeaguePos = gameState ? leagueTable.findIndex(t => t.id === gameState.userTeamId) + 1 : 0;

  // Actions
  const handleMatchComplete = (homeScore: number, awayScore: number) => {
    if (!nextFixture || !gameState) return;

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

  const handleTransferComplete = (player: Player, fee: number) => {
    if (!gameState) return;

    console.log(`Transfer complete: ${player.name} for £${fee.toLocaleString()}`);

    setGameState(prev => {
      if (!prev) return null;

      // Find user team and update it
      const updatedTeams = prev.teams.map(team => {
        if (team.id === prev.userTeamId) {
          // Add player to squad and deduct budget
          return {
            ...team,
            players: [...team.players, player],
            budget: (team.budget || 50000000) - fee
          };
        }
        return team;
      });

      return {
        ...prev,
        teams: updatedTeams
      };
    });
  };

  const startMatch = () => {
    if (nextFixture && gameState) {
      setGameState(prev => prev ? { ...prev, currentView: 'MATCH', activeMatchId: nextFixture.id } : null);
    }
  };

  // Loading and error states (only show during club data loading, not for initial menu)
  if (loading && selectedClubId !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (error && selectedClubId !== undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-100 p-4">
        <div className="text-red-400 text-lg mb-2">{t('common.error')}</div>
        <div className="text-slate-400 text-sm text-center">{error}</div>
      </div>
    );
  }

  // Auth Handlers
  const handleLoginSuccess = () => {
    setUser(authService.getUser());
    setGameState(prev => prev ? { ...prev, currentView: 'MAIN_MENU' } : null);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setGameState(prev => prev ? { ...prev, currentView: 'MAIN_MENU' } : null);
  };

  const handleSaveGame = async (name: string) => {
    if (!gameState) throw new Error('No game state to save');
    await saveService.saveGame(name, gameState);
  };

  // Render Logic
  if (!gameState) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  // Auth Views
  if (gameState.currentView === 'LOGIN') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setGameState({ ...gameState, currentView: 'REGISTER' })}
      />
    );
  }

  if (gameState.currentView === 'REGISTER') {
    return (
      <RegisterView
        onRegisterSuccess={handleLoginSuccess}
        onSwitchToLogin={() => setGameState({ ...gameState, currentView: 'LOGIN' })}
      />
    );
  }

  if (gameState.currentView === 'LOAD_GAME') {
    return <LoadGameView onBack={() => setGameState({ ...gameState, currentView: 'MAIN_MENU' })} onLoad={handleGameLoaded} />;
  }

  // Startup flow views
  if (gameState.currentView === 'MAIN_MENU') {
    return (
      <MainMenu
        onNewGame={handleNewGame}
        onLoadGame={handleLoadGame}
        user={user}
        onLogin={() => setGameState({ ...gameState, currentView: 'LOGIN' })}
        onRegister={() => setGameState({ ...gameState, currentView: 'REGISTER' })}
        onLogout={handleLogout}
      />
    );
  }

  if (gameState?.currentView === 'MANAGER_CREATION') {
    return <ManagerCreation onNext={handleManagerCreated} />;
  }

  if (gameState?.currentView === 'CLUB_SELECTION') {
    return <ClubSelection onConfirm={handleClubSelected} />;
  }

  if (!gameState || !userTeam) {
    return <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-100">{t('common.loading')}</div>;
  }

  // ... (imports)

  // ... (inside App component)

  // Views
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

  if (gameState.currentView === 'TRAINING') {
    return (
      <Layout
        currentView={gameState.currentView}
        onChangeView={(view) => setGameState(prev => prev ? { ...prev, currentView: view } : null)}
        teamName={userTeam.name}
        onSaveGame={user ? handleSaveGame : undefined}
      >
        <TrainingView team={userTeam} />
      </Layout>
    );
  }

  return (
    <Layout
      currentView={gameState.currentView}
      onChangeView={(view) => setGameState(prev => prev ? { ...prev, currentView: view } : null)}
      teamName={userTeam.name}
      onSaveGame={user ? handleSaveGame : undefined}
      onTransferComplete={handleTransferComplete}
      userTeam={userTeam}
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
        <SquadView team={userTeam} />
      )}

      {gameState.currentView === 'LEAGUE' && (
        <div className="overflow-y-auto h-full p-4">
          <h2 className="text-2xl font-bold mb-4 text-slate-100">League Table</h2>
          <div className="bg-slate-900 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Pos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Team</th>
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
                      <div className="flex items-center gap-2">
                        <ClubLogo clubId={team.id} clubName={team.name} size="sm" />
                        <span className="md:hidden">{team.shortName}</span>
                        <span className="hidden md:inline">{team.name}</span>
                      </div>
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

      {gameState.currentView === 'SEARCH' && (
        <PlayerSearchView />
      )}

      {gameState.currentView === 'TACTICS' && (
        <TacticsView team={userTeam} />
      )}

    </Layout>
  );
};

export default App;
