import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, BookOpen, Heart, Loader2, Play, Sparkles } from "lucide-react";
import { getUserProfileSummary } from "@/api/supabaseData";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/lib/LanguageContext";
import useRefreshOnFocus from "@/hooks/useRefreshOnFocus";

const metrics = [
  { key: "ritualsCompleted", label: "Completed", icon: Sparkles },
  { key: "ritualsInProgress", label: "In progress", icon: Play },
  { key: "purchases", label: "Rituals owned", icon: Sparkles },
  { key: "favorites", label: "Favorites", icon: Heart },
  { key: "journalEntries", label: "Journal entries", icon: BookOpen },
];

export default function ProfileActivityCard({ userId }) {
  const { language } = useLanguage();
  const refreshKey = useRefreshOnFocus();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getUserProfileSummary(userId)
      .then((result) => { if (active) setSummary(result); })
      .catch((loadError) => {
        console.error("Could not load profile activity:", loadError);
        if (active) setError(loadError.message || "Your account activity could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, refreshKey]);

  return (
    <section className="rounded-2xl border border-white/5 bg-[#171522] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-[#D6B56A]" />
        <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5]"><TranslatedText>Your activity</TranslatedText></h2>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-[#AAA5B5]" role="status">
          <Loader2 className="h-5 w-5 animate-spin" /><span className="sr-only"><TranslatedText>Loading account activity</TranslatedText></span>
        </div>
      ) : error ? (
        <p role="alert" className="text-xs text-[#e0a0a0]">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {metrics.map(({ key, label, icon: Icon }) => (
              <div key={key} className="rounded-xl border border-white/5 bg-[#08070D]/50 p-3">
                <Icon className="mb-2 h-4 w-4 text-[#D6B56A]" />
                <p className="font-display text-2xl text-[#F5F1E8]">{summary[key]}</p>
                <p className="text-[10px] leading-tight text-[#777184]"><TranslatedText>{label}</TranslatedText></p>
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-2 text-[10px] uppercase tracking-widest text-[#777184]"><TranslatedText>Recent sessions</TranslatedText></h3>
            {summary.recentActivity.length === 0 ? (
              <p className="rounded-xl border border-white/5 p-3 text-xs text-[#AAA5B5]">
                <TranslatedText>No sessions yet. Start a ritual to see your progress here.</TranslatedText>
              </p>
            ) : (
              <div className="divide-y divide-white/5">
                {summary.recentActivity.map((session) => (
                  <div key={session.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[#F5F1E8]"><TranslatedText>{session.ritual_name || "Ritual session"}</TranslatedText></p>
                      <p className="text-[11px] text-[#777184]">
                        {session.created_date
                          ? new Date(session.created_date).toLocaleDateString(language, { dateStyle: "medium" })
                          : "Date unavailable"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[10px] capitalize text-[#AAA5B5]">
                      <TranslatedText>{(session.status || "unknown").replaceAll("_", " ")}</TranslatedText>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link to="/my-rituals" className="inline-block text-xs text-[#D6B56A] hover:underline">
            <TranslatedText>View all my rituals</TranslatedText> →
          </Link>
        </>
      )}
    </section>
  );
}
