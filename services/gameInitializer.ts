import { saveBatch, saveToStore, GameData } from '../utils/localDB';

const readEnvFlag = (key: string): boolean => {
  try {
    // Vite style
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return String(import.meta.env[key]) === 'true';
    }
  } catch (err) {
    // ignore
  }

  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return String(process.env[key]) === 'true';
  }

  return false;
};

const USE_LOCAL_PLAYERS_SEED = readEnvFlag('VITE_USE_LOCAL_PLAYERS_SEED') || readEnvFlag('USE_LOCAL_PLAYERS_SEED');
const LOCAL_PLAYERS_SEED_PATH = '/data/players_fixed.json';
// Transfer window config (prem / la liga)
const WINDOW_CONFIG: Record<string, { open: string; close: string }> = {
  'Premier League': { open: '2023-07-01', close: '2023-08-31' },
  'La Liga': { open: '2023-07-01', close: '2023-08-31' },
};

const normalizeKey = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

const loadLocalPlayersSeed = async (): Promise<any[]> => {
  try {
    const resp = await fetch(LOCAL_PLAYERS_SEED_PATH);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    if (!Array.isArray(json)) {
      console.warn('[GameInit] Local seed is not an array');
      return [];
    }
    return json;
  } catch (err) {
    console.warn('[GameInit] Failed to load local players seed', err);
    return [];
  }
};

const patchPlayersWithSeed = (players: any[], seed: any[]): any[] => {
  if (!Array.isArray(players) || !Array.isArray(seed) || seed.length === 0) return players;

  const byId = new Map<string, string>();
  const byNorm = new Map<string, string>();

  seed.forEach((p: any) => {
    const idStr = p?.uid || p?.UID || p?.id;
    const name = p?.name;
    if (idStr && name) {
      byId.set(String(idStr), String(name));
    }
    if (p?.nameNorm && name) {
      byNorm.set(normalizeKey(String(p.nameNorm)), String(name));
    }
  });

  return players.map(p => {
    const idKey = p?.id !== undefined ? String(p.id) : p?.UID !== undefined ? String(p.UID) : '';
    const normKey = p?.name ? normalizeKey(String(p.name)) : '';
    const patchedName = byId.get(idKey) || (normKey ? byNorm.get(normKey) : undefined);
    if (patchedName) {
      return { ...p, name: patchedName };
    }
    return p;
  });
};

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

            let playersFromApi = data.players;

            if (USE_LOCAL_PLAYERS_SEED) {
                const seed = await loadLocalPlayersSeed();
                if (seed.length > 0) {
                    playersFromApi = patchPlayersWithSeed(playersFromApi, seed);
                    console.log(`[GameInit] Applied local players seed patch (${seed.length} records).`);
                } else {
                    console.warn('[GameInit] Local players seed flag is on but seed could not be loaded or is empty.');
                }
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
            const mappedPlayers = playersFromApi.map((p: any) => ({
                ...p,
                UID: p.id, // Map D1 id to local UID
                // Ensure Club/League are present (API alias handles this, checking just in case)
                Club: p.Club || p.club_name,
                League: p.League || p.league_name,
                CurrentAbility: p.current_ability ?? p.CurrentAbility ?? p.ca,
                PotentialAbility: p.potential_ability ?? p.PotentialAbility ?? p.pa,
                ca: p.current_ability ?? p.CurrentAbility ?? p.ca,
                pa: p.potential_ability ?? p.PotentialAbility ?? p.pa
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
