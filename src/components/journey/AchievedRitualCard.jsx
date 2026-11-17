import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Hash, Sparkles, Clock } from "lucide-react";
import RitualCover from "@/components/RitualCover";
import AttemptRow from "./AttemptRow";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/lib/LanguageContext";

function fmtDate(d, language) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(language, { month: "short", day: "numeric", year: "numeric" });
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0E0C16] px-2.5 py-2 text-center">
      <Icon className="w-3.5 h-3.5 text-[#D6B56A] mx-auto mb-1" />
      <div className="font-display text-base text-[#F5F1E8] leading-none">{value}</div>
      <div className="text-[9px] text-[#AAA5B5] uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

export default function AchievedRitualCard({ ritual, sessions }) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const name = ritual?.name || sessions[0]?.ritual_name || "Ritual";
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.created_date) - new Date(b.created_date)
  );
  const attempts = sorted.length;
  const firstCompletedIdx = sorted.findIndex((s) => s.status === "completed");
  const achievedDate = sorted[firstCompletedIdx]?.completed_at;

  let totalChants = 0;
  let totalHeld = 0;
  let totalTimed = 0;
  let totalStepsDone = 0;
  let totalSteps = 0;
  sorted.forEach((s) => {
    const log = (s.progress_log || []).filter(Boolean);
    totalChants += log
      .filter((e) => e.type === "mantra" || e.type === "repetition")
      .reduce((a, e) => a + (e.repetitions || 0), 0);
    const timed = log.filter((e) => e.type === "silence" || e.type === "timer");
    totalTimed += timed.length;
    totalHeld += timed.filter((e) => e.completed).length;
    totalStepsDone += log.filter((e) => e.completed).length;
    totalSteps += s.total_steps || log.length;
  });

  const completionPct = totalSteps ? Math.round((totalStepsDone / totalSteps) * 100) : 100;
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <div className="rounded-2xl border border-[#D6B56A]/20 bg-gradient-to-b from-[#1a1626] to-[#171522] overflow-hidden">
      <RitualCover ritual={ritual} className="h-16 w-full" />
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D6B56A]" />
              <span className="text-[10px] uppercase tracking-widest text-[#D6B56A]"><TranslatedText>Achieved</TranslatedText></span>
            </div>
            <h3 className="font-display text-lg text-[#F5F1E8] leading-tight"><TranslatedText>{name}</TranslatedText></h3>
            <p className="text-[11px] text-[#AAA5B5] mt-0.5">{fmtDate(achievedDate, language)}</p>
          </div>
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(214,181,106,0.12)" strokeWidth="4" />
              <circle
                cx="40"
                cy="40"
                r={R}
                fill="none"
                stroke="#D6B56A"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - completionPct / 100)}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl text-[#D6B56A] leading-none">{attempts}</span>
              <span className="text-[9px] text-[#AAA5B5] uppercase tracking-widest mt-0.5">
                <TranslatedText>{attempts === 1 ? "try" : "tries"}</TranslatedText>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat icon={Hash} label={<TranslatedText>Attempts</TranslatedText>} value={attempts} />
          <Stat icon={Sparkles} label={<TranslatedText>Chants</TranslatedText>} value={totalChants} />
          <Stat icon={Clock} label={<TranslatedText>Held</TranslatedText>} value={totalTimed ? `${totalHeld}/${totalTimed}` : "—"} />
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-[#D6B56A] py-2 rounded-lg border border-[#D6B56A]/20 bg-[#D6B56A]/5"
        >
          <TranslatedText>{open ? (
            <><TranslatedText>Hide attempt details</TranslatedText> <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <><TranslatedText>View attempt details</TranslatedText> <ChevronDown className="w-3.5 h-3.5" /></>
          )}</TranslatedText>
        </button>

        <TranslatedText>{open && (
          <div className="space-y-2">
            {sorted.map((s, i) => (
              <AttemptRow key={s.id} session={s} index={i} />
            ))}
          </div>
        )}</TranslatedText>
      </div>
    </div>
  );
}