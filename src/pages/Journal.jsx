import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { supabaseEntities } from "@/api/supabaseData";
import { useAuth } from "@/lib/AuthContext";
import StarRating from "@/components/StarRating";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/lib/LanguageContext";
import useRefreshOnFocus from "@/hooks/useRefreshOnFocus";
import useRealtimeTables from "@/hooks/useRealtimeTables";

const MOOD_EMOJI = {
  peaceful: "🌙",
  inspired: "✨",
  energized: "🔥",
  emotional: "💧",
  neutral: "☁️",
};

export default function Journal() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const refreshKey = useRefreshOnFocus();
  const liveRevision = useRealtimeTables(
    user?.id ? [{ table: "journal_entries", filter: `user_id=eq.${user.id}` }] : [],
    `journal:${user?.id || "signed-out"}`
  );
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const e = await supabaseEntities.JournalEntry.filter({ user_id: user.id }, "-created_date", 100);
        setEntries(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, refreshKey, liveRevision]);

  return (
    <div className="pt-1 space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[#F5F1E8]"><TranslatedText>Journal</TranslatedText></h1>
        <p className="text-sm text-[#AAA5B5] mt-1"><TranslatedText>Your reflections after each ritual.</TranslatedText></p>
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-[#171522] animate-pulse" />
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#171522] p-8 text-center">
          <BookOpen className="w-6 h-6 text-[#8B6CCF] mx-auto mb-2" />
          <p className="text-sm text-[#AAA5B5]"><TranslatedText>No journal entries yet.</TranslatedText></p>
          <p className="text-xs text-[#AAA5B5] mt-1"><TranslatedText>Complete a ritual to write your first reflection.</TranslatedText></p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="rounded-2xl border border-white/5 bg-[#171522] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/ritual/${e.ritual_id}`} className="font-display text-lg text-[#F5F1E8] leading-tight">
                    <TranslatedText>{e.ritual_name}</TranslatedText>
                  </Link>
                  <p className="text-xs text-[#AAA5B5] mt-0.5">
                    {new Date(e.created_date).toLocaleDateString(language, {
                      dateStyle: "long",
                    })}
                  </p>
                </div>
                {e.mood && <span className="text-2xl">{MOOD_EMOJI[e.mood] || "✦"}</span>}
              </div>
              {e.rating > 0 && (
                <div className="mt-2">
                  <StarRating value={e.rating} size="sm" />
                </div>
              )}
              {e.notes && (
                <p className="mt-2.5 text-sm text-[#AAA5B5] leading-relaxed whitespace-pre-line">{e.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
