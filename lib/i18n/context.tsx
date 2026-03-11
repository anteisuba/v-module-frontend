// lib/i18n/context.tsx

"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { locales, defaultLocale, type Locale } from "@/i18n/config";
import zhMessages from "@/i18n/messages/zh.json";
import jaMessages from "@/i18n/messages/ja.json";
import enMessages from "@/i18n/messages/en.json";

type Messages = typeof zhMessages;

const messages: Record<Locale, Messages> = {
  zh: zhMessages,
  ja: jaMessages,
  en: enMessages,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const savedLocale = window.localStorage.getItem("locale");
  return savedLocale && locales.includes(savedLocale as Locale)
    ? (savedLocale as Locale)
    : defaultLocale;
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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
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
