// lib/i18n/context.tsx

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  defaultLocale,
  localeCookieMaxAge,
  localeCookieName,
  localeHtmlLang,
  localeStorageKey,
  parseLocale,
  type Locale,
} from "@/i18n/config";
import zhMessages from "@/i18n/messages/zh.json";
import jaMessages from "@/i18n/messages/ja.json";
import enMessages from "@/i18n/messages/en.json";

type Messages = typeof zhMessages;

const messages: Record<Locale, Messages> = {
  zh: zhMessages,
  ja: jaMessages,
  en: enMessages,
};
const localeChangeEventName = "vtuber:locale-change";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getCookieLocale(): Locale | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${localeCookieName}=`))
    ?.split("=")[1];

  return parseLocale(cookieValue ? decodeURIComponent(cookieValue) : null);
}

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") {
    return null;
  }

  return parseLocale(window.localStorage.getItem(localeStorageKey));
}

function syncDocumentLocale(locale: Locale) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = localeHtmlLang[locale];
  }
}

function persistLocale(locale: Locale) {
  if (typeof document !== "undefined") {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${localeCookieName}=${encodeURIComponent(locale)}; Path=/; Max-Age=${localeCookieMaxAge}; SameSite=Lax${secure}`;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(localeStorageKey, locale);
  }
}

function readPreferredLocale(fallback: Locale): Locale {
  return getCookieLocale() ?? getStoredLocale() ?? fallback;
}

function isLocalePersisted(locale: Locale) {
  return getCookieLocale() === locale && getStoredLocale() === locale;
}

function subscribeToLocale(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStoreChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStoreChange);
  window.addEventListener(localeChangeEventName, handleStoreChange);

  return () => {
    window.removeEventListener("storage", handleStoreChange);
    window.removeEventListener(localeChangeEventName, handleStoreChange);
  };
}

function notifyLocaleChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(localeChangeEventName));
  }
}

function readMessageValue(
  source: Record<string, unknown>,
  key: string
): string | null {
  let value: unknown = source;

  for (const segment of key.split(".")) {
    if (typeof value !== "object" || value === null || !(segment in value)) {
      return null;
    }

    value = (value as Record<string, unknown>)[segment];
  }

  return typeof value === "string" ? value : null;
}

export function I18nProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    () => readPreferredLocale(initialLocale),
    () => initialLocale
  );

  useEffect(() => {
    syncDocumentLocale(locale);

    // Keep cookie + localStorage aligned, including migration from legacy localStorage-only preference.
    if (!isLocalePersisted(locale)) {
      persistLocale(locale);
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    persistLocale(newLocale);
    notifyLocaleChange();
  };

  const t = (key: string): string => {
    const translated = readMessageValue(
      messages[locale] as Record<string, unknown>,
      key
    );

    if (translated == null) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return key;
    }

    return translated;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}
