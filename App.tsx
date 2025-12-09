

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
import { MatchEngineTest } from './views/MatchEngineTest';
import { LiveMatchPlayer } from './views/LiveMatchPlayer';
import { UnifiedMatchTest } from './views/UnifiedMatchTest';
import { LeagueView } from './views/LeagueView';
import { applyTeamPreset, applySeasonPreset } from './utils/tacticsPresets';
import { updateSeasonPlayerStats } from './services/matchStatsWriter';
import { BgmToggle } from './components/BgmToggle';

// Helper to generate a season fixture list (Double Round Robin) using circle method with proper week buckets
const generateSeasonFixtures = (teams: Team[]): Fixture[] => {
  const teamIds = [...teams.map(t => t.id)];
  // If odd number, add a bye (undefined) so algorithm works
  if (teamIds.length % 2 === 1) {
    teamIds.push(-1 as any); // sentinel for bye
  }
  const n = teamIds.length;
  const roundsPerLeg = n - 1;
  const weeksTotal = roundsPerLeg * 2;
  const fixtures: Fixture[] = [];

  // Prepare arrays for rotation (circle method)
  const fixed = teamIds[0];
  let rotating = teamIds.slice(1);

  const makeRound = (round: number, offset: number, reverseHomeAway: boolean) => {
    const pairs: [number, number][] = [];
    const half = rotating.length / 2;
    for (let i = 0; i < half; i++) {
      const home = rotating[i];
      const away = rotating[rotating.length - 1 - i];
      pairs.push([home, away]);
    }
    pairs.unshift([fixed, rotating[0]]); // fixed team vs first

    pairs.forEach((pair, idx) => {
      const [h, a] = reverseHomeAway ? [pair[1], pair[0]] : [pair[0], pair[1]];
      if (h === -1 || a === -1) return; // skip bye
      fixtures.push({
        id: `f_${round}_${idx}_${offset}`,
        homeTeamId: h,
        awayTeamId: a,
        played: false,
        homeScore: 0,
        awayScore: 0,
        week: round
      });
    });
  };

  // First leg
  for (let r = 0; r < roundsPerLeg; r++) {
    makeRound(r + 1, 0, false);
    // rotate
    rotating = [rotating[0], ...rotating.slice(2), rotating[1]];
  }
  // Second leg (swap home/away)
  rotating = teamIds.slice(1);
  for (let r = 0; r < roundsPerLeg; r++) {
    makeRound(roundsPerLeg + r + 1, 1, true);
    rotating = [rotating[0], ...rotating.slice(2), rotating[1]];
  }

  return fixtures;
};

// bump cache key to regenerate new week structure
const FIXTURE_CACHE_KEY = 'fm2023_fixtures_cache_v2';

