import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function CategoryForm({ open, category, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name || "");
      setSlug(category?.slug || "");
      setIcon(category?.icon || "");
      setDescription(category?.description || "");
    }
  }, [open, category]);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        icon: icon.trim(),
        description: description.trim(),
      };
      if (category) {
        await base44.entities.Category.update(category.id, payload);
      } else {
        await base44.entities.Category.create({ ...payload, sort_order: 999 });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#171522] border-white/10 text-[#F5F1E8]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{category ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-[#AAA5B5]">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#0E0C16] border-white/10" placeholder="Seasonal Rituals" />
          </div>
          <div>
            <Label className="text-xs text-[#AAA5B5]">Slug (leave blank to auto-generate)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-[#0E0C16] border-white/10" placeholder="seasonal-rituals" />
          </div>
          <div>
            <Label className="text-xs text-[#AAA5B5]">Icon (emoji)</Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="bg-[#0E0C16] border-white/10" placeholder="🍂" />
          </div>
          <div>
            <Label className="text-xs text-[#AAA5B5]">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-[#0E0C16] border-white/10" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#AAA5B5]">Cancel</Button>
          <Button onClick={submit} disabled={saving || !name.trim()} className="bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D]">
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}