// Cloudflare Pages Functions API Handler
// Handles all /api/* requests using D1 database

interface Env {
    DB: D1Database;
}

// CORS headers for development and production
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper: JSON response with CORS
function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
        },
    });
}

// Helper: Error response
function errorResponse(message: string, status = 400) {
    return jsonResponse({ error: message }, status);
}

// Helper: Parse query params
function getQueryParam(url: URL, name: string, defaultValue?: string): string | undefined {
    return url.searchParams.get(name) || defaultValue;
}

function getIntParam(url: URL, name: string, defaultValue: number): number {
    const value = url.searchParams.get(name);
    const parsed = value ? parseInt(value, 10) : defaultValue;
    return isNaN(parsed) ? defaultValue : parsed;
}

// API Route Handlers
async function handlePlayersSearch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Query parameters
    const query = getQueryParam(url, 'q', '')?.trim();
    const position = getQueryParam(url, 'position');
    const club = getQueryParam(url, 'club');
    const clubId = getIntParam(url, 'club_id', 0);
    const minAge = getIntParam(url, 'minAge', 0);
    const maxAge = getIntParam(url, 'maxAge', 100);
    const page = Math.max(1, getIntParam(url, 'page', 1));
    const limit = Math.min(100, Math.max(1, getIntParam(url, 'limit', 50)));
    const offset = (page - 1) * limit;

    const sort = url.searchParams.get('sort') || 'name';
    const order = (url.searchParams.get('order') || 'asc').toUpperCase();

    // Validate sort field to prevent SQL injection
    const allowedSortFields = ['name', 'age', 'position', 'transfer_value', 'wage']; // Removed ca, pa
    let orderByClause = 'p.name ASC';

    if (sort === 'ca') {
        // Calculate pseudo-CA for sorting: Sum of key attributes
        // Note: Using COALESCE to handle potential NULLs (though defaults are 0)
        orderByClause = `(
            COALESCE(p.pace, 0) + 
            COALESCE(p.acceleration, 0) + 
            COALESCE(p.stamina, 0) + 
            COALESCE(p.strength, 0) + 
            COALESCE(p.finishing, 0) + 
            COALESCE(p.passing, 0) + 
            COALESCE(p.tackling, 0) + 
            COALESCE(p.dribbling, 0) +
            COALESCE(p.vision, 0) +
            COALESCE(p.technique, 0)
        ) ${order === 'ASC' ? 'ASC' : 'DESC'}`;
    } else if (allowedSortFields.includes(sort)) {
        orderByClause = `p.${sort} ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    }

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];

    if (query) {
        conditions.push('p.name LIKE ?');
        params.push(`%${query}%`);
    }

    if (position) {
        conditions.push('p.position = ?');
        params.push(position);
    }

    if (clubId > 0) {
        conditions.push('p.club_id = ?');
        params.push(clubId);
    } else if (club) {
        conditions.push('c.name LIKE ?');
        params.push(`%${club}%`);
    }

    if (minAge > 0) {
        conditions.push('p.age >= ?');
        params.push(minAge);
    }

    if (maxAge < 100) {
        conditions.push('p.age <= ?');
        params.push(maxAge);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total results
    const countQuery = `
    SELECT COUNT(*) as total
    FROM players p
    LEFT JOIN clubs c ON p.club_id = c.id
    ${whereClause}
  `;

    const countResult = await env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Fetch paginated results
    const dataQuery = `
    SELECT 
      p.*,
      c.name as club_name,
      l.name as league_name
    FROM players p
    LEFT JOIN clubs c ON p.club_id = c.id
    LEFT JOIN leagues l ON c.league_id = l.id
    ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT ? OFFSET ?
  `;

    const players = await env.DB.prepare(dataQuery)
        .bind(...params, limit, offset)
        .all();

    return jsonResponse({
        data: players.results || [],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

async function handlePlayerById(request: Request, env: Env, id: string): Promise<Response> {
    const playerId = parseInt(id, 10);

    if (isNaN(playerId)) {
        return errorResponse('Invalid player ID', 400);
    }

    const query = `
    SELECT 
      p.*,
      c.name as club_name,
      l.name as league_name
    FROM players p
    LEFT JOIN clubs c ON p.club_id = c.id
    LEFT JOIN leagues l ON c.league_id = l.id
    WHERE p.id = ?
  `;

    const player = await env.DB.prepare(query).bind(playerId).first();

    if (!player) {
        return errorResponse('Player not found', 404);
    }

    return jsonResponse({ data: player });
}

async function handleClubs(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const leagueId = getQueryParam(url, 'league');
    const page = Math.max(1, getIntParam(url, 'page', 1));
    const limit = Math.min(100, Math.max(1, getIntParam(url, 'limit', 50)));
    const offset = (page - 1) * limit;

    const whereClause = leagueId ? 'WHERE c.league_id = ?' : '';
    const params = leagueId ? [parseInt(leagueId, 10)] : [];

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM clubs c ${whereClause}`;
    const countResult = await env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Fetch clubs
    const dataQuery = `
    SELECT 
      c.id, c.name,
      l.name as league_name
    FROM clubs c
    LEFT JOIN leagues l ON c.league_id = l.id
    ${whereClause}
    ORDER BY c.name ASC
    LIMIT ? OFFSET ?
  `;

    const clubs = await env.DB.prepare(dataQuery)
        .bind(...params, limit, offset)
        .all();

    return jsonResponse({
        data: clubs.results || [],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

async function handleLeagues(request: Request, env: Env): Promise<Response> {
    const query = `
    SELECT 
      l.id, l.name,
      COUNT(c.id) as club_count
    FROM leagues l
    LEFT JOIN clubs c ON l.id = c.league_id
    GROUP BY l.id, l.name
    ORDER BY l.name ASC
  `;

    const leagues = await env.DB.prepare(query).all();

    return jsonResponse({
        data: leagues.results || [],
    });
}

// Main request handler
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
    const { request, env } = context;
    const url = new URL(request.url);

    // Debug logging
    console.log('Request URL:', url.toString());
    console.log('Env keys:', Object.keys(env));
    if (!env.DB) {
        console.error('CRITICAL: env.DB is undefined!');
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
        return errorResponse('Method not allowed', 405);
    }

    // Parse the path after /api/
    const pathParts = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean);

    try {
        // Route to appropriate handler
        if (pathParts[0] === 'players') {
            if (pathParts[1] === 'search') {
                return await handlePlayersSearch(request, env);
            } else if (pathParts[1]) {
                return await handlePlayerById(request, env, pathParts[1]);
            }
            return errorResponse('Invalid players endpoint', 404);
        } else if (pathParts[0] === 'clubs') {
            return await handleClubs(request, env);
        } else if (pathParts[0] === 'leagues') {
            return await handleLeagues(request, env);
        } else {
            return errorResponse('Endpoint not found', 404);
        }
    } catch (error: any) {
        return jsonResponse({
            error: 'Internal server error',
            message: error.message,
            stack: error.stack,
            envKeys: Object.keys(env)
        }, 500);
    }
}
