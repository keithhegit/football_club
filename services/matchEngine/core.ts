import { Team, Player, MatchEvent, TacticalInstructions } from '../../types';
import {
    calculatePassingSuccess,
    calculateShotSuccess,
    calculateTackleSuccess,
    calculateInterceptionSuccess,
    calculateSaveSuccess
} from '../attributeCombinations';
import { PlayerAttributes } from '../../types/attributes';

export interface MatchResult {
    score: { home: number; away: number };
    events: MatchEvent[];
    stats: MatchStats;
}

export interface MatchStats {
    home: TeamStats;
    away: TeamStats;
}

export interface TeamStats {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passCompletion: number;
}

export class MatchEngine {
    private time: number = 0;
    private events: MatchEvent[] = [];
    private score = { home: 0, away: 0 };
    private possessionTeam: 'home' | 'away';
    private stats: MatchStats = {
        home: { possession: 50, shots: 0, shotsOnTarget: 0, passes: 0, passCompletion: 0 },
        away: { possession: 50, shots: 0, shotsOnTarget: 0, passes: 0, passCompletion: 0 }
    };

    // Tactic Modifiers (cached)
    private homeMods: any;
    private awayMods: any;

    constructor(
        private homeTeam: Team,
        private awayTeam: Team
    ) {
        this.possessionTeam = Math.random() > 0.5 ? 'home' : 'away';
        // Initialize stats
        this.homeMods = this.parseTactics(homeTeam.tactics.instructions);
        this.awayMods = this.parseTactics(awayTeam.tactics.instructions);
    }

    private parseTactics(instructions: TacticalInstructions) {
        // Simple parser for now, will be expanded in tacticParser.ts
        return {
            tempo: instructions.inPossession.tempo / 50, // 0.5 - 1.5
            width: instructions.inPossession.width / 50,
            pressing: instructions.outOfPossession.pressingIntensity / 50,
            directness: instructions.inPossession.passingDirectness / 50
        };
    }

    public simulateMatch(): MatchResult {
        this.time = 0;
        this.events = [];
        this.score = { home: 0, away: 0 };

        while (this.time < 90) {
            this.simulateTick();
        }

        return {
            score: this.score,
            events: this.events,
            stats: this.stats
        };
    }

    private simulateTick() {
        // Each tick is roughly 1 minute for MVP
        this.time++;

        const attackingTeam = this.possessionTeam === 'home' ? this.homeTeam : this.awayTeam;
        const defendingTeam = this.possessionTeam === 'home' ? this.awayTeam : this.homeTeam;
        const attMods = this.possessionTeam === 'home' ? this.homeMods : this.awayMods;
        const defMods = this.possessionTeam === 'home' ? this.awayMods : this.homeMods;

        // 1. Determine Event Type based on tactics and randomness
        const eventType = this.decideEventType(attMods);

        // 2. Select Actors
        const attacker = this.selectPlayer(attackingTeam, 'attack');
        const defender = this.selectPlayer(defendingTeam, 'defend');
        const gk = this.selectGK(defendingTeam);

        // Safety check: ensure all players exist
        if (!attacker || !defender || !gk) {
            console.error('Missing player in match', { attacker, defender, gk });
            return; // Skip this tick if players are missing
        }

        // Flatten attributes for calculation
        const attackerAttrs = this.flattenAttributes(attacker);
        const defenderAttrs = this.flattenAttributes(defender);
        const gkAttrs = this.flattenAttributes(gk);

        // 3. Execute Event
        let outcome: 'success' | 'fail' | 'turnover' | 'goal' = 'fail';
        let description = '';

        switch (eventType) {
            case 'PASS':
                const passType = Math.random() < attMods.directness ? 'long' : 'short';
                const passSuccess = calculatePassingSuccess(
                    attackerAttrs,
                    passType,
                    defenderAttrs
                );

                if (Math.random() < passSuccess) {
                    outcome = 'success';
                    description = `${attacker.name} completes a ${passType} pass.`;
                    this.updateStats(this.possessionTeam, 'pass', true);
                } else {
                    outcome = 'turnover';
                    description = `${attacker.name}'s pass is intercepted by ${defender.name}.`;
                    this.updateStats(this.possessionTeam, 'pass', false);
                }
                break;

            case 'SHOT':
                const dist = Math.random() > 0.7 ? 'long' : 'close';
                const shotProb = calculateShotSuccess(
                    attackerAttrs,
                    dist,
                    gkAttrs
                );

                this.updateStats(this.possessionTeam, 'shot', true); // Attempt

                if (Math.random() < shotProb) {
                    outcome = 'goal';
                    description = `GOAL! ${attacker.name} scores with a brilliant finish!`;
                    this.updateStats(this.possessionTeam, 'shotOnTarget', true);
                } else {
                    // Save or Miss
                    if (Math.random() > 0.5) {
                        outcome = 'turnover';
                        description = `${gk.name} makes a save from ${attacker.name}.`;
                        this.updateStats(this.possessionTeam, 'shotOnTarget', true);
                    } else {
                        outcome = 'turnover';
                        description = `${attacker.name} shoots wide.`;
                    }
                }
                break;

            case 'DRIBBLE':
                const tackleSuccess = calculateTackleSuccess(
                    defenderAttrs,
                    attackerAttrs,
                    'standing'
                );

                if (Math.random() > tackleSuccess) {
                    outcome = 'success';
                    description = `${attacker.name} dribbles past ${defender.name}.`;
                } else {
                    outcome = 'turnover';
                    description = `${defender.name} wins the ball with a tackle.`;
                }
                break;
        }

        // 4. Handle Outcome
        if (outcome === 'goal') {
            this.events.push({
                minute: this.time,
                type: 'GOAL',
                description: description,
                teamId: attackingTeam.id,
                playerId: attacker.id
            });
            if (this.possessionTeam === 'home') this.score.home++;
            else this.score.away++;

            // Kickoff resets possession (usually to conceding team)
            this.possessionTeam = this.possessionTeam === 'home' ? 'away' : 'home';

        } else if (outcome === 'turnover') {
            // Only log significant turnovers or random chance to keep log clean
            if (Math.random() < 0.3) {
                this.events.push({
                    minute: this.time,
                    type: 'MISS', // Generic type for now
                    description: description,
                    teamId: attackingTeam.id
                });
            }
            this.possessionTeam = this.possessionTeam === 'home' ? 'away' : 'home';
        } else if (outcome === 'success') {
            // Keep possession, maybe log
            if (Math.random() < 0.2) {
                this.events.push({
                    minute: this.time,
                    type: 'MISS', // Using MISS as generic 'Highlight'
                    description: description,
                    teamId: attackingTeam.id
                });
            }
        }
    }

