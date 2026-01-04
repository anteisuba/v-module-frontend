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
      ? "flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-white/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2"
      : "flex items-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 border border-black/20 bg-white/70 text-black hover:bg-white/80 active:bg-white/90 px-3 py-1.5 text-xs cursor-pointer";

  const menuPositionClass =
    menuPosition === "top"
      ? "absolute bottom-full left-0 mb-2"
      : "absolute top-full left-0 mt-2";

  const menuClass =
    variant === "dark"
      ? `${menuPositionClass} z-[100] min-w-[120px] rounded-lg border border-white/20 bg-black/60 backdrop-blur-xl shadow-lg overflow-hidden`
      : `${menuPositionClass} z-[100] min-w-[120px] rounded-lg border border-black/20 bg-white/90 backdrop-blur-xl shadow-lg overflow-hidden`;

  const itemClass = (loc: Locale) =>
    variant === "dark"
      ? `w-full px-3 py-2 text-left text-xs transition-colors ${
          locale === loc
            ? "bg-white/20 text-white"
            : "text-white/80 hover:bg-white/10"
        }`
      : `w-full px-3 py-2 text-left text-xs transition-colors ${
          locale === loc
            ? "bg-black text-white"
            : "text-black hover:bg-black/10"
        }`;

  return (
    <div className={`relative ${containerClass} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        aria-label="Select language"
      >
        <span>{localeNames[locale]}</span>
        <span className="text-[10px]">▼</span>
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

