import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import RitualCard from "@/components/RitualCard";

export default function Browse() {
  const { category: activeSlug } = useParams();
  const [categories, setCategories] = useState([]);
  const [rituals, setRituals] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cats = await base44.entities.Category.list("sort_order", 10);
        setCategories(cats);
        const cm = {};
        cats.forEach((c) => (cm[c.id] = c));
        setCatMap(cm);

        const all = await base44.entities.Ritual.filter({ is_published: true }, "sort_order", 60);
        setRituals(all);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = activeSlug ? rituals.filter((r) => r.category_slug === activeSlug) : rituals;
  const activeCat = categories.find((c) => c.slug === activeSlug);

  return (
    <div className="pt-1 space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[#F5F1E8]">Explore Rituals</h1>
        <p className="text-sm text-[#AAA5B5] mt-1">
          {activeCat ? activeCat.description : "Browse all guided rituals across every tradition."}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        <Link
          to="/browse"
          className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
            !activeSlug
              ? "border-[#D6B56A] bg-[#D6B56A]/10 text-[#D6B56A]"
              : "border-white/10 text-[#AAA5B5] bg-[#171522]"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/browse/${c.slug}`}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
              activeSlug === c.slug
                ? "border-[#D6B56A] bg-[#D6B56A]/10 text-[#D6B56A]"
                : "border-white/10 text-[#AAA5B5] bg-[#171522]"
            }`}
          >
            {c.icon} {c.name}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-[#171522] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#171522] p-8 text-center text-sm text-[#AAA5B5]">
          No rituals in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((r) => (
            <RitualCard key={r.id} ritual={r} category={catMap[r.category_id]} />
          ))}
        </div>
      )}
    </div>
  );
}