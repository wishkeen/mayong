export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "sa", label: "Sanskrit", native: "संस्कृतम्" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
];

export const DEFAULT_LANGUAGE = "en";
export const RTL_LANGUAGES = ["ar", "ur"];

const SUPPORTED = new Set(LANGUAGES.map((l) => l.code));

export function languageLabel(code) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? `${lang.native} · ${lang.label}` : code;
}

export function isRtl(code) {
  return RTL_LANGUAGES.includes(code);
}

export function detectPreferredLanguage() {
  const candidates =
    typeof navigator !== "undefined"
      ? [...(navigator.languages || []), navigator.language]
      : [];
  for (const tag of candidates) {
    if (!tag) continue;
    const base = String(tag).toLowerCase().split("-")[0];
    if (SUPPORTED.has(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}

/** Base title/content plus any admin-provided translation for the language. */
export function translateStep(step, language) {
  const base = { title: step?.title || "", content: step?.content || "", mantra: "" };
  const list = (step?.translations || []).filter(Boolean);
  const match = list.find((t) => t.language === language);
  const anyMantra = list.find((t) => (t.mantra || "").trim());
  return {
    title: match?.title?.trim() ? match.title : base.title,
    content: match?.content?.trim() ? match.content : base.content,
    mantra: match?.mantra?.trim() ? match.mantra : (anyMantra?.mantra || ""),
  };
}

/** Language codes the ritual actually offers, default language first. */
export function availableLanguagesForSteps(steps = []) {
  const codes = new Set([DEFAULT_LANGUAGE]);
  steps.forEach((step) => {
    (step?.translations || []).forEach((t) => {
      if (t?.language && (t.mantra?.trim() || t.title?.trim() || t.content?.trim())) codes.add(t.language);
    });
  });
  return LANGUAGES.filter((l) => codes.has(l.code)).map((l) => l.code);
}