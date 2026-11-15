import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import RitualCover from "@/components/RitualCover";
import AttemptRow from "./AttemptRow";

export default function JourneyRitualCard({ ritual, sessions, achieved }) {
  const name = ritual?.name || sessions[0]?.ritual_name || "Ritual";
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.created_date) - new Date(b.created_date)
  );
  const attempts = sorted.length;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#171522] overflow-hidden">
      <RitualCover ritual={ritual} className="h-20 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg text-[#F5F1E8] leading-tight truncate">{name}</h3>
          {achieved ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D6B56A]/15 text-[#D6B56A] whitespace-nowrap">Achieved</span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#AAA5B5] whitespace-nowrap">In progress</span>
          )}
        </div>

        <p className="text-[11px] text-[#AAA5B5]">
          {attempts} {attempts === 1 ? "attempt" : "attempts"} · tap an attempt for full details
        </p>

        <div className="space-y-2">
          {sorted.map((s, i) => (
            <AttemptRow key={s.id} session={s} index={i} />
          ))}
        </div>

        {!achieved && (
          <Link
            to={`/player/${sessions[0].ritual_id}`}
            className="inline-flex items-center gap-1 text-xs text-[#D6B56A]"
          >
            Continue <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}