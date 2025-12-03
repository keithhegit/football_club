import { hashPassword, signJWT } from '../../utils/crypto';
import { jsonResponse, errorResponse } from '../../utils/response';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const { email, password } = await request.json() as any;

        if (!email || !password) {
            return errorResponse('Missing email or password', 400);
        }

        // Fetch user
        const user = await env.DB.prepare(
            'SELECT * FROM users WHERE email = ?'
        ).bind(email).first<any>();

        if (!user) {
            return errorResponse('Invalid credentials', 401);
        }

        // Verify password
        const iterations = parseInt(env.PBKDF2_ITERATIONS || '100000');
        const hash = await hashPassword(password, user.salt, iterations);

        if (hash !== user.password_hash) {
            return errorResponse('Invalid credentials', 401);
        }

        // Generate Token
        const token = await signJWT({ id: user.id, email: user.email, username: user.username }, env.JWT_SECRET);

        // Return user info (excluding sensitive data)
        return jsonResponse({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                created_at: user.created_at
            }
        });

    } catch (err: any) {
        return errorResponse(err.message || 'Internal Server Error');
    }
};
