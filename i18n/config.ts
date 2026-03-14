// i18n/config.ts

export const locales = ['zh', 'ja', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';
export const localeStorageKey = "locale";
export const localeCookieName = "vtuber_locale";
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export const localeNames: Record<Locale, string> = {
  zh: '中文',
  ja: '日本語',
  en: 'English',
};

export const localeHtmlLang: Record<Locale, string> = {
  zh: "zh-CN",
  ja: "ja-JP",
  en: "en",
};

export function parseLocale(value: string | null | undefined): Locale | null {
  return value && locales.includes(value as Locale) ? (value as Locale) : null;
}
