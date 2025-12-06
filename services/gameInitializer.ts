import { saveBatch, saveToStore, GameData } from '../utils/localDB';

interface InitResponse {
    success: boolean;
    players: any[];
    teams: any[];
    message: string;
}

export const gameInitializer = {
    /**
     * Start a new game: Fetch from D1 -> Save to IndexedDB
     */
    async initializeNewGame(league: string, managerName: string, clubName: string): Promise<string> {
        console.log(`Initializing new game for ${league}...`);

        try {
            // 1. Fetch data from D1 (One time only)
            const response = await fetch('/api/players/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ league })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('[GameInit] Server Error Details:', errData);
                throw new Error(`Failed to fetch initial data: ${errData.error || response.statusText}`);
            }

            const data: InitResponse = await response.json();

            if (!data.success) {
                throw new Error('API returned error');
            }

            // 2. Prepare Game Data
            const saveId = crypto.randomUUID();
            const timestamp = Date.now();

            console.log(`[GameInit] Received ${data.teams.length} teams and ${data.players.length} players from API.`);

            if (data.teams.length === 0) {
                console.error('[GameInit] API returned 0 teams! Check League Name mismatch.');
                throw new Error('API returned 0 teams. This usually means the requested league does not exist in the database.');
            }

            const gameData: GameData = {
                saveId,
                saveName: `${managerName} - ${clubName}`,
                createdAt: timestamp,
                updatedAt: timestamp,
                currentDate: '2023-08-01', // Start of season
                userTeam: data.teams.find((t: any) => t.name === clubName)?.id || 'unknown'
            };

            // 3. Save to Local IndexedDB
            console.log('Saving to local database...');

            // Save Game Metadata
            await saveToStore('games', gameData);

            // Save Teams
            // Ensure ID consistency if possible, or mapping
            await saveBatch('teams', data.teams);

            // Save Players
            // API returns 'id', IndexedDB expects 'UID'
            // We also need to ensure Club/League fields match the index expectations
            const mappedPlayers = data.players.map((p: any) => ({
                ...p,
                UID: p.id, // Map D1 id to local UID
                // Ensure Club/League are present (API alias handles this, checking just in case)
                Club: p.Club || p.club_name,
                League: p.League || p.league_name,
                CurrentAbility: p.current_ability ?? p.CurrentAbility ?? p.ca,
                PotentialAbility: p.potential_ability ?? p.PotentialAbility ?? p.pa
            }));
            await saveBatch('players', mappedPlayers);

            // Initialize League Table
            const leagueTableEntries = data.teams.map((team: any) => ({
                id: team.id,
                teamName: team.name,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                points: 0
            }));
            await saveBatch('leagueTables', leagueTableEntries);

            console.log('✅ Game initialized successfully locally.');
            return saveId;

        } catch (error) {
            console.error('Game initialization failed:', error);
            throw error;
        }
    }
};
