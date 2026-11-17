import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { STEP_TYPE_LABELS, formatDuration } from "@/lib/rituals";
import TranslatedText from "@/components/TranslatedText";

export default function StepLogRow({ entry, index }) {
  if (!entry) return null;
  const label = STEP_TYPE_LABELS[entry.type] || entry.type;
  const isChant = entry.type === "mantra" || entry.type === "repetition";
  const isTimed = entry.type === "timer" || entry.type === "silence";

  return (
    <div className="flex items-start gap-2 py-2 border-t border-white/5">
      <span className="text-[10px] text-[#55506A] pt-0.5 w-5 text-right">{index + 1}</span>
      <TranslatedText>{entry.completed ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-[#D6B56A] mt-0.5 flex-shrink-0" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-[#55506A] mt-0.5 flex-shrink-0" />
      )}</TranslatedText>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#F5F1E8] truncate"><TranslatedText>{entry.title || label}</TranslatedText></p>
        <p className="text-[10px] text-[#AAA5B5]">
          <TranslatedText>{label}</TranslatedText>
          {isChant && entry.target_repetitions ? <> · {entry.repetitions}/{entry.target_repetitions} <TranslatedText>chants</TranslatedText></> : ""}
          {isChant && !entry.target_repetitions && entry.repetitions ? <> · {entry.repetitions} <TranslatedText>chants</TranslatedText></> : ""}
          {isTimed && entry.target_seconds ? ` · ${formatDuration(entry.elapsed_seconds)} / ${formatDuration(entry.target_seconds)}` : ""}
        </p>
      </div>
      <TranslatedText>{isTimed && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${entry.completed ? "bg-[#D6B56A]/15 text-[#D6B56A]" : "bg-white/5 text-[#AAA5B5]"}`}>
          <TranslatedText>{entry.completed ? "Held" : "Skipped"}</TranslatedText>
        </span>
      )}</TranslatedText>
    </div>
  );
}