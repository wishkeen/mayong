import React, { useEffect, useState } from "react";
import { TrendingUp, Target, Flame, Sparkles, LineChart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import JourneyRitualCard from "@/components/journey/JourneyRitualCard";
import AchievedRitualCard from "@/components/journey/AchievedRitualCard";

export default function Journey() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [rituals, setRituals] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const all = await base44.entities.RitualSession.filter(
          { user_id: user.id },
          "-created_date",
          200
        );
        setSessions(all);
        const ids = [...new Set(all.map((s) => s.ritual_id))];
        if (ids.length) {
          const rits = await base44.entities.Ritual.list("-created_date", 100);
          const map = {};
          rits.forEach((r) => (map[r.id] = r));
          setRituals(map);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const groups = {};
  sessions.forEach((s) => {
    (groups[s.ritual_id] ||= []).push(s);
  });
  Object.values(groups).forEach((arr) =>
    arr.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
  );

  const ritualIds = Object.keys(groups);
  const achievedIds = ritualIds.filter((id) =>
    groups[id].some((s) => s.status === "completed")
  );
  const inProgressIds = ritualIds.filter(
    (id) => !groups[id].some((s) => s.status === "completed")
  );

  const completionRate = ritualIds.length
    ? Math.round((achievedIds.length / ritualIds.length) * 100)
    : 0;
  const avgAttempts = achievedIds.length
    ? Math.round(
        achievedIds.reduce(
          (sum, id) => sum + (groups[id].findIndex((s) => s.status === "completed") + 1),
          0
        ) / achievedIds.length
      )
    : 0;

  const stats = [
    { label: "Rituals Attempted", value: ritualIds.length, icon: TrendingUp },
    { label: "Goals Achieved", value: achievedIds.length, icon: Target },
    { label: "Completion Rate", value: `${completionRate}%`, icon: Flame },
    { label: "Avg Attempts", value: avgAttempts || "—", icon: LineChart },
  ];

  return (
    <div className="pt-1 space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[#F5F1E8]">Your Journey</h1>
        <p className="text-sm text-[#AAA5B5] mt-1">
          Every attempt is part of the practice. See how your persistence turned into completion.
        </p>
      </div>

      {loading ? (
        <div className="h-40 rounded-2xl bg-[#171522] animate-pulse" />
      ) : ritualIds.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#171522] p-8 text-center">
          <Sparkles className="w-6 h-6 text-[#8B6CCF] mx-auto mb-2" />
          <p className="text-sm text-[#AAA5B5]">Your journey begins with your first ritual.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl border border-white/5 bg-[#171522] p-4">
                  <Icon className="w-4 h-4 text-[#D6B56A] mb-2" />
                  <div className="font-display text-3xl text-[#F5F1E8] leading-none">{s.value}</div>
                  <div className="text-[11px] text-[#AAA5B5] uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              );
            })}
          </div>

          {achievedIds.length > 0 && (
            <section>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5] mb-3">Goals Achieved</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievedIds.map((id) => (
                  <AchievedRitualCard key={id} ritual={rituals[id]} sessions={groups[id]} />
                ))}
              </div>
            </section>
          )}

          {inProgressIds.length > 0 && (
            <section>
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5] mb-3">Still In Progress</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inProgressIds.map((id) => (
                  <JourneyRitualCard key={id} ritual={rituals[id]} sessions={groups[id]} achieved={false} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}