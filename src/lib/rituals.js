// Shared helpers for RitualOS

export const PRACTICE_LABELS = {
  traditional: "Traditional practice",
  spiritual: "Spiritual practice",
  symbolic: "Symbolic practice",
  meditative: "Meditative practice",
  intention: "Intention-based practice",
};

export const PRACTICE_NOTE =
  "Rituals are offered as traditional, spiritual, symbolic, meditative and intention-based practices. They are not a substitute for professional medical, psychological, or financial advice, and no supernatural or guaranteed outcome is promised.";

export function formatPrice(amount) {
  const n = Number(amount) || 0;
  if (n === 0) return "Free";
  return `₹${n.toLocaleString("en-IN")}`;
}

export function difficultyColor(difficulty) {
  switch (difficulty) {
    case "Beginner":
      return "text-[#D6B56A] border-[#D6B56A]/40 bg-[#D6B56A]/10";
    case "Intermediate":
      return "text-[#8B6CCF] border-[#8B6CCF]/40 bg-[#8B6CCF]/10";
    case "Advanced":
      return "text-[#AAA5B5] border-[#AAA5B5]/40 bg-[#AAA5B5]/10";
    default:
      return "text-[#AAA5B5] border-[#AAA5B5]/40 bg-[#AAA5B5]/10";
  }
}

export const STEP_TYPE_LABELS = {
  instruction: "Instruction",
  mantra: "Mantra",
  repetition: "Repetition",
  timer: "Timer",
  audio: "Audio",
  silence: "Silence",
  completion: "Completion",
};

export function formatDuration(seconds) {
  const s = Number(seconds) || 0;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m > 0 && r > 0) return `${m}m ${r}s`;
  if (m > 0) return `${m}m`;
  return `${r}s`;
}