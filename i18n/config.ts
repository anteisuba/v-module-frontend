// i18n/config.ts

export const locales = ['zh', 'ja', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export const localeNames: Record<Locale, string> = {
  zh: '中文',
  ja: '日本語',
  en: 'English',
};

