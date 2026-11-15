import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import StarRating from "@/components/StarRating";

const MOODS = [
  { key: "peaceful", emoji: "🌙", label: "Peaceful" },
  { key: "inspired", emoji: "✨", label: "Inspired" },
  { key: "energized", emoji: "🔥", label: "Energized" },
  { key: "emotional", emoji: "💧", label: "Emotional" },
  { key: "neutral", emoji: "☁️", label: "Neutral" },
];

export default function Completion() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [ritual, setRitual] = useState(null);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [mood, setMood] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await base44.entities.RitualSession.get(sessionId);
        setSession(s);
        if (s.ritual_id) {
          try {
            const r = await base44.entities.Ritual.get(s.ritual_id);
            setRitual(r);
          } catch {}
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [sessionId]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.JournalEntry.create({
        user_id: user.id,
        session_id: sessionId,
        ritual_id: session.ritual_id,
        ritual_name: session.ritual_name || ritual?.name,
        notes,
        rating,
        mood,
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-mystic flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D6B56A]/30 border-t-[#D6B56A] rounded-full animate-spin" />
      </div>
    );
  }

  const completedDate = session.completed_at ? new Date(session.completed_at) : new Date();

  return (
    <div className="min-h-screen bg-mystic text-[#F5F1E8] max-w-md mx-auto px-5 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D6B56A] to-[#8B6CCF] flex items-center justify-center glow-gold mb-5">
          <Check className="w-10 h-10 text-[#08070D]" />
        </div>
        <h1 className="font-display text-4xl text-[#F5F1E8]">Ritual Completed</h1>
        <p className="text-sm text-[#AAA5B5] mt-2">
          {session.ritual_name || ritual?.name}
        </p>
        <p className="text-xs text-[#AAA5B5] mt-1">
          {completedDate.toLocaleString(undefined, {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/5 bg-[#171522] p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-[#D6B56A]" />
          <h2 className="text-sm tracking-wide text-[#F5F1E8]">Journal Entry</h2>
        </div>

        {saved ? (
          <div className="text-center py-6">
            <p className="text-[#D6B56A] text-sm">✦ Saved to your journal</p>
            <div className="mt-5 flex flex-col gap-2">
              <Link to="/my-rituals" className="py-3 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold text-sm">
                Go to My Rituals
              </Link>
              <Link to="/journal" className="py-3 rounded-xl border border-white/10 text-[#AAA5B5] text-sm">
                View Journal
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">How do you feel?</label>
              <div className="mt-2 flex justify-between">
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMood(mood === m.key ? "" : m.key)}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-colors ${
                      mood === m.key
                        ? "border-[#D6B56A] bg-[#D6B56A]/10"
                        : "border-white/5 bg-[#08070D]"
                    }`}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-[9px] text-[#AAA5B5]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Rating</label>
              <div className="mt-2">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Reflect on your experience, intentions, or anything that arose…"
                className="mt-2 w-full rounded-xl bg-[#08070D] border border-white/10 p-3 text-sm text-[#F5F1E8] placeholder:text-[#AAA5B5]/50 resize-none focus:outline-none focus:border-[#D6B56A]/40"
              />
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold tracking-wide disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Journal Entry"}
            </button>
            <Link to="/my-rituals" className="block text-center text-xs text-[#AAA5B5]">
              Skip for now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}