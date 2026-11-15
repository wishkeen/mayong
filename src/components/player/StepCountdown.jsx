import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function StepCountdown({ seconds = 60, onDone, onMetrics, silent = false }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    onMetrics?.({ elapsed: seconds - remaining, completed: remaining === 0 });
  }, [remaining]);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(ref.current);
          setRunning(false);
          onDone?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const pct = Math.round(((seconds - remaining) / seconds) * 100);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44 rounded-full border-2 border-[#8B6CCF]/40 bg-[#08070D] flex items-center justify-center glow-violet">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(139,108,207,0.12)" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="#8B6CCF"
            strokeWidth="3"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        <div className="text-center">
          <div className="font-display text-5xl text-[#F5F1E8] leading-none font-mono">{mm}:{ss}</div>
          <div className="text-xs text-[#AAA5B5] tracking-widest mt-1">{silent ? "silence" : "timer"}</div>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D6B56A] to-[#8B6CCF] text-[#08070D] flex items-center justify-center"
        >
          {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button
          onClick={() => { setRunning(false); setRemaining(seconds); }}
          className="w-11 h-11 rounded-full border border-white/10 text-[#AAA5B5] flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}