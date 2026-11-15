import React, { useEffect, useState } from "react";

function stepsToText(steps = []) {
  return steps.map((step) => `${step.title || ""}${step.content ? `: ${step.content}` : ""}`.trim()).join("\n");
}

function textToSteps(value) {
  const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.map((line, index) => {
    const [title, ...content] = line.split(":");
    return {
      id: `demo-step-${crypto.randomUUID()}`,
      order: index,
      type: index === lines.length - 1 ? "completion" : "instruction",
      title: title.trim() || `Step ${index + 1}`,
      content: content.join(":").trim() || title.trim(),
    };
  });
}

export default function LocalDemoRitualForm({ ritual, categories, onSave, onCancel }) {
  const [name, setName] = useState(ritual?.name || "");
  const [description, setDescription] = useState(ritual?.description || "");
  const [categoryId, setCategoryId] = useState(ritual?.category_id || categories[0]?.id || "");
  const [duration, setDuration] = useState(ritual?.duration_minutes || 5);
  const [difficulty, setDifficulty] = useState(ritual?.difficulty || "Beginner");
  const [stepsText, setStepsText] = useState(stepsToText(ritual?.steps));
  const [published, setPublished] = useState(ritual?.is_published || false);

  useEffect(() => {
    setName(ritual?.name || "");
    setDescription(ritual?.description || "");
    setCategoryId(ritual?.category_id || categories[0]?.id || "");
    setDuration(ritual?.duration_minutes || 5);
    setDifficulty(ritual?.difficulty || "Beginner");
    setStepsText(stepsToText(ritual?.steps));
    setPublished(ritual?.is_published || false);
  }, [ritual, categories]);

  const submit = (event) => {
    event.preventDefault();
    const category = categories.find((item) => item.id === categoryId);
    onSave({
      name: name.trim(),
      description: description.trim(),
      category_id: category?.id || "",
      category_slug: category?.slug || "",
      category_name: category?.name || "",
      duration_minutes: Math.max(1, Number(duration) || 1),
      difficulty,
      price: 0,
      is_featured: ritual?.is_featured || false,
      is_published: published,
      practice_type: ritual?.practice_type || "meditative",
      source: ritual?.source || "Original RitualOS demonstration content.",
      steps: textToSteps(stepsText),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/10 bg-[#171522] p-4">
      <h3 className="font-display text-xl">{ritual ? "Edit ritual" : "New ritual"}</h3>
      <label className="block text-xs text-[#AAA5B5]">Name
        <input value={name} onChange={(event) => setName(event.target.value)} required className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]" />
      </label>
      <label className="block text-xs text-[#AAA5B5]">Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs text-[#AAA5B5]">Category
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]">
            <option value="">Uncategorized</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="block text-xs text-[#AAA5B5]">Duration (minutes)
          <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]" />
        </label>
      </div>
      <label className="block text-xs text-[#AAA5B5]">Difficulty
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]">
          {["Beginner", "Intermediate", "Advanced"].map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="block text-xs text-[#AAA5B5]">Steps (one per line; use “Title: instructions”)
        <textarea value={stepsText} onChange={(event) => setStepsText(event.target.value)} rows={5} placeholder={"Settle: Find a comfortable position\nBreathe: Take three easy breaths\nFinish: Continue when you are ready"} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0E0C16] p-3 text-sm text-[#F5F1E8]" />
      </label>
      <label className="flex items-center gap-2 text-sm text-[#AAA5B5]">
        <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
        Publish this ritual in the local demo catalog
      </label>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-[#D6B56A] px-4 py-2 text-sm font-medium text-[#08070D]">Save ritual</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[#AAA5B5]">Cancel</button>
      </div>
    </form>
  );
}
