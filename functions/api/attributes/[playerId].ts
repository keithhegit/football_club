import { verifyJWT } from '../../../utils/crypto';
import { jsonResponse, errorResponse } from '../../../utils/response';

// GET /api/attributes/:playerId
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { params, env } = context;
    const playerId = params.playerId as string;

    try {
        // Fetch player attributes
        const player = await env.DB.prepare(`
            SELECT * FROM players WHERE id = ?
        `).bind(playerId).first();

        if (!player) {
            return errorResponse('Player not found', 404);
        }

        // Fetch CA/PA data
        const ability = await env.DB.prepare(`
            SELECT * FROM player_ability WHERE player_id = ?
        `).bind(playerId).first();

        // Extract attributes from player object
        const attributes = {
            // Technical
            corners: player.corners || 0,
            crossing: player.crossing || 0,
            dribbling: player.dribbling || 0,
            finishing: player.finishing || 0,
            first_touch: player.first_touch || 0,
            free_kick_taking: player.free_kicks || 0,
            heading: player.heading || 0,
            long_shots: player.long_shots || 0,
            long_throws: player.long_throws || 0,
            marking: player.marking || 0,
            passing: player.passing || 0,
            penalty_taking: player.penalty_taking || 0,
            tackling: player.tackling || 0,
            technique: player.technique || 0,

            // Mental
            aggression: player.aggression || 0,
            anticipation: player.anticipation || 0,
            bravery: player.bravery || 0,
            composure: player.composure || 0,
            concentration: player.concentration || 0,
            decisions: player.decisions || 0,
            determination: player.determination || 0,
            flair: player.flair || 0,
            leadership: player.leadership || 0,
            off_the_ball: player.off_the_ball || 0,
            positioning: player.positioning || 0,
            teamwork: player.teamwork || 0,
            vision: player.vision || 0,
            work_rate: player.work_rate || 0,

            // Physical
            acceleration: player.acceleration || 0,
            agility: player.agility || 0,
            balance: player.balance || 0,
            jumping_reach: player.jumping_reach || 0,
            natural_fitness: player.natural_fitness || 0,
            pace: player.pace || 0,
            stamina: player.stamina || 0,
            strength: player.strength || 0,

            // Goalkeeper (if applicable)
            goalkeeper: player.position === 'GK' ? {
                aerial_reach: player.aerial_reach || 0,
                command_of_area: player.command_of_area || 0,
                communication: player.communication || 0,
                eccentricity: player.eccentricity || 0,
                handling: player.handling || 0,
                kicking: player.kicking || 0,
                one_on_ones: player.one_on_ones || 0,
                reflexes: player.reflexes || 0,
                rushing_out: player.rushing_out || 0,
                punching: player.tendency_to_punch || 0,
                throwing: player.throwing || 0,
            } : undefined,

            // Hidden
            hidden: {
                consistency: player.consistency || 10,
                important_matches: player.important_matches || 10,
                injury_proneness: player.injury_proneness || 10,
                versatility: player.versatility || 10,
            }
        };

        return jsonResponse({
            player_id: player.id,
            name: player.name,
            age: player.age,
            position: player.position,
            attributes,
            ability: ability || {
                current_ability: 100,
                potential_ability: 120,
                recommended_ca: 100
            }
        });
    } catch (err: any) {
        console.error('Attributes API error:', err);
        return errorResponse('Failed to fetch attributes: ' + err.message, 500);
    }
};

// PUT /api/attributes/:playerId
// Update player attributes (used by training/match system)
export const onRequestPut: PagesFunction<Env> = async (context) => {
    const { request, params, env } = context;
    const playerId = params.playerId as string;

    // Require authentication for updates
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        await verifyJWT(token, env.JWT_SECRET);

        const { attributes, ability } = await request.json<{
            attributes?: Record<string, number>;
            ability?: { ca?: number; pa?: number; rca?: number };
        }>();

        // Update visible attributes if provided
        if (attributes) {
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            for (const [key, value] of Object.entries(attributes)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(value);
            }

            if (updateFields.length > 0) {
                updateValues.push(playerId);
                await env.DB.prepare(`
                    UPDATE players 
                    SET ${updateFields.join(', ')}, last_updated = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).bind(...updateValues).run();
            }
        }

        // Update CA/PA if provided
        if (ability) {
            const abilityRow = await env.DB.prepare(`
                SELECT COUNT(*) as count FROM player_ability WHERE player_id = ?
            `).bind(playerId).first();

            if (abilityRow && abilityRow.count === 0) {
                // Insert new ability record
                await env.DB.prepare(`
                    INSERT INTO player_ability (player_id, current_ability, potential_ability, recommended_ca)
                    VALUES (?, ?, ?, ?)
                `).bind(
                    playerId,
                    ability.ca || 100,
                    ability.pa || 120,
                    ability.rca || ability.ca || 100
                ).run();
            } else {
                // Update existing
                const updateFields: string[] = [];
                const updateValues: any[] = [];

                if (ability.ca !== undefined) {
                    updateFields.push('current_ability = ?');
                    updateValues.push(ability.ca);
                }
                if (ability.pa !== undefined) {
                    updateFields.push('potential_ability = ?');
                    updateValues.push(ability.pa);
                }
                if (ability.rca !== undefined) {
                    updateFields.push('recommended_ca = ?');
                    updateValues.push(ability.rca);
                }

                if (updateFields.length > 0) {
                    updateValues.push(playerId);
                    await env.DB.prepare(`
                        UPDATE player_ability
                        SET ${updateFields.join(', ')}, last_updated = CURRENT_TIMESTAMP
                        WHERE player_id = ?
                    `).bind(...updateValues).run();
                }
            }
        }

        return jsonResponse({ success: true });
    } catch (err: any) {
        console.error('Attributes update error:', err);
        return errorResponse('Failed to update attributes: ' + err.message, 500);
    }
};
