import { verifyJWT } from '../../utils/crypto';
import { jsonResponse, errorResponse } from '../../utils/response';

export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const id = params.id;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const user = await verifyJWT(token, env.JWT_SECRET);

        const save = await env.DB.prepare(
            'SELECT * FROM game_saves WHERE id = ? AND user_id = ?'
        ).bind(id, user.id).first();

        if (!save) {
            return errorResponse('Save not found', 404);
        }

        // Parse the JSON data string back to object
        if (typeof save.data === 'string') {
            save.data = JSON.parse(save.data);
        }

        return jsonResponse(save);
    } catch (err) {
        return errorResponse('Unauthorized', 401);
    }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const id = params.id;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const user = await verifyJWT(token, env.JWT_SECRET);

        const result = await env.DB.prepare(
            'DELETE FROM game_saves WHERE id = ? AND user_id = ?'
        ).bind(id, user.id).run();

        if (result.meta.changes === 0) {
            return errorResponse('Save not found or not authorized', 404);
        }

        return jsonResponse({ success: true });
    } catch (err) {
        return errorResponse('Unauthorized', 401);
    }
};
