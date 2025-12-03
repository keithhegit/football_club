import { verifyJWT } from '../utils/crypto';
import { jsonResponse, errorResponse } from '../utils/response';

export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const user = await verifyJWT(token, env.JWT_SECRET);

        const saves = await env.DB.prepare(
            'SELECT id, name, updated_at FROM game_saves WHERE user_id = ? ORDER BY updated_at DESC'
        ).bind(user.id).all();

        return jsonResponse(saves.results);
    } catch (err) {
        return errorResponse('Unauthorized', 401);
    }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const user = await verifyJWT(token, env.JWT_SECRET);
        const { name, data } = await request.json() as any;

        if (!name || !data) {
            return errorResponse('Missing name or data', 400);
        }

        const result = await env.DB.prepare(
            'INSERT INTO game_saves (user_id, name, data) VALUES (?, ?, ?)'
        ).bind(user.id, name, JSON.stringify(data)).run();

        return jsonResponse({ success: true, id: result.meta.last_row_id });
    } catch (err) {
        return errorResponse('Unauthorized or Error saving', 500);
    }
};
