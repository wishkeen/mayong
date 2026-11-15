import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { detectPreferredLanguage } from "@/lib/languages";

const STORAGE_KEY = "ritualos_language";
const LanguageContext = createContext(null);

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function LanguageProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [language, setLanguageState] = useState(() => readStored() || detectPreferredLanguage());

  // Adopt the language saved on the user's profile once they are signed in.
  useEffect(() => {
    if (isAuthenticated && user?.preferred_language) {
      setLanguageState(user.preferred_language);
    }
  }, [isAuthenticated, user?.preferred_language]);

  const setLanguage = useCallback((code) => {
    if (!code) return;
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* storage unavailable */
    }
    if (isAuthenticated && user?.id && user.preferred_language !== code) {
      base44.auth.updateMe({ preferred_language: code }).catch((e) => console.error(e));
    }
  }, [isAuthenticated, user?.id, user?.preferred_language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}