const loadCachedFixtures = (): Fixture[] | null => {
  try {
    const raw = localStorage.getItem(FIXTURE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const persistFixtures = (fixtures: Fixture[]) => {
  try {
    localStorage.setItem(FIXTURE_CACHE_KEY, JSON.stringify(fixtures));
  } catch {
    /* ignore */
  }
};

const App: React.FC = () => {
  // Check for test mode via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get('test');
  const isTestMode = testMode === 'match';
  const isLiveMode = testMode === 'live';
  const isUnifiedMode = testMode === 'unified';

  // Unified test page (combines Live + Match + Stats)
  if (isUnifiedMode) {
    return <UnifiedMatchTest />;
  }

  // Separate test pages (legacy)
  if (isLiveMode) {
    return <LiveMatchPlayer />;
  }

  if (isTestMode) {
    return <MatchEngineTest />;
  }

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
  const [bgmUnlocked, setBgmUnlocked] = useState<boolean>(false);
  const [bgmUnlockKey, setBgmUnlockKey] = useState<number>(0);

  const seedInjuries = (teams: Team[], currentWeek: number) => {
    return teams.map(team => {
      const isManUtd = team.name.toLowerCase().includes('man') && team.name.toLowerCase().includes('u');
      const players = team.players.map(p => {
        if (isManUtd && p.name.toLowerCase().includes('ronaldo')) {
          return { ...p, injured: true, injuryUntilWeek: currentWeek + 4 };
        }
        return p;
      });
      return { ...team, players };
    });
  };

  const recoverPlayers = (teams: Team[], currentWeek: number) => {
    return teams.map(team => ({
      ...team,
      players: team.players.map(p => {
        if (p.injured && p.injuryUntilWeek && currentWeek >= p.injuryUntilWeek) {
          return { ...p, injured: false, condition: Math.max(p.condition, 85) };
        }
        return p;
      })
    }));
  };

  // Initialize game state once data is loaded after club selection
  // Initialize game state once data is loaded after club selection
  useEffect(() => {
    if (!loading && !error && initialUserTeam && initialTeams.length > 0 && managerData && user) {
      // Load cached fixtures if any, else generate then cache
      const cached = loadCachedFixtures();
      const fixtures = cached && cached.length > 0 ? cached : generateSeasonFixtures(initialTeams);
      if (!cached || cached.length === 0) persistFixtures(fixtures);

      const seasonTag: '22_23' = '22_23'; // 固定首赛季 22-23
      const teamsWithPreset = initialTeams.map(t => applySeasonPreset(t, seasonTag));
      const teamsWithInjuries = seedInjuries(teamsWithPreset.map(t => applyTeamPreset(t)), 1);

      const newGameState: GameState = {
        currentWeek: 1,
        userTeamId: initialUserTeam.id,
        teams: teamsWithInjuries,
        fixtures,
        currentView: 'DASHBOARD',
        activeMatchId: null,
        manager: managerData
      };

      setGameState(newGameState);

      // Auto-save the new game immediately
      const saveName = `${managerData.name} - ${initialUserTeam.name}`;
      saveService.saveGame(saveName, newGameState).then(() => {
        console.log('New game auto-saved:', saveName);
      }).catch(err => {
        console.error('Failed to auto-save new game:', err);
      });
    }
  }, [loading, error, initialUserTeam, initialTeams, managerData, user]);

  // Startup flow handlers
  // Startup flow handlers
  const handleNewGame = () => {
    if (!user) {
      setGameState(prev => prev ? { ...prev, currentView: 'LOGIN' } : null);
      return;
    }
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

  const handleSaveTactics = (tacticsPayload: any) => {
    if (!gameState || !userTeam) return;
    const updatedTeams = gameState.teams.map(t => {
      if (t.id === userTeam.id) {
        return {
          ...t,
          tactics: {
            ...t.tactics,
            formation: tacticsPayload.formation,
            instructions: tacticsPayload.instructions,
            lineup: tacticsPayload.lineup
          }
        };
      }
      return t;
    });
    setGameState({ ...gameState, teams: updatedTeams });
    // Persist to save slot if desired (skip auto-save for now)
  };

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

  const simulateQuickResult = (home: any, away: any) => {
    const homeCA = home.players.reduce((s: number, p: any) => s + (p.ca || 100), 0) / home.players.length;
    const awayCA = away.players.reduce((s: number, p: any) => s + (p.ca || 100), 0) / away.players.length;
    const diff = (homeCA - awayCA) / 20; // scale
    const baseHome = 1.1 + diff * 0.3;
    const baseAway = 1.1 - diff * 0.3;
    const clampScore = (v: number) => Math.max(0, Math.min(4, Math.round(v + Math.random() * 1.2)));
    const homeGoals = clampScore(baseHome);
    const awayGoals = clampScore(baseAway);
    return { homeGoals, awayGoals };
  };

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
    let updatedTeams = gameState.teams.map(team => {
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

    const newState = {
      ...gameState,
      fixtures: updatedFixtures,
      teams: updatedTeams,
      currentView: 'DASHBOARD',
      activeMatchId: null
    };

    // 更新本场球员季统计
    updatedTeams = updateSeasonPlayerStats(updatedTeams, nextFixture, homeScore, awayScore);

    // Auto-simulate other fixtures in same week
    const currentWeek = nextFixture.week;
    const otherFixtures = newState.fixtures.filter(f => !f.played && f.week === currentWeek);
    let teamsAfterSim = [...newState.teams];
    const fixturesAfterSim = newState.fixtures.map(f => ({ ...f }));

    otherFixtures.forEach(fx => {
      const home = teamsAfterSim.find(t => t.id === fx.homeTeamId);
      const away = teamsAfterSim.find(t => t.id === fx.awayTeamId);
      if (!home || !away) return;
      const { homeGoals, awayGoals } = simulateQuickResult(home, away);
      fx.played = true;
      fx.homeScore = homeGoals;
      fx.awayScore = awayGoals;
      fixturesAfterSim[fixturesAfterSim.findIndex(ff => ff.id === fx.id)] = fx;
      teamsAfterSim = teamsAfterSim.map(t => {
        if (t.id === home.id) {
          return {
            ...t,
            goalsFor: t.goalsFor + homeGoals,
            goalsAgainst: t.goalsAgainst + awayGoals,
            points: t.points + (homeGoals > awayGoals ? 3 : homeGoals === awayGoals ? 1 : 0),
            wins: t.wins + (homeGoals > awayGoals ? 1 : 0),
            draws: t.draws + (homeGoals === awayGoals ? 1 : 0),
            losses: t.losses + (homeGoals < awayGoals ? 1 : 0)
          };
        }
        if (t.id === away.id) {
          return {
            ...t,
            goalsFor: t.goalsFor + awayGoals,
            goalsAgainst: t.goalsAgainst + homeGoals,
            points: t.points + (awayGoals > homeGoals ? 3 : awayGoals === homeGoals ? 1 : 0),
            wins: t.wins + (awayGoals > homeGoals ? 1 : 0),
            draws: t.draws + (awayGoals === homeGoals ? 1 : 0),
            losses: t.losses + (awayGoals < homeGoals ? 1 : 0)
          };
        }
        return t;
      });
      // update season stats for auto-sim match
      teamsAfterSim = updateSeasonPlayerStats(teamsAfterSim, fx, homeGoals, awayGoals);
    });

    const advancedWeek = Math.max(currentWeek + 1, newState.currentWeek);
    const recoveredTeams = recoverPlayers(teamsAfterSim, advancedWeek);
    const finalState = {
      ...newState,
      fixtures: fixturesAfterSim,
      teams: recoveredTeams,
      currentWeek: advancedWeek
    };

    setGameState(finalState);
    // Persist result (ignore errors for now)
    persistFixtures(fixturesAfterSim);
    saveService.saveGame(`${gameState.manager?.name || 'Save'} - ${userTeam?.name || ''}`, finalState).catch(() => {});
  };

  const handleTransferComplete = (player: Player, fee: number, wage: number) => {
    if (!gameState) {
      console.error('[Transfer] No game state available');
      return;
    }

    console.log('=== TRANSFER STARTING ===');
    console.log('[Transfer] Player:', player.name, '(ID:', player.id, ')');
    console.log('[Transfer] Fee: £', fee.toLocaleString());
    console.log('[Transfer] User Team ID:', gameState.userTeamId);

    setGameState(prev => {
      if (!prev) {
        console.error('[Transfer] Previous state is null');
        return null;
      }

      // Find user team
      const userTeam = prev.teams.find(t => t.id === prev.userTeamId);
      if (!userTeam) {
        console.error('[Transfer] ERROR: User team not found! ID:', prev.userTeamId);
        return prev; // Return unchanged state
      }

      // CRITICAL: Check if player already in squad (prevents double purchase)
      const alreadyInSquad = userTeam.players.some(p => p.id === player.id);
      if (alreadyInSquad) {
        console.warn('[Transfer] ⚠️ Player already in squad! Preventing duplicate.');
        return prev; // Return unchanged state
      }

      const feeDelta = fee || 0;
      const wageDelta = wage || 0;

      console.log('[Transfer] ✓ Validation passed');
      console.log('[Transfer] Current squad size:', userTeam.players.length);
      console.log('[Transfer] Current budgets => balance:', userTeam.balance, 'transferBudget:', userTeam.transferBudget, 'legacy budget:', userTeam.budget, 'wageSpending:', userTeam.wageSpending);

      // Create updated teams array
      const updatedTeams = prev.teams.map(team => {
        if (team.id === prev.userTeamId) {
          const newPlayers = [...team.players, player];

          const nextTransferBudget = team.transferBudget !== undefined
            ? Math.max(0, (team.transferBudget || 0) - feeDelta)
            : undefined;
          const nextBalance = team.balance !== undefined
            ? Math.max(0, (team.balance || 0) - feeDelta)
            : undefined;
          const nextLegacyBudget = team.transferBudget === undefined
            ? (team.budget || 0) - feeDelta
            : team.budget;
          const nextWageSpending = team.wageSpending !== undefined
            ? (team.wageSpending || 0) + wageDelta
            : (wageDelta > 0 ? wageDelta : team.wageSpending);

          console.log('[Transfer] ➜ New squad size:', newPlayers.length);
          console.log('[Transfer] ➜ Budgets after deal => balance:', nextBalance, 'transferBudget:', nextTransferBudget, 'legacy budget:', nextLegacyBudget, 'wageSpending:', nextWageSpending);

          return {
            ...team,
            players: newPlayers,
            budget: nextLegacyBudget,
            transferBudget: nextTransferBudget ?? team.transferBudget,
            balance: nextBalance ?? team.balance,
            wageSpending: nextWageSpending ?? team.wageSpending,
          };
        }
        return team;
      });

      console.log('=== TRANSFER COMPLETE ✅ ===');

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
  const NonMatchBgm = () => (
    <div className="fixed top-3 right-3 z-50">
      <BgmToggle src="https://bgmr2.keithhe.com/bgm/fm/Blur_Song_2_FIFA_98_com.mp3" unlockKey={bgmUnlockKey} />
    </div>
  );

  // Global BGM unlock gate (appears before任何页面)
  if (!bgmUnlocked) {
    return (
      <div
        className="relative h-screen w-screen bg-slate-950 flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/fmui/cup_98FM.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
        <button
          onClick={() => {
            setBgmUnlocked(true);
            setBgmUnlockKey(k => k + 1);
          }}
          className="relative z-10 px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl shadow-xl transition transform hover:-translate-y-0.5 active:scale-98 flex items-center gap-2"
          aria-label="足球滚动"
        >
          <span className="animate-bounce">⚽</span>
          <span>足球滚动</span>
        </button>
      </div>
    );
  }

  if (!gameState) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  // Auth Views
  if (gameState.currentView === 'LOGIN') {
    return (
      <div className="relative">
        <NonMatchBgm />
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setGameState({ ...gameState, currentView: 'REGISTER' })}
        />
      </div>
    );
  }

  if (gameState.currentView === 'REGISTER') {
    return (
      <div className="relative">
        <NonMatchBgm />
        <RegisterView
          onRegisterSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setGameState({ ...gameState, currentView: 'LOGIN' })}
        />
      </div>
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
    return (
      <div className="relative">
        <NonMatchBgm />
        <ManagerCreation onNext={handleManagerCreated} />
      </div>
    );
  }

  if (gameState?.currentView === 'CLUB_SELECTION') {
    return (
      <div className="relative">
        <NonMatchBgm />
        <ClubSelection onConfirm={handleClubSelected} />
      </div>
    );
  }

  if (!gameState || !userTeam) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-slate-950 text-slate-100">
        {bgmUnlocked && <NonMatchBgm />}
        {t('common.loading')}
      </div>
    );
  }

  // Views
  if (gameState.currentView === 'MATCH' && nextFixture && opponent) {
    return (
      <MatchView
        homeTeam={nextFixture.homeTeamId === userTeam.id ? userTeam : opponent}
        awayTeam={nextFixture.awayTeamId === userTeam.id ? userTeam : opponent}
        userTeamId={userTeam.id}
        onMatchComplete={handleMatchComplete}
        fixtureId={nextFixture.id}
        bgmUnlockKey={bgmUnlockKey}
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
      bgmUnlockKey={bgmUnlockKey}
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
        <SquadView team={userTeam} currentWeek={gameState.currentWeek} />
      )}

      {gameState.currentView === 'SEARCH' && (
        <PlayerSearchView />
      )}

      {gameState.currentView === 'TACTICS' && userTeam && (
        <TacticsView team={userTeam} onSave={handleSaveTactics} currentWeek={gameState.currentWeek} />
      )}

      {gameState.currentView === 'LEAGUE' && gameState && userTeam && (
        <LeagueView teams={gameState.teams} fixtures={gameState.fixtures} userTeamId={userTeam.id} />
      )}

    </Layout>
  );
};

export default App;
