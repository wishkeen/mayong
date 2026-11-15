import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import StepView from "@/components/player/StepView";
import ContentLanguageSwitcher from "@/components/player/ContentLanguageSwitcher";
import { availableLanguagesForSteps } from "@/lib/languages";
import { motion, AnimatePresence } from "framer-motion";

export default function RitualPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ritual, setRitual] = useState(null);
  const [steps, setSteps] = useState([]);
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [progressLog, setProgressLog] = useState([]);
  const [stepMetrics, setStepMetrics] = useState({});
  const audioRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.Ritual.get(id);
        setRitual(r);
        const all = await base44.entities.RitualStep.filter({ ritual_id: id });
        const sorted = all.sort((a, b) => a.order - b.order);
        setSteps(sorted);

        const lastIdx = Math.max(sorted.length - 1, 0);
        const open = await base44.entities.RitualSession.filter({
          user_id: user.id,
          ritual_id: id,
          status: "in_progress",
        });

        // Only resume a session that is genuinely part-way through. An attempt
        // left parked on the final step must never be resumed — that is what
        // dropped users straight onto the last step on their next attempt.
        const resumable = open.find(
          (sess) =>
            typeof sess.current_step === "number" && sess.current_step < lastIdx
        );

        let s;
        let startIdx = 0;
        if (resumable) {
          s = resumable;
          startIdx = Math.min(resumable.current_step || 0, lastIdx);
        } else {
          s = await base44.entities.RitualSession.create({
            user_id: user.id,
            ritual_id: id,
            ritual_name: r.name,
            current_step: 0,
            status: "in_progress",
            total_steps: sorted.length,
          });
        }

        // Collapse leftover in-progress attempts so exactly one stays active.
        const stale = open.filter((sess) => sess.id !== s.id);
        await Promise.all(
          stale.map((sess) => base44.entities.RitualSession.delete(sess.id))
        );

        setSession(s);
        setProgressLog(Array.isArray(s.progress_log) ? s.progress_log : []);
        setIdx(startIdx);
      } catch (e) {
        console.error("Failed to load this ritual:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || steps.length === 0) return;
    const url = steps[idx]?.audio_url;
    if (url) {
      if (a.getAttribute("src") !== url) a.src = url;
      a.play().then(() => setAudioPlaying(true)).catch(() => setAudioPlaying(false));
    } else {
      a.pause();
      a.removeAttribute("src");
      setAudioPlaying(false);
    }
  }, [idx, steps]);

  const toggleAudio = () => {
    const a = audioRef.current;
    if (!a || !steps[idx]?.audio_url) return;
    if (a.paused) {
      a.play().then(() => setAudioPlaying(true)).catch(() => {});
    } else {
      a.pause();
      setAudioPlaying(false);
    }
  };

  const persist = async (nextSession, fields) => {
    if (!nextSession) return;
    try {
      await base44.entities.RitualSession.update(nextSession.id, fields);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setStepMetrics({});
  }, [idx]);

  const handleMetrics = useCallback((m) => setStepMetrics(m), []);

  const buildEntry = (st, metrics) => ({
    type: st.type,
    title: st.title || "",
    completed: metrics?.completed ?? true,
    repetitions: metrics?.repetitions ?? 0,
    target_repetitions: st.repetitions || 0,
    elapsed_seconds: metrics?.elapsed ?? 0,
    target_seconds: st.duration_seconds || 0,
  });

  const goNext = async () => {
    const entry = buildEntry(step, stepMetrics);
    const log = [...progressLog];
    log[idx] = entry;
    setProgressLog(log);
    const next = idx + 1;
    if (next >= steps.length) {
      await finish(log);
      return;
    }
    setIdx(next);
    await persist(session, { current_step: next, progress_log: log });
  };

  const goBack = async () => {
    if (idx === 0) {
      navigate(-1);
      return;
    }
    const entry = buildEntry(step, stepMetrics);
    const log = [...progressLog];
    log[idx] = entry;
    setProgressLog(log);
    const prev = idx - 1;
    setIdx(prev);
    await persist(session, { current_step: prev, progress_log: log });
  };

  const finish = async (logOverride) => {
    let log;
    if (logOverride) {
      log = logOverride;
    } else {
      const entry = buildEntry(step, stepMetrics);
      log = [...progressLog];
      log[idx] = entry;
    }
    setProgressLog(log);
    const now = new Date().toISOString();
    await persist(session, {
      status: "completed",
      completed_at: now,
      current_step: steps.length - 1,
      progress_log: log,
    });
    navigate(`/completion/${session.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mystic flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D6B56A]/30 border-t-[#D6B56A] rounded-full animate-spin" />
      </div>
    );
  }
  if (!ritual || steps.length === 0) {
    return (
      <div className="min-h-screen bg-mystic flex flex-col items-center justify-center text-[#AAA5B5] px-6 text-center">
        <p>This ritual has no steps yet.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#D6B56A] text-sm">Go back</button>
      </div>
    );
  }

  const step = steps[idx];
  const isCompletion = step?.type === "completion";
  const contentLanguages = availableLanguagesForSteps(steps);

  return (
    <div className="min-h-screen bg-mystic text-[#F5F1E8] flex flex-col max-w-md mx-auto">
      <div className="px-5 pt-5 flex items-center justify-between">
        <button onClick={goBack} className="w-9 h-9 rounded-full border border-white/10 bg-[#171522] flex items-center justify-center text-[#AAA5B5]">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#AAA5B5] text-center max-w-[45%] truncate">
          {ritual.name}
        </div>
        <div className="flex items-center gap-2">
          <ContentLanguageSwitcher languages={contentLanguages} />
          {steps[idx]?.audio_url && (
            <button
              onClick={toggleAudio}
              className="w-9 h-9 rounded-full border border-white/10 bg-[#171522] flex items-center justify-center text-[#D6B56A]"
              aria-label="Toggle audio"
            >
              {audioPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
          <span className="text-xs text-[#AAA5B5]">{idx + 1}/{steps.length}</span>
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] transition-all duration-500 ease-out"
            style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full flex flex-col items-center"
          >
            <StepView step={step} onMetrics={handleMetrics} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-5 pb-8 pt-2 flex items-center gap-3">
        <button
          onClick={goBack}
          className="px-4 py-3.5 rounded-xl border border-white/10 text-[#AAA5B5] text-sm"
        >
          Back
        </button>
        {isCompletion ? (
          <button
            onClick={finish}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold tracking-wide glow-gold"
          >
            Complete Ritual
          </button>
        ) : (
          <button
            onClick={goNext}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold tracking-wide flex items-center justify-center gap-2 glow-gold"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}