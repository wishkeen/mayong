import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabaseEntities } from "@/api/supabaseData";
import { useAuth } from "@/lib/AuthContext";
import { useBranding } from "@/lib/BrandingContext";
import CategoryCard from "@/components/CategoryCard";
import RitualCard from "@/components/RitualCard";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/lib/LanguageContext";
import useRefreshOnFocus from "@/hooks/useRefreshOnFocus";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Blessed late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Blessed night";
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const { branding } = useBranding();
  const refreshKey = useRefreshOnFocus();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
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

        const all = await supabaseEntities.Ritual.filter({ is_published: true }, "sort_order", 50);
        const feat = all.filter((r) => r.is_featured).slice(0, 6);
        setFeatured(feat.length ? feat : all.slice(0, 6));

        if (isAuthenticated && user?.id) {
          const sess = await supabaseEntities.RitualSession.filter(
            { user_id: user.id, status: "completed" },
            "-completed_at",
            5
          );
          setRecent(sess);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, user?.id, refreshKey]);

  return (
    <div className="space-y-8 pt-1">
      <section>
        <p className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5]"><TranslatedText>{greeting()}</TranslatedText></p>
        <h1 className="font-display text-3xl leading-tight text-[#F5F1E8] mt-1">
          <TranslatedText>{branding.hero_title ? <TranslatedText>{branding.hero_title}</TranslatedText> : isAuthenticated && user?.email ? (
            <><TranslatedText>Welcome back</TranslatedText><span className="text-gradient-gold">.</span></>
          ) : (
            <><TranslatedText>What are you seeking</TranslatedText><span className="text-gradient-gold">?</span></>
          )}</TranslatedText>
        </h1>
        <p className="text-sm text-[#AAA5B5] mt-2 max-w-xs">
          <TranslatedText>{branding.hero_subtitle || "Guided traditional & spiritual rituals, performed step by step."}</TranslatedText>
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5]"><TranslatedText>Categories</TranslatedText></h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5]"><TranslatedText>Featured rituals</TranslatedText></h2>
          <Link to="/browse" className="text-xs text-[#D6B56A] inline-flex items-center gap-1">
            <TranslatedText>All</TranslatedText> <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="h-40 rounded-2xl bg-[#171522] animate-pulse" />
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {featured.map((r) => (
              <div key={r.id} className="w-44 flex-shrink-0">
                <RitualCard ritual={r} category={catMap[r.category_id]} />
              </div>
            ))}
          </div>
        )}
      </section>

      {isAuthenticated && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5]"><TranslatedText>Recently performed</TranslatedText></h2>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#171522] p-5 text-center">
              <Sparkles className="w-6 h-6 text-[#8B6CCF] mx-auto mb-2" />
              <p className="text-sm text-[#AAA5B5]"><TranslatedText>Your completed rituals will appear here.</TranslatedText></p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((s) => (
                <Link
                  key={s.id}
                  to={`/ritual/${s.ritual_id}`}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[#171522] px-4 py-3"
                >
                  <div>
                    <p className="font-display text-lg text-[#F5F1E8] leading-tight"><TranslatedText>{s.ritual_name}</TranslatedText></p>
                    <p className="text-xs text-[#AAA5B5]">
                      {s.completed_at ? new Date(s.completed_at).toLocaleDateString(language) : ""}
                    </p>
                  </div>
                  <span className="text-[#D6B56A] text-xs"><TranslatedText>Completed</TranslatedText> ✦</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
