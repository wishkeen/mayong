import React from "react";
import { APP_LANGUAGES } from "@/lib/languages";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TranslatedText from "@/components/TranslatedText";

const LANGUAGES = APP_LANGUAGES.filter(({ code }) => code !== "en");
const FIELDS = [
  { key: "name", label: "Ritual name", Component: Input },
  { key: "description", label: "Description", Component: Textarea },
  { key: "source", label: "Source / Provenance", Component: Textarea },
  { key: "practice_disclaimer", label: "Practice disclaimer", Component: Textarea },
];

export default function RitualMetadataTranslations({ value = [], onChange }) {
  const update = (language, field, text) => {
    const current = value.find((item) => item.language === language) || { language };
    const next = value.filter((item) => item.language !== language);
    onChange([...next, { ...current, [field]: text }]);
  };

  return (
    <section className="space-y-3 rounded-xl border border-white/5 bg-[#08070D] p-3">
      <div>
        <h3 className="text-xs font-medium text-[#F5F1E8]">
          <TranslatedText>Ritual details by language</TranslatedText>
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-[#AAA5B5]">
          <TranslatedText>The built-in catalog has offline Bengali and Hindi details. Add translations here for new or custom rituals, including the practice disclaimer. Performance steps and mantras are managed separately.</TranslatedText>
        </p>
      </div>
      {LANGUAGES.map(({ code, native, label }) => {
        const translation = value.find((item) => item.language === code) || {};
        return (
          <details key={code} className="rounded-lg border border-white/5 bg-[#171522] p-3">
            <summary className="cursor-pointer text-xs font-medium text-[#D6B56A]">
              {native} · {label}
            </summary>
            <div className="mt-3 space-y-3">
              {FIELDS.map(({ key, label: fieldLabel, Component }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">
                    <TranslatedText>{fieldLabel}</TranslatedText>
                  </Label>
                  <Component
                    value={translation[key] || ""}
                    onChange={(event) => update(code, key, event.target.value)}
                    {...(key !== "name" ? { rows: key === "description" ? 3 : key === "practice_disclaimer" ? 4 : 2 } : {})}
                    {...(key === "practice_disclaimer" ? { maxLength: 2000 } : {})}
                    className="bg-[#08070D] border-white/10"
                  />
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </section>
  );
}
