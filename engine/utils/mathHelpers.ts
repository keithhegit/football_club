// Mathematical helper functions for match engine

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Calculate weighted average of values
 */
export function weightedAverage(
    values: number[],
    weights: number[]
): number {
    if (values.length !== weights.length) {
        throw new Error('Values and weights arrays must have same length');
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);
    return weightedSum / totalWeight;
}

/**
 * Generate random number between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(randomBetween(min, max + 1));
}

/**
 * Select random item from array with weighted probabilities
 */
export function weightedRandom<T>(
    items: T[],
    weights: number[]
): T {
    if (items.length !== weights.length) {
        throw new Error('Items and weights arrays must have same length');
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }

    return items[items.length - 1];
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * clamp(t, 0, 1);
}
