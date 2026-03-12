// components/ui/LanguageSelector.tsx

"use client";

import { useI18n } from "@/lib/i18n/context";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useState, useEffect, useRef } from "react";

interface LanguageSelectorProps {
  position?: "bottom-right" | "inline";
  className?: string;
  variant?: "light" | "dark";
  menuPosition?: "top" | "bottom";
}

export default function LanguageSelector({
  position = "inline",
  className = "",
  variant = "light",
  menuPosition = "top",
}: LanguageSelectorProps) {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  const containerClass =
    position === "bottom-right"
      ? "fixed bottom-6 right-6 z-[100]"
      : "";

  const buttonClass =
    variant === "dark"
      ? "editorial-button min-h-10 border-white/15 bg-black/30 px-4 py-2 text-[10px] text-white backdrop-blur-md hover:bg-black/45"
      : "editorial-button editorial-button--secondary min-h-10 px-4 py-2 text-[10px]";

  const menuPositionClass =
    menuPosition === "top"
      ? "absolute bottom-full left-0 mb-2"
      : "absolute top-full left-0 mt-2";

  const menuClass =
    variant === "dark"
      ? `${menuPositionClass} z-[100] min-w-[132px] overflow-hidden rounded-[1.2rem] border border-white/12 bg-black/68 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.28)]`
      : `${menuPositionClass} z-[100] min-w-[132px] overflow-hidden rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--editorial-border)_86%,transparent)] bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_96%,transparent)] backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.12)]`;

  const itemClass = (loc: Locale) =>
    variant === "dark"
      ? `w-full px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] transition-colors ${
          locale === loc
            ? "bg-white/12 text-white"
            : "text-white/76 hover:bg-white/8"
        }`
      : `w-full px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] transition-colors ${
          locale === loc
            ? "bg-[color:var(--editorial-accent)] text-[color:var(--editorial-accent-foreground)]"
            : "text-[color:var(--editorial-text)] hover:bg-[color:color-mix(in_srgb,var(--editorial-text)_6%,transparent)]"
        }`;

  return (
    <div className={`relative ${containerClass} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="opacity-72">Lang</span>
        <span>{localeNames[locale]}</span>
        <span className="text-[9px]">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className={menuClass}>
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleLanguageChange(loc)}
              className={itemClass(loc)}
            >
              {localeNames[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
