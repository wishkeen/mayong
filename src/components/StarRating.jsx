import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, size = "md", className = "" }) {
  const dim = size === "lg" ? "w-7 h-7" : size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star`}
        >
          <Star className={`${dim} transition-colors ${n <= value ? "fill-[#D6B56A] text-[#D6B56A]" : "text-[#AAA5B5]/30"}`} />
        </button>
      ))}
    </div>
  );
}