import React from "react";
import { Link } from "react-router-dom";
import { Clock, Gem } from "lucide-react";
import RitualCover from "@/components/RitualCover";
import { formatPrice, difficultyColor } from "@/lib/rituals";

export default function RitualCard({ ritual, category }) {
  return (
    <Link to={`/ritual/${ritual.id}`} className="group block">
      <div className="rounded-2xl overflow-hidden border border-white/5 bg-[#171522] transition-transform duration-300 group-hover:-translate-y-0.5">
        <RitualCover ritual={ritual} className="h-28 w-full" />
        <div className="p-3.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#AAA5B5] truncate">
              {category?.name || ritual.category_name}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${difficultyColor(ritual.difficulty)}`}>
              {ritual.difficulty}
            </span>
          </div>
          <h3 className="font-display text-lg leading-tight text-[#F5F1E8] line-clamp-2">{ritual.name}</h3>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs text-[#AAA5B5]">
              <Clock className="w-3 h-3" /> {ritual.duration_minutes}m
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#D6B56A]">
              <Gem className="w-3.5 h-3.5" /> {formatPrice(ritual.price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}