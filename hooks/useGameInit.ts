import { useState, useEffect } from 'react';
import api, { Club } from '../services/api';
import { Team, Player, Position, HiddenAttributes } from '../types';
import { Player as ApiPlayer } from '../services/api';
import { gameInitializer } from '../services/gameInitializer';
import { getFromStore, getAllFromStore, getTeamPlayers } from '../utils/localDB';
import { convertPlayersToState, getStartingXI } from '../utils/playerConverter';
import { TeamState, PlayerState } from '../engine/types';

const MATCH_BGM_URL = 'https://bgmr2.keithhe.com/bgm/fm/Chumbawamb_Tubthumping_com.mp3';

const preloadAudio = (url: string) => {
    try {
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        audio.load();
    } catch (err) {
        console.warn('[BGM] preload failed', err);
    }
};

// League IDs from D1 database
const LEAGUE_IDS = {
    PREMIER_LEAGUE: 1, // English Premier Division
    LA_LIGA: 2,        // Spanish First Division
};

interface GameInitResult {
    loading: boolean;
    error: string | null;
    userTeam: Team | null;
    allTeams: Team[];
    selectedLeagueId: number;
}

// Helper to randomize PA based on range
function randomizePotential(apiPlayer: ApiPlayer): number {
    // If we have a potential code and range, use it
    if (apiPlayer.potential_code && apiPlayer.min_pa && apiPlayer.max_pa) {
        const min = apiPlayer.min_pa;
        const max = apiPlayer.max_pa;
        // Random integer between min and max (inclusive)
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Fallback to fixed PA or estimate
    return apiPlayer.pa || 85;
}

// Map API Player to Game Player type
function mapApiPlayerToGamePlayer(apiPlayer: ApiPlayer): Player {
    // Determine position from string
    let position = Position.MID; // Default
    const posStr = apiPlayer.position.toUpperCase();
    if (posStr.includes('GK')) position = Position.GK;
    else if (posStr.includes('D')) position = Position.DEF;
    else if (posStr.includes('M')) position = Position.MID;
    else if (posStr.includes('F') || posStr.includes('ST')) position = Position.FWD;

    // Randomize PA here - this is the "New Game" moment
    const randomizedPA = randomizePotential(apiPlayer);
    const currentCA = apiPlayer.ca || 75;

    return {
        id: `p${apiPlayer.id}`,
        name: apiPlayer.name,
        age: apiPlayer.age,
        position,
        nationality: apiPlayer.nationality,
        ca: currentCA,
        pa: Math.max(randomizedPA, currentCA), // Ensure PA >= CA
        initialCA: currentCA, // Track initial CA for growth
        attributes: apiPlayer.attributes,
        hidden: {
            consistency: 12,
            importantMatches: 12,
            injuryProneness: 10,
        } as HiddenAttributes,
        condition: 100,
        morale: 75,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        value: 1000000,
        seasonStats: {
            appearances: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0,
            averageRating: 0,
            mom: 0
        }
    };
}

function mapClubToTeam(club: Club, apiPlayers: ApiPlayer[]): Team {
    const players = apiPlayers.map(mapApiPlayerToGamePlayer);

    // Generate starting lineup based on formation
    const formation = '4-4-2';
    const lineup = generateStartingLineup(players, formation);

    return {
        id: `t${club.id}`,
        name: club.name,
        shortName: club.name.substring(0, 3).toUpperCase(),
        primaryColor: '#10b981',
        secondaryColor: '#ffffff',
        // finance init by tier
        ...( (() => {
          const name = club.name;
          const tier = (() => {
            const top = ['Man City','Man UFC','Liverpool','Chelsea','Arsenal','Real Madrid','Barcelona','Atletico Madrid'];
            const mid = ['Tottenham','Newcastle','Aston Villa','Brighton','Sevilla','Real Sociedad','Villarreal','Betis'];
            if (top.some(t => name.startsWith(t))) return 'top';
            if (mid.some(t => name.startsWith(t))) return 'mid';
            return 'low';
          })();
          if (tier === 'top') return { balance: 180000000, transferBudget: 120000000, wageBudget: 4000000, wageSpending: 3200000 };
          if (tier === 'mid') return { balance: 90000000, transferBudget: 60000000, wageBudget: 2200000, wageSpending: 1800000 };
          return { balance: 40000000, transferBudget: 20000000, wageBudget: 1200000, wageSpending: 1000000 };
        })() ),
        balance: 100000000,
        transferBudget: 50000000,
        wageBudget: 2000000,
        wageSpending: 1800000,
        // finance init (simple heuristic)
        balance: 100000000,
        transferBudget: 50000000,
        wageBudget: 2000000,
        wageSpending: 1800000,

        players: players,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        tactics: {
            formation,
            mentality: 'Balanced',
            instructions: {
                inPossession: {
                    passingDirectness: 50,
                    tempo: 50,
                    width: 50
                },
                inTransition: {
                    counterPress: false,
                    counter: false,
                    distributeQuickly: false
                },
                outOfPossession: {
                    lineOfEngagement: 50,
                    defensiveLine: 50,
                    pressingIntensity: 50
                }
            },
            lineup
        },
    };
}

// Generate starting lineup by selecting best players for each position
function generateStartingLineup(players: Player[] = [], formation: string) {
    const lineup: { positionId: string; playerId: string; role: string; duty: string }[] = [];

    if (!Array.isArray(players) || players.length === 0) return lineup;

    // Separate players by position
    const gks = players.filter(p => p.position === Position.GK).sort((a, b) => b.ca - a.ca);
    const defenders = players.filter(p => p.position === Position.DEF).sort((a, b) => b.ca - a.ca);
    const midfielders = players.filter(p => p.position === Position.MID).sort((a, b) => b.ca - a.ca);
    const forwards = players.filter(p => p.position === Position.FWD).sort((a, b) => b.ca - a.ca);

    // Formation-specific lineups
    if (formation === '4-4-2') {
        // GK
        if (gks[0]) lineup.push({ positionId: 'gk', playerId: gks[0].id, role: 'GK', duty: 'Defend' });

        // Defense (4)
        if (defenders[0]) lineup.push({ positionId: 'lb', playerId: defenders[0].id, role: 'FB', duty: 'Support' });
        if (defenders[1]) lineup.push({ positionId: 'dcl', playerId: defenders[1].id, role: 'CD', duty: 'Defend' });
        if (defenders[2]) lineup.push({ positionId: 'dcr', playerId: defenders[2].id, role: 'CD', duty: 'Defend' });
        if (defenders[3]) lineup.push({ positionId: 'rb', playerId: defenders[3].id, role: 'FB', duty: 'Support' });

        // Midfield (4)
        if (midfielders[0]) lineup.push({ positionId: 'ml', playerId: midfielders[0].id, role: 'W', duty: 'Support' });
        if (midfielders[1]) lineup.push({ positionId: 'mcl', playerId: midfielders[1].id, role: 'CM', duty: 'Support' });
        if (midfielders[2]) lineup.push({ positionId: 'mcr', playerId: midfielders[2].id, role: 'CM', duty: 'Support' });
        if (midfielders[3]) lineup.push({ positionId: 'mr', playerId: midfielders[3].id, role: 'W', duty: 'Support' });

        // Attack (2)
        if (forwards[0]) lineup.push({ positionId: 'stl', playerId: forwards[0].id, role: 'AF', duty: 'Attack' });
        if (forwards[1]) lineup.push({ positionId: 'str', playerId: forwards[1].id, role: 'AF', duty: 'Attack' });
    } else {
        // Default 4-3-3
        if (gks[0]) lineup.push({ positionId: 'gk', playerId: gks[0].id, role: 'GK', duty: 'Defend' });
        if (defenders[0]) lineup.push({ positionId: 'lb', playerId: defenders[0].id, role: 'FB', duty: 'Support' });
        if (defenders[1]) lineup.push({ positionId: 'dcl', playerId: defenders[1].id, role: 'CD', duty: 'Defend' });
        if (defenders[2]) lineup.push({ positionId: 'dcr', playerId: defenders[2].id, role: 'CD', duty: 'Defend' });
        if (defenders[3]) lineup.push({ positionId: 'rb', playerId: defenders[3].id, role: 'FB', duty: 'Support' });
        if (midfielders[0]) lineup.push({ positionId: 'dmc', playerId: midfielders[0].id, role: 'DM', duty: 'Defend' });
        if (midfielders[1]) lineup.push({ positionId: 'mcl', playerId: midfielders[1].id, role: 'CM', duty: 'Support' });
        if (midfielders[2]) lineup.push({ positionId: 'mcr', playerId: midfielders[2].id, role: 'CM', duty: 'Support' });
        if (forwards[0]) lineup.push({ positionId: 'aml', playerId: forwards[0].id, role: 'W', duty: 'Attack' });
        if (forwards[1]) lineup.push({ positionId: 'st', playerId: forwards[1].id, role: 'AF', duty: 'Attack' });
        if (forwards[2]) lineup.push({ positionId: 'amr', playerId: forwards[2].id, role: 'W', duty: 'Attack' });
    }

    return lineup;
}

export function useGameInit(clubId?: number) {
    const [state, setState] = useState<GameInitResult>({
        loading: clubId !== undefined,
        error: null,
        userTeam: null,
        allTeams: [],
        selectedLeagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    });

    useEffect(() => {
        if (clubId === undefined) {
            setState({ loading: false, error: null, userTeam: null, allTeams: [], selectedLeagueId: LEAGUE_IDS.PREMIER_LEAGUE });
            return;
        }

        const initGame = async () => {
            try {
                setState(prev => ({ ...prev, loading: true, error: null }));

                // 0. Preload match BGM early
                preloadAudio(MATCH_BGM_URL);

                // 1. Get Club Name from API (Legacy selection flow)
                // We still use this to know WHICH club the user wanted
                let userClub: Club | undefined;
                let selectedLeagueId = LEAGUE_IDS.PREMIER_LEAGUE;
                let leagueName = 'Premier League';

                // Try Premier League
                const plClubsResponse = await api.getClubs(LEAGUE_IDS.PREMIER_LEAGUE, 1, 100);
                userClub = plClubsResponse.data.find(c => c.id === clubId);

                if (userClub) {
                    selectedLeagueId = LEAGUE_IDS.PREMIER_LEAGUE;
                    leagueName = 'Premier League';
                } else {
                    // Try La Liga
                    const laLigaClubsResponse = await api.getClubs(LEAGUE_IDS.LA_LIGA, 1, 100);
                    userClub = laLigaClubsResponse.data.find(c => c.id === clubId);
                    if (userClub) {
                        selectedLeagueId = LEAGUE_IDS.LA_LIGA;
                        leagueName = 'La Liga'; // Assuming API supports this, or we map ID
                    }
                }

                if (!userClub) {
                    throw new Error('Club not found');
                }

                // 2. Initialize Game Data (D1 -> IndexedDB)
                // This ensures we have the league data locally
                // We pass a temp manager name because this hook runs BEFORE manager creation in the current flow
                // The actual save will be updated/created in App.tsx later, but this populates the DB tables
                await gameInitializer.initializeNewGame(leagueName, 'Player', userClub.name);

                // 3. Load Data from Local IndexedDB
                // Now we rely 100% on the local data we just fetched/cached
                const allTeamData = await getAllFromStore<any>('teams');

                // Find user's team in the new local data (matching by name)
                const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

                // Try exact match first, then normalized
                let localUserTeam = allTeamData.find(t => t.name === userClub?.name);
                if (!localUserTeam && userClub) {
                    const target = normalize(userClub.name);
                    localUserTeam = allTeamData.find(t => normalize(t.name) === target);
                }

                if (!localUserTeam) {
                    console.error('Failed to find team:', userClub?.name);
                    console.error('Available keys:', allTeamData.map((t: any) => t.name));
                    throw new Error(`Team data mismatch: Could not find "${userClub?.name}" in D1 database (${allTeamData.length} teams loaded).`);
                }

                // Helper to convert Local DB Team -> Game Team (Legacy Type for App.tsx compatibility)
                const convertToLegacyTeam = async (dbTeam: any): Promise<Team> => {
                    const dbPlayers = await getTeamPlayers(dbTeam.name);
                    const enginePlayers = convertPlayersToState(dbPlayers);
                    const caMap = new Map<string, { ca?: number; pa?: number }>();
                    dbPlayers.forEach((p: any) => {
                        const id = (p.UID || p.id || p.playerId || '').toString();
                        caMap.set(id, {
                            ca: p.current_ability ?? p.CurrentAbility ?? p.ca,
                            pa: p.potential_ability ?? p.PotentialAbility ?? p.pa
                        });
                    });

                    // Map Engine PlayerState -> Legacy Player Interface
                    const legacyPlayers: Player[] = enginePlayers.map(p => {
                        const attr = p.attributes; // Flat attributes from engine
                        const dbPlayer = dbPlayers.find((dp: any) => String(dp.UID || dp.id || dp.playerId || '') === String(p.id));

                        const rawCa = caMap.get(p.id.toString())?.ca;
                        const rawPa = caMap.get(p.id.toString())?.pa;

                        const ageRaw = (dbPlayer as any)?.Age ?? (dbPlayer as any)?.age ?? (p as any).Age ?? (p as any).age;
                        const ageVal = Number(ageRaw);

                        return {
                            id: p.id.toString(),
                            name: p.name,
                            age: Number.isFinite(ageVal) ? ageVal : 25, // prefer DB age, fallback 25
                            position: mapPosition(p.position),
                            nationality: 'Unknown',
                            ca: rawCa ?? 100,
                            pa: rawPa ?? 150,
                            initialCA: rawCa ?? 100,
                            // Reconstruct nested attributes strictly for UI compatibility
                            attributes: {
                                technical: {
                                    corners: attr.Corners,
                                    crossing: attr.Crossing,
                                    dribbling: attr.Dribbling,
                                    finishing: attr.Finishing,
                                    firstTouch: attr.FirstTouch,
                                    freeKicks: attr.FreeKickTaking,
                                    heading: attr.Heading,
                                    longShots: attr.LongShots,
                                    longThrows: attr.LongThrows,
                                    marking: attr.Marking,
                                    passing: attr.Passing,
                                    penaltyTaking: attr.PenaltyTaking,
                                    tackling: attr.Tackling,
                                    technique: attr.Technique
                                },
                                mental: {
                                    aggression: attr.Aggression,
                                    anticipation: attr.Anticipation,
                                    bravery: attr.Bravery,
                                    composure: attr.Composure,
                                    concentration: attr.Concentration,
                                    decisions: attr.Decisions,
                                    determination: attr.Determination,
                                    flair: attr.Flair,
                                    leadership: attr.Leadership,
                                    offTheBall: attr.OffTheBall,
                                    positioning: attr.Positioning,
                                    teamwork: attr.Teamwork,
                                    vision: attr.Vision,
                                    workRate: attr.WorkRate
                                },
                                physical: {
                                    acceleration: attr.Acceleration,
                                    agility: attr.Agility,
                                    balance: attr.Balance,
                                    jumpingReach: attr.JumpingReach,
                                    naturalFitness: attr.NaturalFitness,
                                    pace: attr.Pace,
                                    stamina: attr.Stamina,
                                    strength: attr.Strength
                                }
                            },
                            hidden: { consistency: 10, importantMatches: 10, injuryProneness: 10 },
                            condition: p.condition,
                            morale: p.morale,
                            goals: 0, assists: 0, cleanSheets: 0,
                            value: 1000000,
                            seasonStats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, averageRating: 0, mom: 0 }
                        };
                    });

                    return {
                        id: dbTeam.id,
                        name: dbTeam.name,
                        shortName: dbTeam.name.substring(0, 3).toUpperCase(),
                        primaryColor: dbTeam.colors?.primary || '#00ff00',
                        secondaryColor: dbTeam.colors?.secondary || '#ffffff',
                        players: legacyPlayers,
                        wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
                        tactics: {
                            formation: dbTeam.tactics?.formation || '4-4-2',
                            mentality: 'Balanced',
                            instructions: {
                                inPossession: { passingDirectness: 50, tempo: 50, width: 50 },
                                inTransition: { counterPress: false, counter: false, distributeQuickly: false },
                                outOfPossession: { lineOfEngagement: 50, defensiveLine: 50, pressingIntensity: 50 }
                            },
                            lineup: generateLegacyLineup(legacyPlayers, dbTeam.tactics?.formation || '4-4-2')
                        }
                    };
                };

                const userTeam = await convertToLegacyTeam(localUserTeam);

                // Convert other teams (shallowly if performance is issue, but need valid objects)
                // For now convert all
                const allTeams = await Promise.all(allTeamData.map(convertToLegacyTeam));

                setState({
                    loading: false,
                    error: null,
                    userTeam,
                    allTeams,
                    selectedLeagueId,
                });

            } catch (err: any) {
                console.error('Game Init Error:', err);
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: err.message || '加载失败',
                }));
            }
        };

        initGame();
    }, [clubId]);

    return state;
}

// Helper: Map Engine Position String to Legacy Enum
function mapPosition(pos: string): Position {
    if (pos === 'GK') return Position.GK;
    if (pos.includes('D')) return Position.DEF;
    if (pos.includes('M')) return Position.MID;
    return Position.FWD;
}

// Helper: Generate legacy lineup structure
function generateLegacyLineup(players: Player[], formation: string) {
    // Simple placeholder - take first 11
    return players.slice(0, 11).map(p => ({
        positionId: 'gk', // This needs proper mapping logic but kept simple for now
        playerId: p.id,
        role: 'GK',
        duty: 'Defend'
    }));
}