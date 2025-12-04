// API Client Service for FM2023
// Type-safe API calls to the Cloudflare Workers backend

// Types
export interface Player {
    id: number;
    name: string;
    age: number;
    position: string;
    nationality: string;
    height: number | null;
    weight: number | null;
    preferred_foot: string | null;
    transfer_value: string | null;
    wage: string | null;
    club_name: string | null;
    league_name: string | null;
    ca: number;
    pa: number;
    potential_code?: string;
    min_pa?: number;
    max_pa?: number;
    attributes: {
        technical: {
            corners: number;
            crossing: number;
            dribbling: number;
            finishing: number;
            firstTouch: number;
            freeKicks: number;
            heading: number;
            longShots: number;
            longThrows: number;
            marking: number;
            passing: number;
            penaltyTaking: number;
            tackling: number;
            technique: number;
        };
        mental: {
            aggression: number;
            anticipation: number;
            bravery: number;
            composure: number;
            concentration: number;
            decisions: number;
            determination: number;
            flair: number;
            leadership: number;
            offTheBall: number;
            positioning: number;
            teamwork: number;
            vision: number;
            workRate: number;
        };
        physical: {
            acceleration: number;
            agility: number;
            balance: number;
            jumpingReach: number;
            naturalFitness: number;
            pace: number;
            stamina: number;
            strength: number;
        };
    };
}

export interface Club {
    id: number;
    name: string;
    league_name: string | null;
    league_id?: number;
}

export interface League {
    id: number;
    name: string;
    club_count: number;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    data: T;
    pagination?: Pagination;
}

export interface SearchFilters {
    q?: string;
    position?: string;
    club?: string;
    club_id?: number;
    minAge?: number;
    maxAge?: number;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

// API Base URL
const getApiBaseUrl = (): string => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:8788/api';
    }
    return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper: Build query string
function buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, String(value));
        }
    });
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
}

// Helper: Fetch with error handling
export async function apiFetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
        const error: any = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API error: ${response.status}`);
    }
    return response.json();
}

// Helper to estimate CA from attributes since DB doesn't have it
function calculateEstimatedCA(p: any): number {
    const stats = [
        p.pace, p.acceleration, p.stamina, p.strength, // Physical
        p.finishing, p.passing, p.tackling, p.dribbling, // Technical
        p.vision, p.technique, p.decisions, p.composure // Mental
    ];

    // Sum valid stats
    const sum = stats.reduce((acc, val) => acc + (parseInt(val) || 0), 0);

    // Average * 10 (roughly) to map to 0-200 scale. 
    return Math.min(200, Math.round(sum * 0.8));
}

// Helper: Map API player to UI Player model
function mapPlayerFromApi(apiPlayer: any): Player {
    const p = (val: any) => parseInt(val) || 0;
    return {
        id: apiPlayer.id,
        name: apiPlayer.name,
        age: apiPlayer.age,
        position: apiPlayer.position,
        nationality: apiPlayer.nationality,
        height: apiPlayer.height,
        weight: apiPlayer.weight,
        preferred_foot: apiPlayer.preferred_foot,
        transfer_value: apiPlayer.transfer_value,
        wage: apiPlayer.wage,
        club_name: apiPlayer.club_name,
        league_name: apiPlayer.league_name,
        ca: apiPlayer.ca || calculateEstimatedCA(apiPlayer),
        pa: apiPlayer.pa || 0,
        potential_code: apiPlayer.potential_code,
        min_pa: apiPlayer.min_pa,
        max_pa: apiPlayer.max_pa,
        attributes: {
            technical: {
                corners: p(apiPlayer.corners),
                crossing: p(apiPlayer.crossing),
                dribbling: p(apiPlayer.dribbling),
                finishing: p(apiPlayer.finishing),
                firstTouch: p(apiPlayer.first_touch),
                freeKicks: p(apiPlayer.free_kicks),
                heading: p(apiPlayer.heading),
                longShots: p(apiPlayer.long_shots),
                longThrows: p(apiPlayer.long_throws),
                marking: p(apiPlayer.marking),
                passing: p(apiPlayer.passing),
                penaltyTaking: p(apiPlayer.penalty_taking),
                tackling: p(apiPlayer.tackling),
                technique: p(apiPlayer.technique)
            },
            mental: {
                aggression: p(apiPlayer.aggression),
                anticipation: p(apiPlayer.anticipation),
                bravery: p(apiPlayer.bravery),
                composure: p(apiPlayer.composure),
                concentration: p(apiPlayer.concentration),
                decisions: p(apiPlayer.decisions),
                determination: p(apiPlayer.determination),
                flair: p(apiPlayer.flair),
                leadership: p(apiPlayer.leadership),
                offTheBall: p(apiPlayer.off_the_ball),
                positioning: p(apiPlayer.positioning),
                teamwork: p(apiPlayer.teamwork),
                vision: p(apiPlayer.vision),
                workRate: p(apiPlayer.work_rate)
            },
            physical: {
                acceleration: p(apiPlayer.acceleration),
                agility: p(apiPlayer.agility),
                balance: p(apiPlayer.balance),
                jumpingReach: p(apiPlayer.jumping_reach),
                naturalFitness: p(apiPlayer.natural_fitness),
                pace: p(apiPlayer.pace),
                stamina: p(apiPlayer.stamina),
                strength: p(apiPlayer.strength)
            }
        }
    };
}

// API Methods
export const api = {
    async searchPlayers(filters: SearchFilters = {}): Promise<ApiResponse<Player[]>> {
        const queryString = buildQueryString(filters);
        const response = await apiFetch<ApiResponse<any[]>>(`/players/search${queryString}`);
        return {
            ...response,
            data: response.data.map(mapPlayerFromApi)
        };
    },

    async getPlayer(id: number): Promise<ApiResponse<Player>> {
        const response = await apiFetch<ApiResponse<any>>(`/players/${id}`);
        return {
            ...response,
            data: mapPlayerFromApi(response.data)
        };
    },

    async getClubs(leagueId?: number, page = 1, limit = 100): Promise<ApiResponse<Club[]>> {
        const queryString = buildQueryString({ league: leagueId, page, limit });
        return apiFetch<ApiResponse<Club[]>>(`/clubs${queryString}`);
    },

    async getLeagues(): Promise<ApiResponse<League[]>> {
        return apiFetch<ApiResponse<League[]>>('/leagues');
    },
};

export default api;
