import React, { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import StepLogRow from "./StepLogRow";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/lib/LanguageContext";

function fmtDate(d, language) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(language, { month: "short", day: "numeric" });
}

export default function AttemptRow({ session, index }) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const log = (session.progress_log || []).filter(Boolean);
  const total = session.total_steps || log.length;
  const completed = log.filter((e) => e.completed).length;
  const chants = log
    .filter((e) => e.type === "mantra" || e.type === "repetition")
    .reduce((s, e) => s + (e.repetitions || 0), 0);
  const timed = log.filter((e) => e.type === "silence" || e.type === "timer");
  const held = timed.filter((e) => e.completed).length;
  const isDone = session.status === "completed";

  return (
    <div className="rounded-xl border border-white/5 bg-[#0E0C16]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2 text-left min-w-0">
          <span className="text-[10px] uppercase tracking-widest text-[#55506A]">#{index + 1}</span>
          <span className="text-xs text-[#F5F1E8]">{fmtDate(session.created_date, language)}</span>
          <TranslatedText>{isDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D6B56A]" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-[#55506A]" />
          )}</TranslatedText>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#AAA5B5]">
          <TranslatedText>{total > 0 ? <span>{completed}/{total} <TranslatedText>steps</TranslatedText></span> : <span><TranslatedText>{isDone ? "Completed" : "Started"}</TranslatedText></span>}</TranslatedText>
          {chants > 0 && <span>· {chants} <TranslatedText>chants</TranslatedText></span>}
          {timed.length > 0 && <span>· {held}/{timed.length} <TranslatedText>held</TranslatedText></span>}
          <TranslatedText>{open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</TranslatedText>
        </div>
      </button>
      {open && (
        <div className="px-3.5 pb-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#AAA5B5]">
              <TranslatedText>{total > 0 ? `${completed}/${total} steps completed` : "Step detail unavailable"}</TranslatedText>
            </span>
            {chants > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D6B56A]/10 text-[#D6B56A]">{chants} <TranslatedText>chants</TranslatedText></span>
            )}
            {timed.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${held === timed.length ? "bg-[#D6B56A]/10 text-[#D6B56A]" : "bg-white/5 text-[#AAA5B5]"}`}>
                {held}/{timed.length} <TranslatedText>silence/timer held</TranslatedText>
              </span>
            )}
          </div>
          {log.length === 0 ? (
            <p className="text-[10px] text-[#AAA5B5] py-2"><TranslatedText>No step detail recorded for this attempt.</TranslatedText></p>
          ) : (
            <div>
              {log.map((e, i) => (
                <StepLogRow key={i} entry={e} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}