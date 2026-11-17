import React, { useEffect, useState } from "react";
import TranslatedText from "@/components/TranslatedText";

export default function LocalDemoCategoryForm({ category, onSave, onCancel }) {
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [icon, setIcon] = useState(category?.icon || "");
  const [description, setDescription] = useState(category?.description || "");

  useEffect(() => {
    setName(category?.name || "");
    setSlug(category?.slug || "");
    setIcon(category?.icon || "");
    setDescription(category?.description || "");
  }, [category]);

  const submit = (event) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) return;
    onSave({
      name: nextName,
      slug: (slug.trim() || nextName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")),
      icon: icon.trim(),
      description: description.trim(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-[#171522] p-4">
      <h3 className="font-display text-xl"><TranslatedText>{category ? "Edit category" : "New category"}</TranslatedText></h3>
      <label className="block text-xs text-[#AAA5B5]"><TranslatedText>Name
        </TranslatedText><input value={name} onChange={(event) => setName(event.target.value)} required className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]" />
      </label>
      <label className="block text-xs text-[#AAA5B5]"><TranslatedText>Slug
        </TranslatedText><input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="Auto-generated from name" className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]" />
      </label>
      <label className="block text-xs text-[#AAA5B5]"><TranslatedText>Icon
        </TranslatedText><input value={icon} onChange={(event) => setIcon(event.target.value)} placeholder="Optional emoji" className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]" />
      </label>
      <label className="block text-xs text-[#AAA5B5]"><TranslatedText>Description
        </TranslatedText><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]" />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-[#D6B56A] px-4 py-2 text-sm font-medium text-[#08070D]"><TranslatedText>Save category</TranslatedText></button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[#AAA5B5]"><TranslatedText>Cancel</TranslatedText></button>
      </div>
    </form>
  );
}
