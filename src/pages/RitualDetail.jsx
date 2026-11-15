import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Gem, Heart, BookOpen, ShieldQuestion, Info } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import RitualCover from "@/components/RitualCover";
import MockPaymentDialog from "@/components/MockPaymentDialog";
import { formatPrice, difficultyColor, PRACTICE_LABELS, PRACTICE_NOTE } from "@/lib/rituals";

export default function RitualDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [ritual, setRitual] = useState(null);
  const [category, setCategory] = useState(null);
  const [steps, setSteps] = useState([]);
  const [entitled, setEntitled] = useState(false);
  const [fav, setFav] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.Ritual.get(id);
        setRitual(r);
        if (r.category_id) {
          try {
            const c = await base44.entities.Category.get(r.category_id);
            setCategory(c);
          } catch {}
        }
        const all = await base44.entities.RitualStep.filter({ ritual_id: id });
        setSteps(all.sort((a, b) => a.order - b.order));

        if (isAuthenticated && user?.id) {
          const ent = await base44.entities.Entitlement.filter({ user_id: user.id, ritual_id: id });
          setEntitled(ent.length > 0);
          const favs = await base44.entities.Favorite.filter({ user_id: user.id, ritual_id: id });
          setFav(favs[0] || null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAuthenticated, user?.id]);

  const toggleFav = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (fav) {
      await base44.entities.Favorite.delete(fav.id);
      setFav(null);
    } else {
      const f = await base44.entities.Favorite.create({ user_id: user.id, ritual_id: id });
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
    return <div className="pt-10 text-center text-[#AAA5B5]">Ritual not found.</div>;
  }

  return (
    <div className="pt-1 pb-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full border border-white/10 bg-[#171522] flex items-center justify-center text-[#AAA5B5]">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFav}
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
          {category?.name || ritual.category_name}
        </span>
        <h1 className="font-display text-3xl text-[#F5F1E8] leading-tight mt-1">{ritual.name}</h1>
        <p className="text-sm text-[#AAA5B5] leading-relaxed mt-3">{ritual.description}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/5 bg-[#171522] p-3 text-center">
          <Clock className="w-4 h-4 text-[#D6B56A] mx-auto mb-1" />
          <div className="text-xs text-[#AAA5B5]">Duration</div>
          <div className="text-sm text-[#F5F1E8] font-medium">{ritual.duration_minutes}m</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#171522] p-3 text-center">
          <Gem className="w-4 h-4 text-[#D6B56A] mx-auto mb-1" />
          <div className="text-xs text-[#AAA5B5]">Price</div>
          <div className="text-sm text-[#F5F1E8] font-medium">{formatPrice(ritual.price)}</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#171522] p-3 text-center">
          <div className="text-[10px] text-[#AAA5B5] mt-0.5">Difficulty</div>
          <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full border ${difficultyColor(ritual.difficulty)}`}>
            {ritual.difficulty}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {ritual.practice_type && (
          <div className="rounded-xl border border-[#8B6CCF]/20 bg-[#8B6CCF]/5 p-3 flex gap-2.5">
            <Info className="w-4 h-4 text-[#8B6CCF] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#AAA5B5] leading-relaxed">
              <span className="text-[#8B6CCF]">{PRACTICE_LABELS[ritual.practice_type]}.</span>{" "}
              {PRACTICE_NOTE}
            </p>
          </div>
        )}
        {ritual.source && (
          <div className="rounded-xl border border-white/5 bg-[#171522] p-3 flex gap-2.5">
            <ShieldQuestion className="w-4 h-4 text-[#D6B56A] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Source / Provenance</div>
              <p className="text-xs text-[#F5F1E8] mt-0.5 leading-relaxed">{ritual.source}</p>
            </div>
          </div>
        )}
        <div className="rounded-xl border border-white/5 bg-[#171522] p-3 flex gap-2.5">
          <BookOpen className="w-4 h-4 text-[#D6B56A] mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Structure</div>
            <p className="text-xs text-[#F5F1E8] mt-0.5">{steps.length} guided steps</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onPrimary}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold tracking-wide glow-gold"
        >
          {entitled ? "Perform This Ritual" : `Unlock for ${formatPrice(ritual.price)}`}
        </button>
        {!isAuthenticated && (
          <p className="text-center text-xs text-[#AAA5B5] mt-2">Sign in to purchase & perform.</p>
        )}
      </div>

      <MockPaymentDialog
        open={payOpen}
        ritual={ritual}
        onClose={() => setPayOpen(false)}
        onSuccess={() => {
          setPayOpen(false);
          setEntitled(true);
          navigate(`/player/${id}`);
        }}
      />
    </div>
  );
}