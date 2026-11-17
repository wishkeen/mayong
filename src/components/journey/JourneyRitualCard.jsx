import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import RitualCover from "@/components/RitualCover";
import AttemptRow from "./AttemptRow";
import TranslatedText from "@/components/TranslatedText";

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
          <h3 className="font-display text-lg text-[#F5F1E8] leading-tight truncate"><TranslatedText>{name}</TranslatedText></h3>
          <TranslatedText>{achieved ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D6B56A]/15 text-[#D6B56A] whitespace-nowrap"><TranslatedText>Achieved</TranslatedText></span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#AAA5B5] whitespace-nowrap"><TranslatedText>In progress</TranslatedText></span>
          )}</TranslatedText>
        </div>

        <p className="text-[11px] text-[#AAA5B5]">
          {attempts} <TranslatedText>{attempts === 1 ? "attempt" : "attempts"}</TranslatedText> · <TranslatedText>tap an attempt for full details</TranslatedText>
        </p>

        <div className="space-y-2">
          {sorted.map((s, i) => (
            <AttemptRow key={s.id} session={s} index={i} />
          ))}
        </div>

        <TranslatedText>{!achieved && (
          <Link
            to={`/player/${sessions[0].ritual_id}`}
            className="inline-flex items-center gap-1 text-xs text-[#D6B56A]"
          >
            <TranslatedText>Continue</TranslatedText> <ArrowRight className="w-3 h-3" />
          </Link>
        )}</TranslatedText>
      </div>
    </div>
  );
}