import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Gem, Heart, BookOpen, ShieldQuestion, Info } from "lucide-react";
import { supabaseEntities } from "@/api/supabaseData";
import { useAuth } from "@/lib/AuthContext";
import RitualCover from "@/components/RitualCover";
import MockPaymentDialog from "@/components/MockPaymentDialog";
import { formatPrice, difficultyColor, PRACTICE_LABELS, PRACTICE_NOTE } from "@/lib/rituals";
import TranslatedText, { useTranslatedValue } from "@/components/TranslatedText";
import { translateRitualField } from "@/lib/languages";
import { useLanguage } from "@/lib/LanguageContext";
import useRefreshOnFocus from "@/hooks/useRefreshOnFocus";
import { supabase } from "@/api/supabaseClient";

export default function RitualDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const refreshKey = useRefreshOnFocus();
  const backLabel = useTranslatedValue("Back");
  const [ritual, setRitual] = useState(null);
  const [category, setCategory] = useState(null);
  const [steps, setSteps] = useState([]);
  const [entitled, setEntitled] = useState(false);
  const [unlockMode, setUnlockMode] = useState("current");
  const [requestStatus, setRequestStatus] = useState("");
  const [fav, setFav] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const favoriteLabel = useTranslatedValue(fav ? "Remove from favorites" : "Add to favorites");
  const practiceDisclaimer = ritual
    ? translateRitualField(
        { ...ritual, practice_disclaimer: ritual.practice_disclaimer ?? PRACTICE_NOTE },
        "practice_disclaimer",
        language
      )
    : "";

  useEffect(() => {
    (async () => {
      try {
        const r = await supabaseEntities.Ritual.get(id);
        setRitual(r);
        try {
          const { data: unlockSettings, error: settingsError } = await supabase
            .from("ritual_unlock_settings").select("mode").eq("id", 1).maybeSingle();
          if (settingsError) throw settingsError;
          setUnlockMode(unlockSettings?.mode || "current");
        } catch (error) {
          console.error("Could not load ritual access settings:", error);
        }
        if (r.category_id) {
          try {
            const c = await supabaseEntities.Category.get(r.category_id);
            setCategory(c);
          } catch {}
        }
        const all = await supabaseEntities.RitualStep.filter({ ritual_id: id });
        setSteps(all.sort((a, b) => a.order - b.order));

        if (isAuthenticated && user?.id) {
          const ent = await supabaseEntities.Entitlement.filter({ user_id: user.id, ritual_id: id });
          setEntitled(ent.length > 0);
          const requests = await supabaseEntities.UnlockRequest.filter({ user_id: user.id, ritual_id: id }, "-created_at", 1);
          setRequestStatus(requests[0]?.status || "");
          const favs = await supabaseEntities.Favorite.filter({ user_id: user.id, ritual_id: id });
          setFav(favs[0] || null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAuthenticated, user?.id, refreshKey]);

  const toggleFav = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (fav) {
      await supabaseEntities.Favorite.delete(fav.id);
      setFav(null);
    } else {
      const f = await supabaseEntities.Favorite.create({ user_id: user.id, ritual_id: id });
      setFav(f);
    }
  };

  const onPrimary = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (entitled) {
      navigate(`/player/${id}`);
    } else if (unlockMode === "approval" && requestStatus === "pending") {
      return;
    } else {
      setPayOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="pt-1">
        <div className="h-48 rounded-2xl bg-[#171522] animate-pulse mb-4" />
        <div className="h-6 w-2/3 bg-[#171522] animate-pulse rounded mb-3" />
        <div className="h-4 w-full bg-[#171522] animate-pulse rounded" />
      </div>
    );
  }
  if (!ritual) {
    return <div className="pt-10 text-center text-[#AAA5B5]"><TranslatedText>Ritual not found.</TranslatedText></div>;
  }

  return (
    <div className="pt-1 pb-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navigate(-1)} aria-label={backLabel} className="w-9 h-9 rounded-full border border-white/10 bg-[#171522] flex items-center justify-center text-[#AAA5B5]">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFav}
          aria-label={favoriteLabel}
          aria-pressed={Boolean(fav)}
          className={`w-9 h-9 rounded-full border flex items-center justify-center ${
            fav ? "border-[#D6B56A] bg-[#D6B56A]/10 text-[#D6B56A]" : "border-white/10 bg-[#171522] text-[#AAA5B5]"
          }`}
        >
          <Heart className={`w-4 h-4 ${fav ? "fill-[#D6B56A]" : ""}`} />
        </button>
      </div>

      <RitualCover ritual={ritual} className="h-44 w-full rounded-2xl" />

      <div className="mt-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#AAA5B5]">
          <TranslatedText>{category?.name || ritual.category_name}</TranslatedText>
        </span>
        <h1 className="font-display text-3xl text-[#F5F1E8] leading-tight mt-1">
          {translateRitualField(ritual, "name", language)}
        </h1>
        <p className="text-sm text-[#AAA5B5] leading-relaxed mt-3">
          {translateRitualField(ritual, "description", language)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/5 bg-[#171522] p-3 text-center">
          <Clock className="w-4 h-4 text-[#D6B56A] mx-auto mb-1" />
          <div className="text-xs text-[#AAA5B5]"><TranslatedText>Duration</TranslatedText></div>
          <div className="text-sm text-[#F5F1E8] font-medium">{ritual.duration_minutes}<TranslatedText>m</TranslatedText></div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#171522] p-3 text-center">
          <Gem className="w-4 h-4 text-[#D6B56A] mx-auto mb-1" />
          <div className="text-xs text-[#AAA5B5]"><TranslatedText>Price</TranslatedText></div>
          <div className="text-sm text-[#F5F1E8] font-medium">{formatPrice(ritual.price)}</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#171522] p-3 text-center">
          <div className="text-[10px] text-[#AAA5B5] mt-0.5"><TranslatedText>Difficulty</TranslatedText></div>
          <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full border ${difficultyColor(ritual.difficulty)}`}>
            <TranslatedText>{ritual.difficulty}</TranslatedText>
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {(ritual.practice_type || practiceDisclaimer.trim()) && (
          <div className="rounded-xl border border-[#8B6CCF]/20 bg-[#8B6CCF]/5 p-3 flex gap-2.5">
            <Info className="w-4 h-4 text-[#8B6CCF] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#AAA5B5] leading-relaxed">
              {ritual.practice_type && (
                <>
                  <span className="text-[#8B6CCF]">
                    <TranslatedText>{PRACTICE_LABELS[ritual.practice_type] || ritual.practice_type}</TranslatedText>.
                  </span>{" "}
                </>
              )}
              {practiceDisclaimer.trim() && practiceDisclaimer}
            </p>
          </div>
        )}
        <TranslatedText>{ritual.source && (
          <div className="rounded-xl border border-white/5 bg-[#171522] p-3 flex gap-2.5">
            <ShieldQuestion className="w-4 h-4 text-[#D6B56A] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#AAA5B5]"><TranslatedText>Source / Provenance</TranslatedText></div>
              <p className="text-xs text-[#F5F1E8] mt-0.5 leading-relaxed">
                {translateRitualField(ritual, "source", language)}
              </p>
            </div>
          </div>
        )}</TranslatedText>
        <div className="rounded-xl border border-white/5 bg-[#171522] p-3 flex gap-2.5">
          <BookOpen className="w-4 h-4 text-[#D6B56A] mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#AAA5B5]"><TranslatedText>Structure</TranslatedText></div>
            <p className="text-xs text-[#F5F1E8] mt-0.5"><TranslatedText>{`${steps.length} guided steps`}</TranslatedText></p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onPrimary}
          disabled={!entitled && unlockMode === "approval" && requestStatus === "pending"}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold tracking-wide glow-gold disabled:opacity-70"
        >
          {entitled ? <TranslatedText>Perform This Ritual</TranslatedText> : requestStatus === "pending" && unlockMode === "approval" ? <TranslatedText>Unlock request pending</TranslatedText> : unlockMode === "approval" ? <TranslatedText>Request ritual access</TranslatedText> : <TranslatedText>{`Unlock for ${formatPrice(ritual.price)}`}</TranslatedText>}
        </button>
        {unlockMode === "approval" && requestStatus === "pending" && <p role="status" className="text-center text-xs text-[#AAA5B5] mt-2"><TranslatedText>Unlock requested. Contact the administrator if you need an update; access will appear here after approval.</TranslatedText></p>}
        <TranslatedText>{!isAuthenticated && (
          <p className="text-center text-xs text-[#AAA5B5] mt-2"><TranslatedText>Sign in to purchase & perform.</TranslatedText></p>
        )}</TranslatedText>
      </div>

      <MockPaymentDialog
        open={payOpen}
        ritual={ritual}
        mode={unlockMode}
        requestStatus={requestStatus}
        onClose={() => setPayOpen(false)}
        onSuccess={(result) => {
          setPayOpen(false);
          if (result === "requested") setRequestStatus("pending");
          else {
            setEntitled(true);
            navigate(`/player/${id}`);
          }
        }}
      />
    </div>
  );
}
