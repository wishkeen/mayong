import React from "react";
import { Link } from "react-router-dom";
import TranslatedText from "@/components/TranslatedText";

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/browse/${category.slug}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B56A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08070D]"
    >
      <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-gradient-to-b from-[#211D2D] to-[#171522] p-3 text-center transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#D6B56A]/35 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl border border-[#D6B56A]/15 bg-[#D6B56A]/[0.07] text-2xl drop-shadow-[0_0_14px_rgba(214,181,106,0.30)]" aria-hidden="true">
          {category.icon || "✦"}
        </span>
        <span className="text-xs font-medium leading-snug text-[#F5F1E8]">
          <TranslatedText>{category.name}</TranslatedText>
        </span>
      </div>
    </Link>
  );
}