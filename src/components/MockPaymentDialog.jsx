import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock, ShieldCheck } from "lucide-react";
import { supabaseEntities } from "@/api/supabaseData";
import { useAuth } from "@/lib/AuthContext";
import { formatPrice } from "@/lib/rituals";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/lib/LanguageContext";
import { translateRitualField } from "@/lib/languages";

export default function MockPaymentDialog({ open, ritual, onClose, onSuccess }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  if (!ritual) return null;
  const isFree = Number(ritual.price) === 0;

  const pay = async () => {
    if (!isFree) return;
    setProcessing(true);
    setError("");
    try {
      await supabaseEntities.Entitlement.create({
        user_id: user.id,
        ritual_id: ritual.id,
      });
      onSuccess?.();
    } catch (e) {
      console.error("Mock payment failed", e);
      setError(e.message || "Could not unlock this ritual. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="bg-[#171522] border-white/10 text-[#F5F1E8] max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] tracking-widest uppercase bg-[#8B6CCF]/20 text-[#8B6CCF] border border-[#8B6CCF]/40">
              <TranslatedText>{isFree ? "Free access" : "Checkout unavailable"}</TranslatedText>
            </span>
            <DialogTitle className="font-display text-xl text-[#F5F1E8]"><TranslatedText>{isFree ? "Unlock ritual" : "Paid checkout"}</TranslatedText></DialogTitle>
          </div>
          <DialogDescription className="text-[#AAA5B5]">
            <TranslatedText>{isFree
              ? "This ritual is free. Unlock it for your account."
              : "Paid checkout is not configured. No charge or access will be created until a secure payment provider is connected."}</TranslatedText>
          </DialogDescription>
        </DialogHeader>

        <TranslatedText>{isFree && <div className="rounded-xl border border-white/5 bg-[#08070D] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#AAA5B5]">
              {translateRitualField(ritual, "name", language)}
            </span>
            <span className="font-display text-2xl text-[#D6B56A]">{formatPrice(ritual.price)}</span>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Card number</label>
              <div className="mt-1 px-3 py-2.5 rounded-lg border border-white/10 bg-[#171522] text-sm text-[#AAA5B5] font-mono">
                4111 1111 1111 1111
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">Expiry</label>
                <div className="mt-1 px-3 py-2.5 rounded-lg border border-white/10 bg-[#171522] text-sm text-[#AAA5B5] font-mono">12/29</div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#AAA5B5]">CVV</label>
                <div className="mt-1 px-3 py-2.5 rounded-lg border border-white/10 bg-[#171522] text-sm text-[#AAA5B5] font-mono">•••</div>
              </div>
            </div>
          </div>
        </div>}</TranslatedText>

        <button
          onClick={pay}
          disabled={processing || !isFree}
          className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-60 glow-gold"
        >
          <TranslatedText>{processing ? (
            "Processing…"
          ) : (
            <>
              <Lock className="w-4 h-4" /> {isFree ? "Unlock free ritual" : "Paid checkout unavailable"}
            </>
          )}</TranslatedText>
        </button>
        <TranslatedText>{error && <p className="mt-3 text-center text-xs text-[#e0a0a0]" role="alert">{error}</p>}</TranslatedText>
        <TranslatedText>{isFree && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#AAA5B5]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D6B56A]" /> No payment required
          </p>
        )}</TranslatedText>
      </DialogContent>
    </Dialog>
  );
}