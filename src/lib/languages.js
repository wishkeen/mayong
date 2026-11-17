import { translatePublicText } from "@/lib/translation";
import bengaliRitualMetadata from "@/locales/ritualMetadata.bn.json";
import hindiRitualMetadata from "@/locales/ritualMetadata.hi.json";

export const APP_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

export const CONTENT_LANGUAGES = [
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

export const LANGUAGES = CONTENT_LANGUAGES;
export const DEFAULT_LANGUAGE = "en";
export const RTL_LANGUAGES = ["ur", "ar"];

const SUPPORTED_APP_LANGUAGES = new Set(APP_LANGUAGES.map((l) => l.code));
const SUPPORTED_CONTENT_LANGUAGES = new Set(CONTENT_LANGUAGES.map((l) => l.code));
const BUNDLED_RITUAL_METADATA = {
  bn: bengaliRitualMetadata,
  hi: hindiRitualMetadata,
};

export function isSupportedLanguage(code) {
  return SUPPORTED_APP_LANGUAGES.has(code);
}

export function isSupportedContentLanguage(code) {
  return SUPPORTED_CONTENT_LANGUAGES.has(code);
}

export function languageLabel(code) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? `${lang.native} · ${lang.label}` : code;
}

export function isRtl(code) {
  return RTL_LANGUAGES.includes(code);
}

export function translateRitualField(ritual, field, language) {
  const rawTranslations = ritual?.translations;
  const translations = Array.isArray(rawTranslations)
    ? rawTranslations
    : rawTranslations && typeof rawTranslations === "object"
      ? Object.entries(rawTranslations).map(([code, value]) => ({ language: code, ...value }))
      : [];
  const translation = translations.find((item) => item?.language === language);
  const translatedValue = typeof translation?.[field] === "string"
    ? translation[field].trim()
    : "";
  if (translatedValue) return translatedValue;
  const bundledValue = BUNDLED_RITUAL_METADATA[language]?.[ritual?.id]?.[field];
  if (typeof bundledValue === "string" && bundledValue.trim()) return bundledValue;
  return translatePublicText(ritual?.[field] || "", language);
}

export function detectPreferredLanguage() {
  const candidates =
    typeof navigator !== "undefined"
      ? [...(navigator.languages || []), navigator.language]
      : [];
  for (const tag of candidates) {
    if (!tag) continue;
    const base = String(tag).toLowerCase().split("-")[0];
    if (SUPPORTED_APP_LANGUAGES.has(base)) return base;
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
  return CONTENT_LANGUAGES.filter((l) => codes.has(l.code)).map((l) => l.code);
}