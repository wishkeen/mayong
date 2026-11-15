import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabaseEntities } from "@/api/supabaseData";
import ImageUpload from "@/components/admin/ImageUpload";

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
  image_url: "", is_published: false, is_featured: false,
};

export default function RitualForm({ open, ritual, categories, onClose, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(ritual ? { ...empty, ...ritual } : empty);
  }, [open, ritual]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      const cat = categories.find((c) => c.id === form.category_id);
      const payload = {
        name: form.name,
        category_id: form.category_id,
        category_slug: cat?.slug,
        category_name: cat?.name,
        description: form.description,
        duration_minutes: Number(form.duration_minutes) || 0,
        difficulty: form.difficulty,
        price: Number(form.price) || 0,
        source: form.source,
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="bg-[#171522] border-white/10 text-[#F5F1E8] max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{ritual ? "Edit Ritual" : "New Ritual"}</DialogTitle>
          <DialogDescription className="text-[#AAA5B5]">
            {ritual ? "Update the ritual details." : "Create a new guided ritual."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest">Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 bg-[#08070D] border-white/10" />
          </div>

          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest">Category</Label>
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
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest">Cover image</Label>
            <div className="mt-1">
              <ImageUpload value={form.image_url} onChange={(v) => set("image_url", v)} />
            </div>
            <p className="text-[11px] text-[#AAA5B5] mt-1.5">
              Required — shown on cards, ritual detail and journey screens.
            </p>
          </div>

          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest">Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="mt-1 bg-[#08070D] border-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest">Duration (min)</Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => set("duration_minutes", e.target.value)} className="mt-1 bg-[#08070D] border-white/10" />
            </div>
            <div>
              <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest">Price (₹)</Label>
              <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className="mt-1 bg-[#08070D] border-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest">Difficulty</Label>
              <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                <SelectTrigger className="mt-1 bg-[#08070D] border-white/10 text-[#F5F1E8]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171522] border-white/10">
                  {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest">Practice type</Label>
              <Select value={form.practice_type} onValueChange={(v) => set("practice_type", v)}>
                <SelectTrigger className="mt-1 bg-[#08070D] border-white/10 text-[#F5F1E8]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#171522] border-white/10">
                  {PRACTICE_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-[#AAA5B5] text-xs uppercase tracking-widest">Source / Provenance</Label>
            <Textarea value={form.source} onChange={(e) => set("source", e.target.value)} rows={2} className="mt-1 bg-[#08070D] border-white/10" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#08070D] px-4 py-3">
            <div>
              <Label className="text-[#F5F1E8]">Published</Label>
              <p className="text-xs text-[#AAA5B5]">Visible to users in browse & home</p>
            </div>
            <Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#08070D] px-4 py-3">
            <div>
              <Label className="text-[#F5F1E8]">Featured</Label>
              <p className="text-xs text-[#AAA5B5]">Show in the featured carousel</p>
            </div>
            <Switch checked={form.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-[#AAA5B5] text-sm">Cancel</button>
            <button onClick={submit} disabled={saving || !form.name || !form.category_id || !form.image_url} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold text-sm disabled:opacity-50">
              {saving ? "Saving…" : ritual ? "Save changes" : "Create ritual"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}