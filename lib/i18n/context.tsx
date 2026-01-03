// lib/i18n/context.tsx

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { locales, localeNames, defaultLocale, type Locale } from "@/i18n/config";
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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // 从 localStorage 读取保存的语言
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = messages[locale];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key "${key}" not found for locale "${locale}"`);
        return key;
      }
    }
    
    return typeof value === "string" ? value : key;
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

