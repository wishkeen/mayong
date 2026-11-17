import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabaseEntities } from "@/api/supabaseData";
import ImageUpload from "@/components/admin/ImageUpload";
import RitualMetadataTranslations from "@/components/admin/RitualMetadataTranslations";
import TranslatedText from "@/components/TranslatedText";
import { PRACTICE_NOTE } from "@/lib/rituals";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const PRACTICE_TYPES = [
  { value: "traditional", label: "Traditional" },
  { value: "spiritual", label: "Spiritual" },
  { value: "symbolic", label: "Symbolic" },
  { value: "meditative", label: "Meditative" },
  { value: "intention", label: "Intention-based" },
];

const empty = {
  name: "", category_id: "", description: "", duration_minutes: 15,
  difficulty: "Beginner", price: 99, source: "", practice_type: "traditional",
  practice_disclaimer: PRACTICE_NOTE,
  image_url: "", is_published: false, is_featured: false, translations: [],
};

export default function RitualForm({ open, ritual, categories, onClose, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(ritual ? { ...empty, ...ritual } : empty);
      setSaveError("");
    }
  }, [open, ritual]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const cat = categories.find((c) => c.id === form.category_id);
      const payload = {
        name: form.name,
        category_id: form.category_id,
        category_slug: cat?.slug,
        category_name: cat?.name,
        description: form.description,
        translations: form.translations,
        duration_minutes: Number(form.duration_minutes) || 0,
        difficulty: form.difficulty,
        price: Number(form.price) || 0,
        source: form.source,
        practice_disclaimer: form.practice_disclaimer,
        image_url: form.image_url,
        practice_type: form.practice_type,
        is_published: !!form.is_published,
        is_featured: !!form.is_featured,
      };
      if (ritual) {
        await supabaseEntities.Ritual.update(ritual.id, payload);
      } else {
        await supabaseEntities.Ritual.create(payload);
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      setSaveError(e?.message || "Could not save this ritual. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="bg-[#171522] border-white/10 text-[#F5F1E8] max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl"><TranslatedText>{ritual ? "Edit Ritual" : "New Ritual"}</TranslatedText></DialogTitle>
          <DialogDescription className="text-[#AAA5B5]">
            <TranslatedText>{ritual ? "Update the ritual details." : "Create a new guided ritual."}</TranslatedText>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {saveError && (
            <p role="alert" className="rounded-lg border border-[#c97a7a]/30 bg-[#c97a7a]/10 px-3 py-2 text-xs text-[#e2a0a0]">
              {saveError}
            </p>
          )}
          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Name</TranslatedText></Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 bg-[#08070D] border-white/10" />
          </div>

          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Category</TranslatedText></Label>
            <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
              <SelectTrigger className="mt-1 bg-[#08070D] border-white/10 text-[#F5F1E8]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#171522] border-white/10 text-[#F5F1E8]">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Cover image</TranslatedText></Label>
            <div className="mt-1">
              <ImageUpload value={form.image_url} onChange={(v) => set("image_url", v)} />
            </div>
            <p className="text-[11px] text-[#AAA5B5] mt-1.5">
              <TranslatedText>
              Required — shown on cards, ritual detail and journey screens.
            </TranslatedText></p>
          </div>

          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Description</TranslatedText></Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="mt-1 bg-[#08070D] border-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Duration (min)</TranslatedText></Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)} className="mt-1 bg-[#08070D] border-white/10" />
            </div>
            <div>
              <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Price (₹)</TranslatedText></Label>
              <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className="mt-1 bg-[#08070D] border-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Difficulty</TranslatedText></Label>
              <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                <SelectTrigger className="mt-1 bg-[#08070D] border-white/10 text-[#F5F1E8]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171522] border-white/10">
                  {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Practice type</TranslatedText></Label>
              <Select value={form.practice_type} onValueChange={(v) => set("practice_type", v)}>
                <SelectTrigger className="mt-1 bg-[#08070D] border-white/10 text-[#F5F1E8]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171522] border-white/10">
                  {PRACTICE_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Source / Provenance</TranslatedText></Label>
            <Textarea value={form.source} onChange={(e) => set("source", e.target.value)} rows={2} className="mt-1 bg-[#08070D] border-white/10" />
          </div>

          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest"><TranslatedText>Practice disclaimer</TranslatedText></Label>
            <Textarea
              value={form.practice_disclaimer}
              onChange={(e) => set("practice_disclaimer", e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-1 bg-[#08070D] border-white/10"
            />
            <p className="mt-1 text-[11px] text-[#AAA5B5]">
              <TranslatedText>Shown on this ritual's details page. Leave blank to hide it.</TranslatedText>
            </p>
          </div>

          <RitualMetadataTranslations
            value={form.translations}
            onChange={(translations) => set("translations", translations)}
          />

          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#08070D] px-4 py-3">
            <div>
              <Label className="text-[#F5F1E8]"><TranslatedText>Published</TranslatedText></Label>
              <p className="text-xs text-[#AAA5B5]"><TranslatedText>Visible to users in browse & home</TranslatedText></p>
            </div>
            <Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#08070D] px-4 py-3">
            <div>
              <Label className="text-[#F5F1E8]"><TranslatedText>Featured</TranslatedText></Label>
              <p className="text-xs text-[#AAA5B5]"><TranslatedText>Show in the featured carousel</TranslatedText></p>
            </div>
            <Switch checked={form.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-[#AAA5B5] text-sm"><TranslatedText>Cancel</TranslatedText></button>
            <button onClick={submit} disabled={saving || !form.name || !form.category_id || !form.image_url} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold text-sm disabled:opacity-50">
              <TranslatedText>{saving ? "Saving…" : ritual ? "Save changes" : "Create ritual"}</TranslatedText>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
