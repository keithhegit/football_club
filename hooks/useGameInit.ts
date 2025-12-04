import { useState, useEffect } from 'react';
import api, { Club } from '../services/api';
import { Team, Player, Position, HiddenAttributes } from '../types';
import { Player as ApiPlayer } from '../services/api';

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
function generateStartingLineup(players: Player[], formation: string) {
    const lineup: { positionId: string; playerId: string; role: string; duty: string }[] = [];

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

                // 1. Try to find the club in Premier League first
                let userClub: Club | undefined;
                let clubs: Club[] = [];
                let selectedLeagueId = LEAGUE_IDS.PREMIER_LEAGUE;

                const plClubsResponse = await api.getClubs(LEAGUE_IDS.PREMIER_LEAGUE, 1, 100);
                userClub = plClubsResponse.data.find(c => c.id === clubId);

                if (userClub) {
                    clubs = plClubsResponse.data;
                    selectedLeagueId = LEAGUE_IDS.PREMIER_LEAGUE;
                } else {
                    // 2. Try La Liga
                    const laLigaClubsResponse = await api.getClubs(LEAGUE_IDS.LA_LIGA, 1, 100);
                    userClub = laLigaClubsResponse.data.find(c => c.id === clubId);
                    if (userClub) {
                        clubs = laLigaClubsResponse.data;
                        selectedLeagueId = LEAGUE_IDS.LA_LIGA;
                    }
                }

                if (!userClub || clubs.length === 0) {
                    throw new Error('未找到指定的俱乐部');
                }

                // 3. Fetch players for user's club
                console.log('Fetching players for club:', userClub.id, userClub.name);
                const userPlayersResponse = await api.searchPlayers({
                    club_id: userClub.id,
                    limit: 100
                });
                const userPlayers = userPlayersResponse.data;
                console.log('Fetched players count:', userPlayers.length);

                // 4. Map to Team model
                const userTeam = mapClubToTeam(userClub, userPlayers);

                // 5. Map all clubs to teams (for league standings)
                const allTeams = clubs.map(club =>
                    club.id === userClub.id ? userTeam : mapClubToTeam(club, [])
                );

                setState({
                    loading: false,
                    error: null,
                    userTeam,
                    allTeams,
                    selectedLeagueId,
                });
            } catch (err: any) {
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
