import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { supabaseEntities } from "@/api/supabaseData";
import { useAuth } from "@/lib/AuthContext";
import { formatPrice } from "@/lib/rituals";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/lib/LanguageContext";
import { translateRitualField } from "@/lib/languages";

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve();
  script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded. Check your connection and try again."));
  document.body.appendChild(script);
});

export default function UnlockDialog({ open, ritual, mode = "current", requestStatus = "", paymentGateway, onClose, onSuccess }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  if (!ritual) return null;
  const isFree = Number(ritual.price) === 0;
  const isApproval = mode === "approval";
  const isPending = isApproval && requestStatus === "pending";

  const invoke = async (body) => {
    const { data, error: invokeError } = await supabase.functions.invoke("payment-gateway", { body });
    if (invokeError) throw new Error(data?.error || invokeError.message || "The payment service could not be reached.");
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const pay = async () => {
    setError("");
    setProcessing(true);
    try {
      if (isApproval) {
        if (isPending) return;
        await supabaseEntities.UnlockRequest.create({ user_id: user.id, ritual_id: ritual.id });
        onSuccess?.("requested");
        return;
      }
      if (isFree) {
        await supabaseEntities.Entitlement.create({ user_id: user.id, ritual_id: ritual.id });
        onSuccess?.("unlocked");
        return;
      }
      if (!paymentGateway?.enabled) throw new Error("Online payments are currently unavailable. Please contact the app administrator.");

      const checkout = await invoke({ action: "create_checkout", ritual_id: ritual.id });
      if (checkout.provider === "instamojo") {
        window.location.assign(checkout.paymentUrl);
        return;
      }
      if (checkout.provider !== "razorpay") throw new Error("The active payment gateway is not supported.");
      await loadRazorpay();
      const gateway = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.name,
        description: checkout.description,
        order_id: checkout.gatewayOrderId,
        prefill: checkout.prefill,
        theme: { color: "#D6B56A" },
        handler: async (response) => {
          setProcessing(true);
          try {
            await invoke({ action: "verify_payment", orderId: checkout.orderId, ...response });
            onSuccess?.("paid");
          } catch (verificationError) {
            setError(`${verificationError.message} If money was deducted, contact the administrator with your payment reference.`);
          } finally {
            setProcessing(false);
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      });
      gateway.on("payment.failed", (response) => {
        setError(response?.error?.description || "Payment did not complete. You can try again.");
        setProcessing(false);
      });
      gateway.open();
    } catch (e) {
      setError(e.message || "Could not start this request. Please try again.");
      setProcessing(false);
    }
  };

  const title = isApproval ? "Request ritual access" : isFree ? "Unlock free ritual" : "Secure checkout";
  const description = isApproval
    ? isPending ? "Your request is awaiting administrator review." : "Your access request will be sent to the app administrator. Access is granted after approval."
    : isFree ? "This ritual is free. Unlock it for your account."
      : paymentGateway?.enabled
        ? `Pay ${formatPrice(ritual.price)} securely with ${paymentGateway.provider === "razorpay" ? "Razorpay" : "Instamojo"}.`
        : "Online payments are not currently available. Please contact the app administrator.";
  const canSubmit = isApproval ? !isPending : isFree || Boolean(paymentGateway?.enabled);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent className="bg-[#171522] border-white/10 text-[#F5F1E8] max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] tracking-widest uppercase bg-[#8B6CCF]/20 text-[#8B6CCF] border border-[#8B6CCF]/40">
              <TranslatedText>{isApproval ? "Administrator review" : isFree ? "Free access" : paymentGateway?.enabled ? paymentGateway.provider : "Payments unavailable"}</TranslatedText>
            </span>
            <DialogTitle className="font-display text-xl text-[#F5F1E8]"><TranslatedText>{title}</TranslatedText></DialogTitle>
          </div>
          <DialogDescription className="text-[#AAA5B5]"><TranslatedText>{description}</TranslatedText></DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-white/5 bg-[#08070D] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[#AAA5B5]">{translateRitualField(ritual, "name", language)}</span>
            <span className="font-display text-2xl text-[#D6B56A]">{formatPrice(ritual.price)}</span>
          </div>
          {!isFree && !isApproval && paymentGateway?.enabled && <p className="mt-3 text-[11px] leading-relaxed text-[#AAA5B5]">Payment confirmation is verified securely before ritual access is activated.</p>}
        </div>

        <button onClick={pay} disabled={processing || !canSubmit}
          className="mt-1 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-60 glow-gold">
          <TranslatedText>{processing ? "Processing…" : <><Lock className="w-4 h-4" />{isApproval ? isPending ? "Request pending" : "Send access request" : isFree ? "Unlock free ritual" : paymentGateway?.enabled ? `Pay ${formatPrice(ritual.price)}` : "Payment unavailable"}</>}</TranslatedText>
        </button>
        {error && <p className="text-center text-xs text-[#e0a0a0]" role="alert">{error}</p>}
        {!isApproval && isFree && <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#AAA5B5]"><ShieldCheck className="w-3.5 h-3.5 text-[#D6B56A]" /> No payment required</p>}
        {!isApproval && !isFree && <p className="text-center text-[10px] text-[#777184]">Card details are entered only in the gateway's secure checkout.</p>}
      </DialogContent>
    </Dialog>
  );
}