    private decideEventType(mods: any): 'PASS' | 'SHOT' | 'DRIBBLE' {
        const roll = Math.random();
        // Simple logic: 
        // 0.0 - 0.6: Pass
        // 0.6 - 0.8: Dribble
        // 0.8 - 1.0: Shot (adjusted by tempo/directness)

        if (roll < 0.6) return 'PASS';
        if (roll < 0.85) return 'DRIBBLE';
        return 'SHOT';
    }

    private selectPlayer(team: Team, role: 'attack' | 'defend'): Player | null {
        // Simplified selection: random player from lineup
        // In future: select based on position (e.g., ST for shots)
        const players = team.players; // Assuming team.players contains the match squad

        if (!players || players.length === 0) {
            console.error('Team has no players:', team.name);
            return null;
        }

        return players[Math.floor(Math.random() * players.length)];
    }

    private selectGK(team: Team): Player | null {
        if (!team.players || team.players.length === 0) {
            return null;
        }
        return team.players.find(p => p.position === 'GK') || team.players[0];
    }

    private updateStats(team: 'home' | 'away', type: 'pass' | 'shot' | 'shotOnTarget', success: boolean) {
        const s = this.stats[team];
        if (type === 'pass') {
            s.passes++;
            if (success) s.passCompletion = (s.passCompletion * (s.passes - 1) + 100) / s.passes;
            else s.passCompletion = (s.passCompletion * (s.passes - 1)) / s.passes;
        } else if (type === 'shot') {
            s.shots++;
        } else if (type === 'shotOnTarget') {
            s.shotsOnTarget++;
        }
    }

    private flattenAttributes(player: Player): PlayerAttributes {
        // Safety check: ensure player has attributes structure
        if (!player || !player.attributes) {
            console.error('Player missing attributes:', player);
            // Return a default low-ability player attributes as fallback
            return {
                // Technical (default to 5)
                finishing: 5, dribbling: 5, passing: 5, tackling: 5, technique: 5, firstTouch: 5,
                // Mental (default to 5)  
                vision: 5, decisions: 5, positioning: 5, composure: 5, workRate: 5, anticipation: 5, determination: 5,
                // Physical (default to 5)
                pace: 5, acceleration: 5, stamina: 5, strength: 5, balance: 5, agility: 5,
                // Hidden
                hidden: { consistency: 10, importantMatches: 10, injuryProneness: 10 },
                goalkeeper: undefined
            } as unknown as PlayerAttributes;
        }

        return {
            ...player.attributes.technical,
            ...player.attributes.mental,
            ...player.attributes.physical,
            hidden: player.hidden,
            // GK attributes might be missing on outfield players, handle gracefully if needed
            goalkeeper: (player.attributes as any).goalkeeper
        } as unknown as PlayerAttributes;
    }
}
