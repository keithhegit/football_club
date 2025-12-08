// Club badge/logo ID mappings
// Logo URL format: https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/fmlogos/{logoId}.png

// ID-based mapping (RECOMMENDED - Primary mapping method)
export const CLUB_LOGO_IDS_BY_ID: Record<number, string> = {
    // English Premier League (league_id = 1) - Correct order from DB
    1: '679',      // Man City
    2: '676',      // Liverpool
    3: '728',      // Tottenham
    4: '680',      // Man UFC (Man United)
    5: '630',      // Chelsea
    6: '602',      // Arsenal
    7: '736',      // West Ham
    8: '603',      // Aston Villa
    9: '650',      // Everton
    10: '609',     // Bournemouth
    11: '688',     // Newcastle
    12: '673',     // Leicester
    13: '740',     // Wolves
    14: '642',     // Crystal Palace
    15: '671',     // Leeds
    16: '654',     // Fulham
    17: '719',     // Southampton
    18: '699',     // Nottm Forest
    19: '614',     // Brighton
    20: '127958',  // Brentford

    // Spanish La Liga (league_id = 2) - Need to verify order
    21: '748',     // Barcelona
    22: '750',     // R. Madrid
    23: '751',     // A. Madrid
    24: '794',     // Sevilla
    25: '828',     // Real San Sebastián
    26: '797',     // Valencia
    27: '806',     // Cádiz
    28: '795',     // Real Hispalis (Real Betis)
    29: '752',     // A. Bilbao
    30: '773',     // Getafe
    31: '798',     // Villarreal
    32: '765',     // Espanyol
    33: '790',     // Vallecano
    34: '799',     // Vigo
    35: '781',     // Mallorca
    36: '796',     // Valladolid
    37: '772',     // Girona
    38: '753',     // Atlético Pamplona (Osasuna)
    39: '746',     // Almería
    40: '764',     // Elche
};

// Name-based mapping (LEGACY - Keep for backwards compatibility)
export const CLUB_LOGO_IDS: Record<string, string> = {
    // English names
    'man utd': '680',
    'manchester united': '680',
    'man ufc': '680',
    'man city': '679',
    'manchester city': '679',
    'arsenal': '602',
    'chelsea': '630',
    'liverpool': '676',
    'tottenham': '728',
    'spurs': '728',
    'west ham': '736',
    'aston villa': '603',
    'everton': '650',
    'bournemouth': '609',
    'newcastle': '688',
    'leicester': '673',
    'wolves': '740',
    'crystal palace': '642',
    'leeds': '671',
    'fulham': '654',
    'southampton': '719',
    'nottingham forest': '699',
    'nottm forest': '699',
    'brighton': '614',
    'brentford': '127958',
    'barcelona': '748',
    'real madrid': '750',
    'atletico madrid': '751',
    'sevilla': '794',
    'real sociedad': '828',
    'valencia': '797',
    'cadiz': '806',
    'betis': '795',
    'athletic bilbao': '752',
    'getafe': '773',
    'villarreal': '798',
    'espanyol': '765',
    'rayo vallecano': '790',
    'celta vigo': '799',
    'mallorca': '781',
    'valladolid': '796',
    'girona': '772',
    'osasuna': '753',
    'almeria': '746',
    'elche': '764',

    // 英格兰超级联赛
    '阿森纳': '602',
    '阿斯顿维拉': '603',
    '曼城': '679',
    '曼联': '680',
    '切尔西': '630',
    '利物浦': '676',
    '热刺': '728',
    '纽卡斯尔': '688',
    '布莱顿': '614',
    '西汉姆': '736',
    '埃弗顿': '650',
    '诺丁汉森林': '699',
    '莱斯特城': '673',
    '利兹联': '671',
    '伯恩茅斯': '609',
    '狼队': '740',
    '富勒姆': '654',
    '南安普顿': '719',
    '水晶宫': '642',
    '布伦特福德': '127958',

    // 西班牙甲级联赛
    '巴塞罗那': '748',
    '皇家马德里': '750',
    '马德里竞技': '751',
    '塞维利亚': '794',
    '皇家社会': '828',
    '瓦伦西亚': '797',
    '加的斯': '806',
    '皇家贝蒂斯': '795',
    '毕尔巴鄂竞技': '752',
    '赫塔菲': '773',
    '比利亚雷亚尔': '798',
    '西班牙人': '765',
    '巴列卡诺': '790',
    '维戈塞尔塔': '799',
    '马洛卡': '781',
    '巴拉多利德': '796',
    '赫罗纳': '772',
    '奥萨苏纳': '753',
    '阿尔梅里亚': '746',
    '埃尔切': '764',
};

// Get logo ID by club ID (RECOMMENDED - Primary method)
export function getClubLogoIdByClubId(clubId: number): string | null {
    return CLUB_LOGO_IDS_BY_ID[clubId] || null;
}

// Get logo ID by club name (LEGACY - Fallback method)
export function getClubLogoId(clubName: string): string | null {
    if (!clubName) return null;
    // direct match
    if (CLUB_LOGO_IDS[clubName]) return CLUB_LOGO_IDS[clubName];
    // normalized match (lowercase, alnum only)
    const key = clubName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return CLUB_LOGO_IDS[key] || null;
}
