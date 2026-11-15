import React from "react";
import StepCounter from "./StepCounter";
import { useLanguage } from "@/lib/LanguageContext";
import { isRtl, translateStep } from "@/lib/languages";

export default function StepMantra({ step, onDone, onMetrics }) {
  const { language } = useLanguage();
  const { title, content, mantra } = translateStep(step, language);
  const rtl = isRtl(language);

  return (
    <div className="flex flex-col items-center text-center w-full" dir={rtl ? "rtl" : "ltr"}>
      <h2 className="text-[11px] uppercase tracking-[0.25em] text-[#D6B56A] mb-3">Mantra</h2>

      {title && (
        <h3 className="font-display text-2xl text-[#F5F1E8] mb-4 leading-tight max-w-md">{title}</h3>
      )}

      {mantra && (
        <div className="relative w-full max-w-md mb-4 rounded-3xl border border-[#D6B56A]/30 bg-gradient-to-b from-[#221C33] via-[#191527] to-[#12101C] glow-gold overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 0%, rgba(214,181,106,0.20), transparent 62%)",
            }}
          />
          <div className="relative max-h-[45vh] overflow-y-auto px-5 py-7">
            <p className="font-display text-3xl sm:text-4xl leading-[1.4] tracking-wide text-[#FBF7EC] whitespace-pre-line break-words">
              {mantra}
            </p>
          </div>
        </div>
      )}

      {content && (
        <div className="w-full max-w-md mb-6 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D6B56A] mb-1.5">Instruction</p>
          <p className="text-base leading-relaxed text-[#D8D4E2] whitespace-pre-line">{content}</p>
        </div>
      )}

      {step.repetitions ? (
        <StepCounter target={step.repetitions} onDone={onDone} onMetrics={onMetrics} />
      ) : (
        <p className="text-sm text-[#AAA5B5]">Chant softly and continue when ready.</p>
      )}
    </div>
  );
}