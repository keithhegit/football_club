import { apiFetch } from './api';

export interface User {
    id: string;
    email: string;
    username: string;
    created_at: number;
}

export interface AuthResponse {
    token: string;
    user: User;
}

const TOKEN_KEY = 'fm2023_token';
const USER_KEY = 'fm2023_user';

export const authService = {
    async register(data: any): Promise<AuthResponse> {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err: any = await response.json();
            throw new Error(err.error || 'Registration failed');
        }

        const result = await response.json() as AuthResponse;
        this.setSession(result);
        return result;
    },

    async login(data: any): Promise<AuthResponse> {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err: any = await response.json();
            throw new Error(err.error || 'Login failed');
        }

        const result = await response.json() as AuthResponse;
        this.setSession(result);
        return result;
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.reload();
    },

    setSession(auth: AuthResponse) {
        localStorage.setItem(TOKEN_KEY, auth.token);
        localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    },

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    getUser(): User | null {
        const userStr = localStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
};
