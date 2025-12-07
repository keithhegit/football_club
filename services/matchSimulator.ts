import { MatchEngine } from '../engine/matchEngine';
import { MatchResult, TeamState } from '../engine/types';
import { getFromStore, getTeamPlayers, saveMatchResult } from '../utils/localDB';
import { convertPlayersToState, convertToPlayerState } from '../utils/playerConverter';
import { getTacticalModifiers } from '../engine/tacticalMods';
import { updateSeasonPlayerStats } from './matchStatsWriter';

export const matchSimulator = {
    /**
     * Simulate a match using local data and the unification Engine
     */
    async simulateFixture(fixtureId: string, homeTeamId: string, awayTeamId: string): Promise<MatchResult> {
        console.log(`Simulating fixture ${fixtureId}: ${homeTeamId} vs ${awayTeamId}`);

        try {
            // 1. Load Data from Local DB
            const homeTeamData = await getFromStore<any>('teams', homeTeamId);
            const awayTeamData = await getFromStore<any>('teams', awayTeamId);

            if (!homeTeamData || !awayTeamData) {
                const availableTeams = await getFromStore<any[]>('teams', null) || []; // This method signature might be wrong for keys, let's just error broadly or use getAll
                // Actually let's just log the error clearly
                console.error(`Missing Data Error:`);
                console.error(`- Looking for Home ID: ${homeTeamId} (Found: ${!!homeTeamData})`);
                console.error(`- Looking for Away ID: ${awayTeamId} (Found: ${!!awayTeamData})`);
                throw new Error(`Team data not found locally. Home: ${homeTeamId}, Away: ${awayTeamId}. Please start a NEW GAME.`);
            }

            const homePlayersRaw = await getTeamPlayers(homeTeamData.name); // Access by club name index
            const awayPlayersRaw = await getTeamPlayers(awayTeamData.name);

            // 2. Convert to Engine Format
            // Ensure we have 11 players or handle it
            const homeSquad = convertPlayersToState(homePlayersRaw);
            const awaySquad = convertPlayersToState(awayPlayersRaw);

            // Basic auto-selection if needed (take first 11)
            // Real implementation would check selection/fitness
            const homeStarters = homeSquad.slice(0, 11);
            const awayStarters = awaySquad.slice(0, 11);

            const homeTeam: TeamState = {
                id: homeTeamId,
                name: homeTeamData.name,
                players: homeStarters,
                formation: homeTeamData.tactics?.formation || '4-3-3',
                tacticalModifiers: getTacticalModifiers(homeTeamData.tactics)
            };

            const awayTeam: TeamState = {
                id: awayTeamId,
                name: awayTeamData.name,
                players: awayStarters,
                formation: awayTeamData.tactics?.formation || '4-4-2',
                tacticalModifiers: getTacticalModifiers(awayTeamData.tactics)
            };

            // 3. Run Simulation
            const engine = new MatchEngine(homeTeam, awayTeam);

            // For full simulation (instant result)
            const result = engine.simulateMatch();

            // 4. Save Results Locally
            await saveMatchResult({
                saveId: 'current', // Should get from context
                date: new Date().toISOString(), // Should get from game date
                homeTeam: homeTeamData.name,
                awayTeam: awayTeamData.name,
                homeScore: result.homeScore,
                awayScore: result.awayScore,
                statistics: result.statistics,
                events: result.eventLog
            });

            console.log(`Match simulated: ${homeTeam.name} ${result.homeScore} - ${result.awayScore} ${awayTeam.name}`);
            return result;

        } catch (error) {
            console.error('Match simulation failed:', error);
            throw error;
        }
    }
};
