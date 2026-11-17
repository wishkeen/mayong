import React, { useState, useEffect } from "react";
import TranslatedText, { useTranslatedValue } from "@/components/TranslatedText";

export default function StepCounter({ target = 108, onDone, onMetrics }) {
  const [count, setCount] = useState(0);
  const pct = Math.min(100, Math.round((count / target) * 100));
  const done = count >= target;
  const countLabel = useTranslatedValue("Count one repetition");

  useEffect(() => {
    onMetrics?.({ repetitions: count, completed: count >= target });
  }, [count]);

  const inc = () => {
    if (done) return;
    const n = count + 1;
    setCount(n);
    if (n >= target) onDone?.();
  };

  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={inc}
        aria-label={countLabel}
        className="relative w-44 h-44 rounded-full border-2 border-[#D6B56A]/40 bg-[#08070D] flex items-center justify-center active:scale-95 transition-transform glow-gold"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(214,181,106,0.12)" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="#D6B56A"
            strokeWidth="3"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        <div className="text-center">
          <div className="font-display text-5xl text-[#F5F1E8] leading-none">{count}</div>
          <div className="text-xs text-[#AAA5B5] tracking-widest mt-1">/ {target}</div>
        </div>
      </button>
      <p className="mt-4 text-xs text-[#AAA5B5]"><TranslatedText>Tap the circle for each repetition</TranslatedText></p>
      <TranslatedText>{done && <p className="mt-2 text-[#D6B56A] text-sm tracking-wide">✦ <TranslatedText>Count complete</TranslatedText></p>}</TranslatedText>
    </div>
  );
}