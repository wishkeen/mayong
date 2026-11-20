import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabaseEntities } from "@/api/supabaseData";
import RitualCard from "@/components/RitualCard";
import TranslatedText from "@/components/TranslatedText";
import useRefreshOnFocus from "@/hooks/useRefreshOnFocus";
import useRealtimeTables from "@/hooks/useRealtimeTables";

export default function Browse() {
  const { category: activeSlug } = useParams();
  const refreshKey = useRefreshOnFocus();
  const liveRevision = useRealtimeTables([{ table: "categories" }, { table: "rituals" }], "browse-catalog");
  const [categories, setCategories] = useState([]);
  const [rituals, setRituals] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cats = await supabaseEntities.Category.list("sort_order", 10);
        setCategories(cats);
        const cm = {};
        cats.forEach((c) => (cm[c.id] = c));
        setCatMap(cm);

        const all = await supabaseEntities.Ritual.filter({ is_published: true }, "sort_order", 60);
        setRituals(all);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey, liveRevision]);

  const filtered = activeSlug ? rituals.filter((r) => r.category_slug === activeSlug) : rituals;
  const activeCat = categories.find((c) => c.slug === activeSlug);

  return (
    <div className="pt-1 space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[#F5F1E8]"><TranslatedText>Explore Rituals</TranslatedText></h1>
        <p className="text-sm text-[#AAA5B5] mt-1">
          <TranslatedText>{activeCat ? activeCat.description : "Browse all guided rituals across every tradition."}</TranslatedText>
        </p>
      </div>

      <section aria-label="Ritual categories" className="space-y-2">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#AAA5B5]">
          <TranslatedText>Browse by category</TranslatedText>
        </h2>
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-0.5 pb-2 no-scrollbar">
        <Link
          to="/browse"
          aria-current={!activeSlug ? "page" : undefined}
          className={`inline-flex min-h-10 shrink-0 snap-start items-center gap-2 rounded-xl border px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B56A] ${
            !activeSlug
              ? "border-[#D6B56A]/60 bg-[#D6B56A]/10 text-[#F5F1E8]"
              : "border-white/10 bg-[#171522] text-[#AAA5B5] hover:border-white/20 hover:text-[#F5F1E8]"
          }`}
        >
          <span aria-hidden="true">✦</span>
          <TranslatedText>All</TranslatedText>
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/browse/${c.slug}`}
            aria-current={activeSlug === c.slug ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 snap-start items-center gap-2 rounded-xl border px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B56A] ${
              activeSlug === c.slug
                ? "border-[#D6B56A]/60 bg-[#D6B56A]/10 text-[#F5F1E8]"
                : "border-white/10 bg-[#171522] text-[#AAA5B5] hover:border-white/20 hover:text-[#F5F1E8]"
            }`}
          >
            <span aria-hidden="true">{c.icon || "✦"}</span>
            <TranslatedText>{c.name}</TranslatedText>
          </Link>
        ))}
        </div>
      </section>

      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h2 className="text-sm font-medium text-[#F5F1E8]">
          {activeCat ? <TranslatedText>{activeCat.name}</TranslatedText> : <TranslatedText>All rituals</TranslatedText>}
        </h2>
        {!loading && (
          <span className="text-xs text-[#AAA5B5]">
            {filtered.length} <TranslatedText>{filtered.length === 1 ? "ritual" : "rituals"}</TranslatedText>
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-[#171522] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#171522] p-8 text-center text-sm text-[#AAA5B5]">
          <TranslatedText>No rituals in this category yet.</TranslatedText>
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
