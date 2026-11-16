import React, { useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { useAuth } from "@/lib/AuthContext";

const fieldClass = "mt-1 w-full rounded-lg border border-white/10 bg-[#08070D] px-3 py-2 text-sm text-[#F5F1E8] placeholder:text-[#777184] focus:outline-none focus:ring-1 focus:ring-[#D6B56A]";

export default function ProfileDetailsCard() {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [language, setLanguage] = useState(user?.preferred_language || "en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name || "");
    setLanguage(user?.preferred_language || "en");
  }, [user?.full_name, user?.preferred_language]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await updateProfile({ full_name: fullName.trim(), preferred_language: language });
      setSaved(true);
    } catch (saveError) {
      console.error("Profile details could not be saved:", saveError);
      setError(saveError.message || "Could not save your profile details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-[#171522] p-5">
      <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5] mb-4">Profile details</h2>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs text-[#AAA5B5]">
          Display name
          <input
            value={fullName}
            onChange={(event) => { setFullName(event.target.value); setSaved(false); }}
            maxLength={100}
            autoComplete="name"
            className={fieldClass}
            placeholder="Your name"
          />
        </label>
        <label className="block text-xs text-[#AAA5B5]">
          Preferred language
          <select
            value={language}
            onChange={(event) => { setLanguage(event.target.value); setSaved(false); }}
            className={fieldClass}
          >
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>{item.native} · {item.label}</option>
            ))}
          </select>
        </label>
        {error && <p role="alert" className="text-xs text-[#e0a0a0]">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          {saved && <p role="status" className="text-xs text-[#D6B56A] inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved</p>}
          <button
            type="submit"
            disabled={saving || !fullName.trim()}
            className="ml-auto rounded-lg bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] px-4 py-2 text-xs font-semibold text-[#08070D] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
