import { authService } from './auth';

export interface GameSave {
    id: number;
    name: string;
    updated_at: number;
}

export const saveService = {
    async getSaves(): Promise<GameSave[]> {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch('/api/saves', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch saves');
        return response.json();
    },

    async saveGame(name: string, data: any): Promise<{ success: boolean; id: number }> {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch('/api/saves', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, data })
        });

        if (!response.ok) throw new Error('Failed to save game');
        return response.json();
    },

    async loadSave(id: number): Promise<any> {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`/api/saves/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load save');
        return response.json();
    },

    async deleteSave(id: number): Promise<void> {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`/api/saves/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete save');
    }
};
