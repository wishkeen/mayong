import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Check } from "lucide-react";
import { supabaseEntities } from "@/api/supabaseData";
import { useAuth } from "@/lib/AuthContext";
import RitualCover from "@/components/RitualCover";
import { formatPrice } from "@/lib/rituals";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/lib/LanguageContext";
import { translateRitualField } from "@/lib/languages";
import useRefreshOnFocus from "@/hooks/useRefreshOnFocus";
import useRealtimeUnlocks from "@/hooks/useRealtimeUnlocks";
import useRealtimeTables from "@/hooks/useRealtimeTables";

const TABS = [
  { key: "purchased", label: "Purchased" },
  { key: "progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "favorites", label: "Favorites" },
];

export default function MyRituals() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const refreshKey = useRefreshOnFocus();
  const liveRevision = useRealtimeTables([
    ...(user?.id ? [
      { table: "ritual_sessions", filter: `user_id=eq.${user.id}` },
      { table: "favorites", filter: `user_id=eq.${user.id}` },
    ] : []),
    { table: "rituals" },
  ], `my-rituals:${user?.id || "signed-out"}`);
  const [tab, setTab] = useState("purchased");
  const [rituals, setRituals] = useState({});
  const [entitlements, setEntitlements] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const entitlementLoadVersion = useRef(0);

  const refreshEntitlements = useCallback(async () => {
    if (!user?.id) return;
    const version = ++entitlementLoadVersion.current;
    try {
      const rows = await supabaseEntities.Entitlement.filter({ user_id: user.id });
      if (version === entitlementLoadVersion.current) setEntitlements(rows);
    } catch (error) {
      console.error("Could not refresh unlocked rituals:", error);
    }
  }, [user?.id]);

  const handleUnlockRealtime = useCallback((payload) => {
    if (payload?.table === "entitlements" && payload.eventType === "INSERT" && payload.new?.ritual_id) {
      entitlementLoadVersion.current += 1;
      setEntitlements((current) => current.some((row) => row.id === payload.new.id) ? current : [...current, payload.new]);
      return;
    }
    refreshEntitlements();
  }, [refreshEntitlements]);

  useRealtimeUnlocks(user?.id, handleUnlockRealtime);

  useEffect(() => {
    (async () => {
      try {
        const [sess, favs, allRituals] = await Promise.all([
          supabaseEntities.RitualSession.filter({ user_id: user.id }, "-created_date", 50),
          supabaseEntities.Favorite.filter({ user_id: user.id }),
          supabaseEntities.Ritual.list("-created_date", 100),
        ]);
        await refreshEntitlements();
        setSessions(sess);
        setFavorites(favs);
        const map = {};
        allRituals.forEach((r) => (map[r.id] = r));
        setRituals(map);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, refreshKey, refreshEntitlements, liveRevision]);

  const ritualOf = (id) => rituals[id];
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const progressSessions = sessions.filter((s) => s.status === "in_progress");

  const purchasedIds = entitlements.map((e) => e.ritual_id);
  const favIds = favorites.map((f) => f.ritual_id);

  const renderRitualRow = (ritual, action) => {
    if (!ritual) return null;
    return (
      <div key={ritual.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#171522] p-2.5">
        <RitualCover ritual={ritual} className="h-16 w-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-[#F5F1E8] leading-tight truncate">
            {translateRitualField(ritual, "name", language)}
          </p>
          <p className="text-xs text-[#AAA5B5]">{ritual.duration_minutes}<TranslatedText>m · </TranslatedText>{formatPrice(ritual.price)}</p>
        </div>
        {action}
      </div>
    );
  };

  const lists = {
    purchased: purchasedIds.map((rid) =>
      renderRitualRow(ritualOf(rid), (
        <Link key={rid} to={`/player/${rid}`} className="px-3 py-2 rounded-lg bg-[#D6B56A]/10 text-[#D6B56A] text-xs flex items-center gap-1">
          <Play className="w-3 h-3" /> <TranslatedText>Perform</TranslatedText>
        </Link>
      ))
    ),
    progress: progressSessions.map((s) =>
      renderRitualRow(ritualOf(s.ritual_id), (
        <Link key={s.id} to={`/player/${s.ritual_id}`} className="px-3 py-2 rounded-lg bg-[#8B6CCF]/10 text-[#8B6CCF] text-xs flex items-center gap-1">
          <Play className="w-3 h-3" /> <TranslatedText>Continue</TranslatedText>
        </Link>
      ))
    ),
    completed: completedSessions.map((s) =>
      renderRitualRow(ritualOf(s.ritual_id), (
        <span key={s.id} className="px-3 py-2 rounded-lg bg-white/5 text-[#AAA5B5] text-xs flex items-center gap-1">
          <Check className="w-3 h-3" /> <TranslatedText>Done</TranslatedText>
        </span>
      ))
    ),
    favorites: favIds.map((rid) =>
      renderRitualRow(ritualOf(rid), (
        <Link key={rid} to={`/ritual/${rid}`} className="px-3 py-2 rounded-lg bg-white/5 text-[#AAA5B5] text-xs">
          <TranslatedText>View</TranslatedText>
        </Link>
      ))
    ),
  };

  const emptyMsg = {
    purchased: "No purchased rituals yet.",
    progress: "No rituals in progress.",
    completed: "You haven't completed any rituals yet.",
    favorites: "No favorites yet.",
  };

  return (
    <div className="pt-1 space-y-5">
      <h1 className="font-display text-3xl text-[#F5F1E8]"><TranslatedText>My Rituals</TranslatedText></h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        <TranslatedText>{TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
              tab === t.key
                ? "border-[#D6B56A] bg-[#D6B56A]/10 text-[#D6B56A]"
                : "border-white/10 text-[#AAA5B5] bg-[#171522]"
            }`}
          >
            <TranslatedText>{t.label}</TranslatedText>
          </button>
        ))}</TranslatedText>
      </div>

      <TranslatedText>{loading ? (
        <div className="h-40 rounded-2xl bg-[#171522] animate-pulse" />
      ) : lists[tab].length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#171522] p-8 text-center">
          <p className="text-sm text-[#AAA5B5]"><TranslatedText>{emptyMsg[tab]}</TranslatedText></p>
          <Link to="/browse" className="inline-block mt-4 text-xs text-[#D6B56A]"><TranslatedText>Browse rituals</TranslatedText> →</Link>
        </div>
      ) : (
        <div className="space-y-2.5">{lists[tab]}</div>
      )}</TranslatedText>
    </div>
  );
}
