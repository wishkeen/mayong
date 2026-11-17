import React, { useEffect } from "react";
import { AudioLines, Sparkles } from "lucide-react";
import StepMantra from "./StepMantra";
import StepCounter from "./StepCounter";
import StepCountdown from "./StepCountdown";
import TranslatedText from "@/components/TranslatedText";

export default function StepView({ step, onDone, onMetrics }) {
  useEffect(() => {
    if (!onMetrics || !step) return;
    const t = step.type;
    if (t === "instruction" || t === "audio" || t === "completion" || (t === "mantra" && !step.repetitions)) {
      onMetrics({ completed: true });
    }
  }, [step, onMetrics]);

  if (!step) return null;

  switch (step.type) {
    case "instruction":
      return (
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-[11px] uppercase tracking-[0.25em] text-[#D6B56A] mb-3"><TranslatedText>Instruction</TranslatedText></h2>
          <h3 className="font-display text-3xl text-[#F5F1E8] mb-4 leading-tight"><TranslatedText>{step.title}</TranslatedText></h3>
          <TranslatedText>{step.content && <p className="text-[#AAA5B5] leading-relaxed whitespace-pre-line"><TranslatedText>{step.content}</TranslatedText></p>}</TranslatedText>
        </div>
      );

    case "mantra":
      return <StepMantra step={step} onDone={onDone} onMetrics={onMetrics} />;

    case "repetition":
      return (
        <div className="flex flex-col items-center text-center">
          <h2 className="font-display text-3xl text-[#F5F1E8] mb-1"><TranslatedText>{step.title || "Repetition"}</TranslatedText></h2>
          <TranslatedText>{step.content && <p className="text-sm text-[#AAA5B5] mb-8 max-w-md"><TranslatedText>{step.content}</TranslatedText></p>}</TranslatedText>
          <StepCounter target={step.repetitions || 108} onDone={onDone} onMetrics={onMetrics} />
        </div>
      );

    case "timer":
      return (
        <div className="flex flex-col items-center text-center">
          <h2 className="font-display text-3xl text-[#F5F1E8] mb-1"><TranslatedText>{step.title || "Timer"}</TranslatedText></h2>
          <TranslatedText>{step.content && <p className="text-sm text-[#AAA5B5] mb-8 max-w-md"><TranslatedText>{step.content}</TranslatedText></p>}</TranslatedText>
          <StepCountdown seconds={step.duration_seconds || 60} onDone={onDone} onMetrics={onMetrics} />
        </div>
      );

    case "silence":
      return (
        <div className="flex flex-col items-center text-center">
          <h2 className="font-display text-3xl text-[#F5F1E8] mb-1"><TranslatedText>{step.title || "Silence"}</TranslatedText></h2>
          <p className="text-sm text-[#AAA5B5] mb-8 max-w-md"><TranslatedText>{step.content || "Sit in stillness and observe your breath."}</TranslatedText></p>
          <StepCountdown seconds={step.duration_seconds || 60} onDone={onDone} onMetrics={onMetrics} silent />
        </div>
      );

    case "audio":
      return (
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <AudioLines className="w-10 h-10 text-[#8B6CCF] mb-3" />
          <h2 className="font-display text-3xl text-[#F5F1E8] mb-1"><TranslatedText>{step.title || "Audio"}</TranslatedText></h2>
          <TranslatedText>{step.content && <p className="text-sm text-[#AAA5B5] mb-4"><TranslatedText>{step.content}</TranslatedText></p>}</TranslatedText>
          <TranslatedText>{step.audio_url ? (
            <p className="text-xs text-[#D6B56A] tracking-wide">♪ <TranslatedText>Playing automatically</TranslatedText></p>
          ) : (
            <p className="text-xs text-[#AAA5B5] italic"><TranslatedText>Audio accompaniment coming soon</TranslatedText></p>
          )}</TranslatedText>
        </div>
      );

    case "completion":
      return (
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D6B56A] to-[#8B6CCF] flex items-center justify-center glow-gold mb-4">
            <Sparkles className="w-8 h-8 text-[#08070D]" />
          </div>
          <h2 className="font-display text-4xl text-[#F5F1E8] mb-3"><TranslatedText>{step.title || "Complete Ritual"}</TranslatedText></h2>
          <TranslatedText>{step.content && <p className="text-[#AAA5B5] leading-relaxed"><TranslatedText>{step.content}</TranslatedText></p>}</TranslatedText>
        </div>
      );

    default:
      return null;
  }
}