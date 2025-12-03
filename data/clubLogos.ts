// Club badge/logo ID mappings
// Logo URL format: https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/fmlogos/{logoId}.png

// ID-based mapping (RECOMMENDED - Primary mapping method)
export const CLUB_LOGO_IDS_BY_ID: Record<number, string> = {
    // English Premier League (league_id = 1)
    1: '679',      // 曼城 (Man City)
    2: '602',      // 阿森纳 (Arsenal)
    3: '603',      // 阿斯顿维拉 (Aston Villa)
    4: '680',      // 曼联 (Man United)
    5: '630',      // 切尔西 (Chelsea)
    6: '676',      // 利物浦 (Liverpool)
    7: '728',      // 热刺 (Tottenham)
    8: '688',      // 纽卡斯尔 (Newcastle)
    9: '614',      // 布莱顿 (Brighton)
    10: '736',     // 西汉姆 (West Ham)
    11: '650',     // 埃弗顿 (Everton)
    12: '699',     // 诺丁汉森林 (Nottm Forest)
    13: '673',     // 莱斯特城 (Leicester)
    14: '671',     // 利兹联 (Leeds)
    15: '609',     // 伯恩茅斯 (Bournemouth)
    16: '740',     // 狼队 (Wolves)
    17: '654',     // 富勒姆 (Fulham)
    18: '719',     // 南安普顿 (Southampton)
    19: '642',     // 水晶宫 (Crystal Palace)
    20: '127958',  // 布伦特福德 (Brentford)

    // Spanish La Liga (league_id = 2)
    21: '748',     // 巴塞罗那 (Barcelona)
    22: '750',     // 皇家马德里 (R. Madrid)
    23: '751',     // 马德里竞技 (A. Madrid)
    24: '794',     // 塞维利亚 (Sevilla)
    25: '828',     // 皇家社会 (Real San Sebastián)
    26: '797',     // 瓦伦西亚 (Valencia)
    27: '806',     // 加的斯 (Cádiz)
    28: '795',     // 皇家贝蒂斯 (Real Hispalis)
    29: '752',     // 毕尔巴鄂竞技 (A. Bilbao)
    30: '773',     // 赫塔菲 (Getafe)
    31: '798',     // 比利亚雷亚尔 (Villarreal)
    32: '765',     // 西班牙人 (Espanyol)
    33: '790',     // 巴列卡诺 (Vallecano)
    34: '799',     // 维戈塞尔塔 (Vigo)
    35: '781',     // 马洛卡 (Mallorca)
    36: '796',     // 巴拉多利德 (Valladolid)
    37: '772',     // 赫罗纳 (Girona)
    38: '753',     // 奥萨苏纳 (Atlético Pamplona)
    39: '746',     // 阿尔梅里亚 (Almería)
    40: '764',     // 埃尔切 (Elche)
};

// Name-based mapping (LEGACY - Keep for backwards compatibility)
export const CLUB_LOGO_IDS: Record<string, string> = {
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
    return CLUB_LOGO_IDS[clubName] || null;
}
