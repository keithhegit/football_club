export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const league = body?.league; // Defensive read
        const targetLeague = league || 'Premier League';

        console.log(`[API] Init requested for league: ${targetLeague}`);

        // Check if DB binding exists
        if (!context.env.DB) {
            console.error('[API] Critical Error: context.env.DB is undefined');
            throw new Error('Database binding (DB) is missing in Cloudflare environment');
        }

        // 1. Fetch Players
        console.log('[API] Executing query: SELECT * FROM fm_players...');
        const playersQuery = context.env.DB.prepare('SELECT * FROM fm_players WHERE League = ?').bind(targetLeague);
        const playersResult = await playersQuery.all();

        if (!playersResult.success) {
            console.error('[API] Players query failed:', playersResult.error);
            throw new Error(`Players query failed: ${playersResult.error}`);
        }

        console.log(`[API] Found ${playersResult.results.length} players`);

        // 2. Fetch unique clubs to build Team objects
        console.log('[API] Executing query: SELECT DISTINCT Club FROM fm_players...');
        const teamsQuery = context.env.DB.prepare('SELECT DISTINCT Club FROM fm_players WHERE League = ?').bind(targetLeague);
        const teamsResult = await teamsQuery.all();

        if (!teamsResult.success) {
            console.error('[API] Teams query failed:', teamsResult.error);
            throw new Error(`Teams query failed: ${teamsResult.error}`);
        }

        console.log(`[API] Found ${teamsResult.results.length} unique clubs`);

        // 3. Construct Team objects (basic info) - in a real scenario we might have a separate teams table
        // For now, we simulate team data from the unique club names
        const teams = teamsResult.results.map((row, index) => {
            // Create deterministic ID based on club name
            // This ensures consistency across loads/re-inits
            const sanitizedName = (row.Club || `unknown_${index}`).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return {
                id: `t_${sanitizedName}`,
                name: row.Club || 'Unknown Club',
                league: targetLeague,
                reputation: 5000,
                tactics: {
                    formation: '4-3-3',
                    mentality: 'BALANCED',
                    passingStyle: 'SHORT',
                    tempo: 'NORMAL',
                    width: 'NORMAL',
                    pressing: 'NORMAL'
                },
                colors: {
                    primary: '#ff0000',
                    secondary: '#ffffff'
                }
            };
        });

        return Response.json({
            success: true,
            players: playersResult.results,
            teams: teams,
            message: `Fetched ${playersResult.results.length} players and ${teams.length} teams for ${targetLeague}`
        });

    } catch (e) {
        console.error('[API] Init Endpoint Error:', e.message);
        console.error(e.stack);

        return Response.json({
            success: false,
            error: e.message,
            stack: e.stack // Optional: remove in prod if sensitive
        }, { status: 500 });
    }
}
