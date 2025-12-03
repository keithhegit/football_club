import { hashPassword, generateSalt, signJWT } from '../../utils/crypto';
import { jsonResponse, errorResponse } from '../../utils/response';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const { email, username, password } = await request.json() as any;

        if (!email || !username || !password) {
            return errorResponse('Missing required fields', 400);
        }

        if (password.length < 6) {
            return errorResponse('Password must be at least 6 characters', 400);
        }

        // Check if user exists
        const existingUser = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ? OR username = ?'
        ).bind(email, username).first();

        if (existingUser) {
            return errorResponse('Email or username already exists', 409);
        }

        // Create user
        const salt = generateSalt();
        const iterations = parseInt(env.PBKDF2_ITERATIONS || '100000');
        const passwordHash = await hashPassword(password, salt, iterations);
        const id = crypto.randomUUID();

        await env.DB.prepare(
            'INSERT INTO users (id, email, username, password_hash, salt) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, email, username, passwordHash, salt).run();

        // Generate Token
        const token = await signJWT({ id, email, username }, env.JWT_SECRET);

        return jsonResponse({
            token,
            user: {
                id,
                email,
                username,
                created_at: Math.floor(Date.now() / 1000)
            }
        }, 201);

    } catch (err: any) {
        return errorResponse(err.message || 'Internal Server Error');
    }
};
