import { TacticalInstructions } from '../../types';

export interface TacticModifiers {
    tempo: number;      // 0.5 - 1.5 (Speed of play)
    width: number;      // 0.5 - 1.5 (Pitch usage)
    pressing: number;   // 0.5 - 1.5 (Defensive aggression)
    directness: number; // 0.0 - 1.0 (Long ball tendency)
    defensiveLine: number; // 0.0 - 1.0 (High line vs Low block)
}

export function parseTacticModifiers(instructions: TacticalInstructions): TacticModifiers {
    // Default values
    const mods: TacticModifiers = {
        tempo: 1.0,
        width: 1.0,
        pressing: 1.0,
        directness: 0.5,
        defensiveLine: 0.5
    };

    if (!instructions) return mods;

    // Tempo
    // 0-100 scale in instructions -> 0.5 to 1.5 modifier
    mods.tempo = 0.5 + (instructions.inPossession.tempo / 100);

    // Width
    mods.width = 0.5 + (instructions.inPossession.width / 100);

    // Pressing Intensity
    mods.pressing = 0.5 + (instructions.outOfPossession.pressingIntensity / 100);

    // Passing Directness
    // 0 (Short) -> 100 (Direct)
    mods.directness = instructions.inPossession.passingDirectness / 100;

    // Defensive Line
    mods.defensiveLine = instructions.outOfPossession.defensiveLine / 100;

    // Mentality Adjustments (Global overrides)
    switch (instructions.mentality) {
        case 'Very Defensive':
            mods.tempo *= 0.8;
            mods.pressing *= 0.8;
            mods.defensiveLine *= 0.6;
            break;
        case 'Defensive':
            mods.tempo *= 0.9;
            break;
        case 'Attacking':
            mods.tempo *= 1.1;
            mods.pressing *= 1.1;
            mods.defensiveLine *= 1.2;
            break;
        case 'Very Attacking':
            mods.tempo *= 1.2;
            mods.pressing *= 1.3;
            mods.defensiveLine *= 1.4;
            mods.directness += 0.2;
            break;
    }

    return mods;
}
