// Potential Ability (PA) text descriptions for FM-style display
// Hides exact PA numbers and uses descriptive text instead

export function getPotentialDescription(pa: number): string {
    if (pa >= 170) return "World Class";
    if (pa >= 150) return "Leading Player";
    if (pa >= 130) return "Key Player";
    if (pa >= 110) return "First Team Player";
    if (pa >= 90) return "Squad Player";
    return "Backup Player";
}

export function getPotentialDescriptionChinese(pa: number): string {
    if (pa >= 170) return "世界级";
    if (pa >= 150) return "顶级球员";
    if (pa >= 130) return "关键球员";
    if (pa >= 110) return "主力球员";
    if (pa >= 90) return "轮换球员";
    return "替补球员";
}

// Scout report style potential range
export function getScoutPotentialRange(pa: number): string {
    if (pa >= 170) return "170+";
    if (pa >= 150) return "150-170";
    if (pa >= 130) return "130-149";
    if (pa >= 110) return "110-129";
    if (pa >= 90) return "90-109";
    return "<90";
}
