// IndexedDB utilities for local-first game saves
// D1 only accessed once at game creation, all subsequent ops use IndexedDB

const DB_NAME = 'FM2023_GameData';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export interface GameData {
    saveId: string;
    saveName: string;
    createdAt: number;
    updatedAt: number;
    currentDate: string;
    userTeam: string;
}

/**
 * Initialize IndexedDB with required object stores
 */
export async function initDB(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Game metadata
            if (!db.objectStoreNames.contains('games')) {
                db.createObjectStore('games', { keyPath: 'saveId' });
            }

            // Player data (from D1, then local)
            if (!db.objectStoreNames.contains('players')) {
                const playerStore = db.createObjectStore('players', { keyPath: 'UID' });
                playerStore.createIndex('club', 'Club', { unique: false });
                playerStore.createIndex('league', 'League', { unique: false });
            }

            // Team data
            if (!db.objectStoreNames.contains('teams')) {
                const teamStore = db.createObjectStore('teams', { keyPath: 'id' });
                teamStore.createIndex('league', 'league', { unique: false });
            }

            // Match results
            if (!db.objectStoreNames.contains('matchResults')) {
                const matchStore = db.createObjectStore('matchResults', { keyPath: 'id', autoIncrement: true });
                matchStore.createIndex('saveId', 'saveId', { unique: false });
                matchStore.createIndex('date', 'date', { unique: false });
            }

            // Fixtures
            if (!db.objectStoreNames.contains('fixtures')) {
                const fixtureStore = db.createObjectStore('fixtures', { keyPath: 'id', autoIncrement: true });
                fixtureStore.createIndex('saveId', 'saveId', { unique: false });
                fixtureStore.createIndex('date', 'date', { unique: false });
            }

            // League tables
            if (!db.objectStoreNames.contains('leagueTables')) {
                db.createObjectStore('leagueTables', { keyPath: 'id' });
            }

            console.log('IndexedDB initialized');
        };
    });
}

/**
 * Generic save to object store
 */
export async function saveToStore<T>(storeName: string, data: T): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Generic get from object store
 */
export async function getFromStore<T>(storeName: string, key: any): Promise<T | undefined> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all items from store
 */
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Query by index
 */
export async function queryByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Delete from store
 */
export async function deleteFromStore(storeName: string, key: any): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Clear entire store
 */
export async function clearStore(storeName: string): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Save multiple items in batch
 */
export async function saveBatch<T>(storeName: string, items: T[]): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        items.forEach(item => store.put(item));

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Helper: Get players for a specific team
export async function getTeamPlayers(club: string): Promise<any[]> {
    return queryByIndex('players', 'club', club);
}

// Helper: Save match result to local DB
export async function saveMatchResult(result: {
    saveId: string;
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    statistics: any;
    events: any[];
}): Promise<void> {
    await saveToStore('matchResults', {
        ...result,
        timestamp: Date.now()
    });
}

// Initialize on module load
initDB().catch(err => console.error('Failed to init IndexedDB:', err));
