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
                throw new Error(`Failed to fetch initial data: ${response.statusText}`);
            }

            const data: InitResponse = await response.json();

            if (!data.success) {
                throw new Error('API returned error');
            }

            // 2. Prepare Game Data
            const saveId = crypto.randomUUID();
            const timestamp = Date.now();

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
            // Note: raw D1 players, will be converted to PlayerState on load
            await saveBatch('players', data.players);

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
