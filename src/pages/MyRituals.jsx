import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Check } from "lucide-react";
import { supabaseEntities } from "@/api/supabaseData";
import { useAuth } from "@/lib/AuthContext";
import RitualCover from "@/components/RitualCover";
import { formatPrice } from "@/lib/rituals";

const TABS = [
  { key: "purchased", label: "Purchased" },
  { key: "progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "favorites", label: "Favorites" },
];

export default function MyRituals() {
  const { user } = useAuth();
  const [tab, setTab] = useState("purchased");
  const [rituals, setRituals] = useState({});
  const [entitlements, setEntitlements] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ents, sess, favs, allRituals] = await Promise.all([
          supabaseEntities.Entitlement.filter({ user_id: user.id }),
          supabaseEntities.RitualSession.filter({ user_id: user.id }, "-created_date", 50),
          supabaseEntities.Favorite.filter({ user_id: user.id }),
          supabaseEntities.Ritual.list("-created_date", 100),
        ]);
        setEntitlements(ents);
        setSessions(sess);
        setFavorites(favs);
        const map = {};
        allRituals.forEach((r) => (map[r.id] = r));
        setRituals(map);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

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
          <p className="font-display text-lg text-[#F5F1E8] leading-tight truncate">{ritual.name}</p>
          <p className="text-xs text-[#AAA5B5]">{ritual.duration_minutes}m · {formatPrice(ritual.price)}</p>
        </div>
        {action}
      </div>
    );
  };

  const lists = {
    purchased: purchasedIds.map((rid) =>
      renderRitualRow(ritualOf(rid), (
        <Link key={rid} to={`/player/${rid}`} className="px-3 py-2 rounded-lg bg-[#D6B56A]/10 text-[#D6B56A] text-xs flex items-center gap-1">
          <Play className="w-3 h-3" /> Perform
        </Link>
      ))
    ),
    progress: progressSessions.map((s) =>
      renderRitualRow(ritualOf(s.ritual_id), (
        <Link key={s.id} to={`/player/${s.ritual_id}`} className="px-3 py-2 rounded-lg bg-[#8B6CCF]/10 text-[#8B6CCF] text-xs flex items-center gap-1">
          <Play className="w-3 h-3" /> Continue
        </Link>
      ))
    ),
    completed: completedSessions.map((s) =>
      renderRitualRow(ritualOf(s.ritual_id), (
        <span key={s.id} className="px-3 py-2 rounded-lg bg-white/5 text-[#AAA5B5] text-xs flex items-center gap-1">
          <Check className="w-3 h-3" /> Done
        </span>
      ))
    ),
    favorites: favIds.map((rid) =>
      renderRitualRow(ritualOf(rid), (
        <Link key={rid} to={`/ritual/${rid}`} className="px-3 py-2 rounded-lg bg-white/5 text-[#AAA5B5] text-xs">
          View
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
      <h1 className="font-display text-3xl text-[#F5F1E8]">My Rituals</h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
              tab === t.key
                ? "border-[#D6B56A] bg-[#D6B56A]/10 text-[#D6B56A]"
                : "border-white/10 text-[#AAA5B5] bg-[#171522]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-[#171522] animate-pulse" />
      ) : lists[tab].length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#171522] p-8 text-center">
          <p className="text-sm text-[#AAA5B5]">{emptyMsg[tab]}</p>
          <Link to="/browse" className="inline-block mt-4 text-xs text-[#D6B56A]">Browse rituals →</Link>
        </div>
      ) : (
        <div className="space-y-2.5">{lists[tab]}</div>
      )}
    </div>
  );
}