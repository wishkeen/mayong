import React from "react";
import { Link } from "react-router-dom";

export default function CategoryCard({ category }) {
  return (
    <Link to={`/browse/${category.slug}`} className="block">
      <div className="rounded-2xl border border-white/5 bg-[#171522] p-4 flex flex-col items-center text-center min-h-[108px] justify-center hover:border-[#D6B56A]/30 hover:bg-[#171522]/80 transition-colors">
        <span className="text-3xl mb-1.5 drop-shadow-[0_0_14px_rgba(214,181,106,0.40)]">{category.icon}</span>
        <span className="text-xs font-medium text-[#F5F1E8] leading-tight">{category.name}</span>
      </div>
    </Link>
  );
}