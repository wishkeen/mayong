import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabaseEntities } from "@/api/supabaseData";
import TranslatedText from "@/components/TranslatedText";

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function CategoryForm({ open, category, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (open) {
      setName(category?.name || "");
      setSlug(category?.slug || "");
      setIcon(category?.icon || "");
      setDescription(category?.description || "");
      setSaveError("");
    }
  }, [open, category]);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        icon: icon.trim(),
        description: description.trim(),
      };
      if (category) {
        await supabaseEntities.Category.update(category.id, payload);
      } else {
        await supabaseEntities.Category.create({ ...payload, sort_order: 999 });
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error("Could not save category:", error);
      setSaveError(error?.message || "Could not save this category. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#171522] border-white/10 text-[#F5F1E8]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl"><TranslatedText>{category ? "Edit category" : "New category"}</TranslatedText></DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {saveError && <p role="alert" className="text-xs text-[#e2a0a0]">{saveError}</p>}
          <div>
            <Label className="text-xs text-[#AAA5B5]"><TranslatedText>Name</TranslatedText></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#0E0C16] border-white/10" placeholder="Seasonal Rituals" />
          </div>
          <div>
            <Label className="text-xs text-[#AAA5B5]"><TranslatedText>Slug (leave blank to auto-generate)</TranslatedText></Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-[#0E0C16] border-white/10" placeholder="seasonal-rituals" />
          </div>
          <div>
            <Label className="text-xs text-[#AAA5B5]"><TranslatedText>Icon (emoji)</TranslatedText></Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="bg-[#0E0C16] border-white/10" placeholder="🍂" />
          </div>
          <div>
            <Label className="text-xs text-[#AAA5B5]"><TranslatedText>Description</TranslatedText></Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-[#0E0C16] border-white/10" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#AAA5B5]"><TranslatedText>Cancel</TranslatedText></Button>
          <Button onClick={submit} disabled={saving || !name.trim()} className="bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D]">
            <TranslatedText>{saving ? "Saving…" : "Save"}</TranslatedText>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
