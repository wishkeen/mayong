import React from "react";
import { Link } from "react-router-dom";
import { Clock, Gem } from "lucide-react";
import RitualCover from "@/components/RitualCover";
import { formatPrice, difficultyColor } from "@/lib/rituals";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/lib/LanguageContext";
import { translateRitualField } from "@/lib/languages";

export default function RitualCard({ ritual, category }) {
  const { language } = useLanguage();
  return (
    <Link
      to={`/ritual/${ritual.id}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B56A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08070D]"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#171522] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-white/10 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)]">
        <RitualCover ritual={ritual} className="h-32 w-full shrink-0" />
        <div className="flex flex-1 flex-col p-3.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#AAA5B5] truncate">
              <TranslatedText>{category?.name || ritual.category_name}</TranslatedText>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${difficultyColor(ritual.difficulty)}`}>
              <TranslatedText>{ritual.difficulty}</TranslatedText>
            </span>
          </div>
          <h3 className="font-display text-lg leading-tight text-[#F5F1E8] line-clamp-2">
            {translateRitualField(ritual, "name", language)}
          </h3>
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="inline-flex items-center gap-1 text-xs text-[#AAA5B5]">
              <Clock className="w-3 h-3" /> {ritual.duration_minutes}<TranslatedText>m
            </TranslatedText></span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#D6B56A]">
              <Gem className="w-3.5 h-3.5" /> {formatPrice(ritual.price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}