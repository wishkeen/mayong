import React, { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabaseEntities } from "@/api/supabaseData";
import AudioUpload from "@/components/admin/AudioUpload";
import StepTranslations from "@/components/admin/StepTranslations";

const STEP_TYPES = [
  { value: "instruction", label: "Instruction" },
  { value: "mantra", label: "Mantra" },
  { value: "repetition", label: "Repetition" },
  { value: "timer", label: "Timer" },
  { value: "audio", label: "Audio" },
  { value: "silence", label: "Silence" },
  { value: "completion", label: "Completion" },
];

const blank = { type: "instruction", title: "", content: "", repetitions: 108, duration_seconds: 60, audio_url: "", translations: [] };

export default function StepEditor({ ritual, onBack }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const all = await supabaseEntities.RitualStep.filter({ ritual_id: ritual.id });
    setSteps(all.sort((a, b) => a.order - b.order));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [ritual.id]);

  const addStep = async () => {
    const order = steps.length;
    const created = await supabaseEntities.RitualStep.create({ ritual_id: ritual.id, order, ...blank });
    setSteps([...steps, created]);
  };

  const updateField = (id, k, v) => {
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, [k]: v } : st)));
  };

  const setAudio = async (id, url) => {
    updateField(id, "audio_url", url);
    try {
      await supabaseEntities.RitualStep.update(id, { audio_url: url });
    } catch (e) {
      console.error(e);
    }
  };

  const saveStep = async (st) => {
    setSavingId(st.id);
    try {
      await supabaseEntities.RitualStep.update(st.id, {
        type: st.type, title: st.title, content: st.content,
        repetitions: Number(st.repetitions) || 0,
        duration_seconds: Number(st.duration_seconds) || 0, audio_url: st.audio_url,
        translations: st.translations || [],
      });
    } finally {
      setSavingId(null);
    }
  };

  const removeStep = async (st) => {
    await supabaseEntities.RitualStep.delete(st.id);
    await load();
  };

  const move = async (st, dir) => {
    const i = steps.findIndex((x) => x.id === st.id);
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const a = steps[i], b = steps[j];
    await supabaseEntities.RitualStep.update(a.id, { order: j });
    await supabaseEntities.RitualStep.update(b.id, { order: i });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-[#AAA5B5] hover:text-[#D6B56A]">
          <ArrowLeft className="w-4 h-4" /> Back to rituals
        </button>
        <h2 className="font-display text-xl text-[#F5F1E8] truncate max-w-[60%] text-right">{ritual.name}</h2>
      </div>

      <p className="text-xs text-[#AAA5B5]">Steps run in order during the ritual player. Reorder with the arrows — changes save instantly.</p>

      {loading ? (
        <div className="h-40 rounded-2xl bg-[#171522] animate-pulse" />
      ) : (
        <div className="space-y-3">
          {steps.map((st, i) => (
            <div key={st.id} className="rounded-2xl border border-white/5 bg-[#171522] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#D6B56A] tracking-widest">STEP {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(st, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg border border-white/10 text-[#AAA5B5] disabled:opacity-30 flex items-center justify-center"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(st, 1)} disabled={i === steps.length - 1} className="w-7 h-7 rounded-lg border border-white/10 text-[#AAA5B5] disabled:opacity-30 flex items-center justify-center"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeStep(st)} className="w-7 h-7 rounded-lg border border-[#c97a7a]/30 text-[#c97a7a] flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Type</Label>
                  <Select value={st.type} onValueChange={(v) => updateField(st.id, "type", v)}>
                    <SelectTrigger className="mt-1 bg-[#08070D] border-white/10 text-[#F5F1E8] h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#171522] border-white/10">
                      {STEP_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Title</Label>
                  <Input value={st.title || ""} onChange={(e) => updateField(st.id, "title", e.target.value)} className="mt-1 bg-[#08070D] border-white/10 h-9" />
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">
                  {st.type === "mantra" ? "Instruction (shown in every language)" : "Content / Instructions"}
                </Label>
                <Textarea value={st.content || ""} onChange={(e) => updateField(st.id, "content", e.target.value)} rows={2} className="mt-1 bg-[#08070D] border-white/10" />
              </div>

              {(st.type === "mantra" || st.type === "repetition") && (
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Repetitions</Label>
                  <Input type="number" value={st.repetitions || ""} onChange={(e) => updateField(st.id, "repetitions", e.target.value)} className="mt-1 bg-[#08070D] border-white/10 h-9" />
                </div>
              )}

              {st.type === "mantra" && (
                <StepTranslations
                  translations={st.translations || []}
                  onChange={(v) => updateField(st.id, "translations", v)}
                />
              )}

              {(st.type === "timer" || st.type === "silence") && (
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Duration (seconds)</Label>
                  <Input type="number" value={st.duration_seconds || ""} onChange={(e) => updateField(st.id, "duration_seconds", e.target.value)} className="mt-1 bg-[#08070D] border-white/10 h-9" />
                </div>
              )}

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Audio accompaniment (auto-plays on this step)</Label>
                <div className="mt-1">
                  <AudioUpload value={st.audio_url || ""} onChange={(v) => setAudio(st.id, v)} />
                </div>
              </div>

              <button onClick={() => saveStep(st)} disabled={savingId === st.id} className="inline-flex items-center gap-1.5 text-xs text-[#D6B56A] disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> {savingId === st.id ? "Saving…" : "Save step"}
              </button>
            </div>
          ))}

          <button onClick={addStep} className="w-full py-3 rounded-xl border border-dashed border-white/15 text-[#AAA5B5] hover:border-[#D6B56A]/40 hover:text-[#D6B56A] text-sm inline-flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add step
          </button>
        </div>
      )}
    </div>
  );
}