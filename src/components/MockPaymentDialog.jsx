import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { formatPrice } from "@/lib/rituals";

export default function MockPaymentDialog({ open, ritual, onClose, onSuccess }) {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  if (!ritual) return null;

  const pay = async () => {
    setProcessing(true);
    try {
      const order = await base44.entities.Order.create({
        user_id: user.id,
        ritual_id: ritual.id,
        ritual_name: ritual.name,
        amount: ritual.price,
        status: "paid",
        payment_mode: "mock",
        payment_id: "mock_" + Math.random().toString(36).slice(2, 12),
      });
      await base44.entities.Entitlement.create({
        user_id: user.id,
        ritual_id: ritual.id,
        order_id: order.id,
      });
      onSuccess?.();
    } catch (e) {
      console.error("Mock payment failed", e);
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
              Test Mode
            </span>
            <DialogTitle className="font-display text-xl text-[#F5F1E8]">Checkout</DialogTitle>
          </div>
          <DialogDescription className="text-[#AAA5B5]">
            Mock Razorpay-style checkout. No real charge is made — this unlocks the ritual for your account.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-white/5 bg-[#08070D] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#AAA5B5]">{ritual.name}</span>
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
        </div>

        <button
          onClick={pay}
          disabled={processing}
          className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-60 glow-gold"
        >
          {processing ? (
            "Processing…"
          ) : (
            <>
              <Lock className="w-4 h-4" /> Pay {formatPrice(ritual.price)} & Unlock
            </>
          )}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#AAA5B5]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D6B56A]" /> Secured · Test transaction
        </p>
      </DialogContent>
    </Dialog>
  );
}