import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LANGUAGES } from "@/lib/languages";
import TranslatedText from "@/components/TranslatedText";

export default function StepTranslations({ translations = [], onChange }) {
  const used = new Set(translations.map((t) => t.language));
  const nextAvailable = LANGUAGES.find((l) => !used.has(l.code));

  const update = (i, key, value) =>
    onChange(translations.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));

  const add = () =>
    nextAvailable &&
    onChange([...translations, { language: nextAvailable.code, mantra: "", title: "", content: "" }]);

  const remove = (i) => onChange(translations.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-xl border border-white/5 bg-[#08070D] p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">
          <TranslatedText>Mantra per language</TranslatedText>
        </Label>
        <button
          type="button"
          onClick={add}
          disabled={!nextAvailable}
          className="inline-flex items-center gap-1 text-[11px] text-[#D6B56A] disabled:opacity-40"
        >
          <Plus className="w-3 h-3" /> <TranslatedText>Add language</TranslatedText>
        </button>
      </div>

      {translations.length === 0 && (
        <p className="text-[11px] text-[#AAA5B5]">
          <TranslatedText>
            No languages yet — the highlighted mantra needs at least one language.
          </TranslatedText>
        </p>
      )}

      {translations.map((t, i) => {
        const options = LANGUAGES.filter((l) => l.code === t.language || !used.has(l.code));
        return (
          <div key={i} className="rounded-lg border border-white/5 bg-[#171522] p-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <Select value={t.language} onValueChange={(v) => update(i, "language", v)}>
                <SelectTrigger className="flex-1 bg-[#08070D] border-white/10 text-[#F5F1E8] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#171522] border-white/10">
                  {options.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.native} · {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-8 h-8 rounded-lg border border-[#c97a7a]/30 text-[#c97a7a] flex items-center justify-center shrink-0"
                aria-label="Remove language"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <Textarea
              value={t.mantra || ""}
              onChange={(e) => update(i, "mantra", e.target.value)}
              rows={3}
              placeholder="Mantra text in this language"
              className="bg-[#08070D] border-white/10 font-display text-base"
            />
            <Input
              value={t.title || ""}
              onChange={(e) => update(i, "title", e.target.value)}
              placeholder="Title in this language (optional)"
              className="bg-[#08070D] border-white/10 h-8 text-sm"
            />
            <Textarea
              value={t.content || ""}
              onChange={(e) => update(i, "content", e.target.value)}
              rows={2}
              placeholder="Instruction in this language (optional)"
              className="bg-[#08070D] border-white/10 text-sm"
            />
          </div>
        );
      })}
    </div>
  );
}
