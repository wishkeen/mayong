import bengali from "@/locales/bn.json";
import hindi from "@/locales/hi.json";

const translations = { bn: bengali, hi: hindi };

export function translatePublicText(text, language) {
  if (typeof text !== "string" || language === "en") return text;
  const phrase = text.trim().replace(/\s+/g, " ");
  return translations[language]?.[phrase] || text;
}
