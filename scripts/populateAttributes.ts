/**
 * Data Migration Script: Populate Player Attributes and CA/PA
 * 
 * This script generates initial attributes and CA/PA values for all players in the database
 * Run this once after schema update to D1
 */

import { calculateCA, distributeCAToAttributes, generatePA } from '../services/capaCalculator';

interface Player {
    id: number;
    name: string;
    position: string;
    age: number;
    club_id: number;
}

// Position mapping from CSV data to our position codes
const POSITION_MAP: Record<string, string> = {
    'GK': 'GK',
    'D (C)': 'DC',
    'D (L)': 'DL',
    'D (R)': 'DR',
    'WB (L)': 'WBL',
    'WB (R)': 'WBR',
    'DM': 'DM',
    'M (C)': 'MC',
    'M (L)': 'ML',
    'M (R)': 'MR',
    'AM (C)': 'AMC',
    'AM (L)': 'AML',
    'AM (R)': 'AMR',
    'ST': 'ST',
};

function normalizePosition(pos: string): string {
    return POSITION_MAP[pos] || 'MC';
}

// Generate CA based on age and position
function generateInitialCA(age: number, position: string): number {
    let baseCA = 100; // Default

    // Age factor
    if (age < 20) baseCA = 60 + Math.floor(Math.random() * 40); // 60-100
    else if (age < 24) baseCA = 80 + Math.floor(Math.random() * 60); // 80-140
    else if (age < 28) baseCA = 100 + Math.floor(Math.random() * 60); // 100-160
    else if (age < 32) baseCA = 90 + Math.floor(Math.random() * 50); // 90-140
    else baseCA = 70 + Math.floor(Math.random() * 40); // 70-110 (declining)

    // Position adjustments (strikers and GKs tend to have higher CA in our DB)
    if (position === 'ST') baseCA += 10;
    if (position === 'GK') baseCA += 5;

    return Math.min(200, Math.max(1, baseCA));
}

// Main migration function
export async function populatePlayerAttributes(env: Env) {
    console.log('🚀 Starting player attributes population...');

    // Fetch all players
    const players = await env.DB.prepare(`
        SELECT id, name, position, age, club_id FROM players ORDER BY id
    `).all();

    if (!players.results || players.results.length === 0) {
        console.log('❌ No players found in database');
        return;
    }

    console.log(`📊 Found ${players.results.length} players to process`);

    let successCount = 0;
    let errorCount = 0;

    for (const player of players.results as Player[]) {
        try {
            const normalizedPosition = normalizePosition(player.position);
            const initialCA = generateInitialCA(player.age, normalizedPosition);
            const initialPA = generatePA(initialCA, player.age);

            // Generate balanced attributes for this CA
            const attributes = distributeCAToAttributes(initialCA, normalizedPosition);

            // Update player record with generated attributes
            const attrFields = Object.keys(attributes);
            const attrValues = Object.values(attributes);
            const updateSQL = `
                UPDATE players SET 
                ${attrFields.map(k => `${k} = ?`).join(', ')} 
                WHERE id = ?
            `;

            await env.DB.prepare(updateSQL).bind(...attrValues, player.id).run();

            // Insert CA/PA ability record
            await env.DB.prepare(`
                INSERT INTO player_ability 
                (player_id, current_ability, potential_ability, recommended_ca, position_primary)
                VALUES (?, ?, ?, ?, ?)
            `).bind(
                player.id,
                initialCA,
                initialPA,
                initialCA, // RCA = CA initially
                normalizedPosition
            ).run();

            successCount++;

            if (successCount % 100 === 0) {
                console.log(`✅ Processed ${successCount} players...`);
            }
        } catch (err: any) {
            console.error(`❌ Error processing player ${player.id} (${player.name}):`, err.message);
            errorCount++;
        }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   ✅ Success: ${successCount} players`);
    console.log(`   ❌ Errors: ${errorCount} players`);
}

// If run directly via wrangler
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        await populatePlayerAttributes(env);
        return new Response('Migration complete', { status: 200 });
    }
};
