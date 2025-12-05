export async function onRequestPost(context) {
    try {
        const { league } = await context.request.json();
        const targetLeague = league || 'Premier League';

        // 1. Fetch Players
        const playersResult = await context.env.DB
            .prepare('SELECT * FROM fm_players WHERE League = ?')
            .bind(targetLeague)
            .all();

        // 2. Fetch unique clubs to build Team objects
        const teamsResult = await context.env.DB
            .prepare('SELECT DISTINCT Club FROM fm_players WHERE League = ?')
            .bind(targetLeague)
            .all();

        // 3. Construct Team objects (basic info) - in a real scenario we might have a separate teams table
        // For now, we simulate team data from the unique club names
        const teams = teamsResult.results.map((row, index) => {
            // Create deterministic ID based on club name
            // This ensures consistency across loads/re-inits
            const sanitizedName = row.Club.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return {
                id: `t_${sanitizedName}`,
                name: row.Club,
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
        return Response.json({
            success: false,
            error: e.message
        }, { status: 500 });
    }
}
