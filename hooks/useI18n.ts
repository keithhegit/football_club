import { zhCN } from '../locales/zh-CN';

type TranslationKeys = typeof zhCN;

// Helper to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

export const useI18n = () => {
    const t = (key: string, params?: Record<string, string | number>): string => {
        let translation = getNestedValue(zhCN, key) as string;

        if (!translation) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }

        // Replace placeholders like {pos}, {total}, etc.
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                translation = translation.replace(`{${paramKey}}`, String(value));
            });
        }

        return translation;
    };

    return { t };
};
