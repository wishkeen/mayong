import React, { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import StepLogRow from "./StepLogRow";

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AttemptRow({ session, index }) {
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
          <span className="text-xs text-[#F5F1E8]">{fmtDate(session.created_date)}</span>
          {isDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D6B56A]" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-[#55506A]" />
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#AAA5B5]">
          {total > 0 ? <span>{completed}/{total} steps</span> : <span>{isDone ? "Completed" : "Started"}</span>}
          {chants > 0 && <span>· {chants} chants</span>}
          {timed.length > 0 && <span>· {held}/{timed.length} held</span>}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>
      {open && (
        <div className="px-3.5 pb-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#AAA5B5]">
              {total > 0 ? `${completed}/${total} steps completed` : "Step detail unavailable"}
            </span>
            {chants > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D6B56A]/10 text-[#D6B56A]">{chants} chants</span>
            )}
            {timed.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${held === timed.length ? "bg-[#D6B56A]/10 text-[#D6B56A]" : "bg-white/5 text-[#AAA5B5]"}`}>
                {held}/{timed.length} silence/timer held
              </span>
            )}
          </div>
          {log.length === 0 ? (
            <p className="text-[10px] text-[#AAA5B5] py-2">No step detail recorded for this attempt.</p>
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