export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const league = body?.league; // Defensive read
        const targetLeague = league || 'Premier League';

        console.log(`[API] Init requested for league: ${targetLeague}`);

        // Map frontend league names to likely DB names (from CSV import)
        let dbLeagueName = targetLeague;
        if (targetLeague === 'Premier League') dbLeagueName = 'English Premier Division';
        if (targetLeague === 'La Liga') dbLeagueName = 'Spanish First Division';

        console.log(`[API] mapped '${targetLeague}' to '${dbLeagueName}'`);

        // 1. Fetch Players with Club info + ability using JOINs
        // Schema: players -> player_ability -> clubs -> leagues
        console.log(`[API] Executing JOIN query for players in ${dbLeagueName}...`);

        // Note: returning as snake_case as per schema, client side converter handles attribute mapping
        const playersQuery = context.env.DB.prepare(`
            SELECT p.*, pa.current_ability, pa.potential_ability, c.name as Club, l.name as League 
            FROM players p 
            JOIN player_ability pa ON pa.player_id = p.id
            JOIN clubs c ON p.club_id = c.id 
            JOIN leagues l ON c.league_id = l.id 
            WHERE l.name = ? OR l.name = ?
        `).bind(dbLeagueName, targetLeague); // Try both just in case

        const playersResult = await playersQuery.all();

        if (!playersResult.success) {
            console.error('[API] Players JOIN query failed:', playersResult.error);
            throw new Error(`Players query failed: ${playersResult.error}`);
        }

        console.log(`[API] Found ${playersResult.results.length} players`);

        // 2. Fetch unique clubs to build Team objects
        console.log('[API] Executing JOIN query for clubs...');
        const teamsQuery = context.env.DB.prepare(`
            SELECT c.name as Club, l.name as League 
            FROM clubs c 
            JOIN leagues l ON c.league_id = l.id 
            WHERE l.name = ? OR l.name = ?
        `).bind(dbLeagueName, targetLeague);

        const teamsResult = await teamsQuery.all();

        if (!teamsResult.success) {
            console.error('[API] Teams JOIN query failed:', teamsResult.error);
            throw new Error(`Teams query failed: ${teamsResult.error}`);
        }

        console.log(`[API] Found ${teamsResult.results.length} unique clubs`);

        // 3. Construct Team objects
        const teams = teamsResult.results.map((row, index) => {
            const sanitizedName = (row.Club || `unknown_${index}`).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return {
                id: `t_${sanitizedName}`,
                name: row.Club || 'Unknown Club',
                league: row.League || targetLeague,
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
