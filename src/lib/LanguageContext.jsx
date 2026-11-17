import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  DEFAULT_LANGUAGE,
  detectPreferredLanguage,
  isRtl,
  isSupportedContentLanguage,
  isSupportedLanguage,
} from "@/lib/languages";

const STORAGE_KEY = "ritualos_ui_language";
const CONTENT_STORAGE_KEY = "ritualos_content_language";
const LanguageContext = createContext(null);

function readStored(key, fallback, isValid = isSupportedLanguage) {
  try {
    const value = localStorage.getItem(key) || "";
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function LanguageProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [language, setLanguageState] = useState(() => readStored(STORAGE_KEY, detectPreferredLanguage()));
  const [contentLanguage, setContentLanguageState] = useState(() =>
    readStored(CONTENT_STORAGE_KEY, DEFAULT_LANGUAGE, isSupportedContentLanguage)
  );

  useEffect(() => {
    if (isAuthenticated && user?.preferred_language) {
      const preferredLanguage = isSupportedLanguage(user.preferred_language)
        ? user.preferred_language
        : DEFAULT_LANGUAGE;
      setLanguageState(preferredLanguage);
      try {
        localStorage.setItem(STORAGE_KEY, preferredLanguage);
      } catch {
        /* storage unavailable */
      }
    }
  }, [isAuthenticated, user?.preferred_language]);

  const setLanguage = useCallback((code) => {
    if (!isSupportedLanguage(code)) return;
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setContentLanguage = useCallback((code) => {
    if (!isSupportedContentLanguage(code)) return;
    setContentLanguageState(code);
    try {
      localStorage.setItem(CONTENT_STORAGE_KEY, code);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl(language) ? "rtl" : "ltr";
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, contentLanguage, setContentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}