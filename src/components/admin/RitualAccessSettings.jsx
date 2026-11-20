import React, { useCallback, useEffect, useState } from "react";
import { Check, Clock3, X } from "lucide-react";
import { supabase } from "@/api/supabaseClient";

export default function RitualAccessSettings({ users, rituals }) {
  const [mode, setMode] = useState("current");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const userMap = Object.fromEntries(users.map((user) => [user.id, user]));
  const ritualMap = Object.fromEntries(rituals.map((ritual) => [ritual.id, ritual]));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data: settings, error: settingsError }, { data: rows, error: requestError }] = await Promise.all([
        supabase.from("ritual_unlock_settings").select("mode").eq("id", 1).single(),
        supabase.from("ritual_unlock_requests").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      if (settingsError) throw settingsError;
      if (requestError) throw requestError;
      setMode(settings.mode);
      setRequests(rows || []);
    } catch (e) {
      setError(e.message || "Ritual access data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveMode = async (nextMode) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const { error: saveError } = await supabase.from("ritual_unlock_settings")
        .update({ mode: nextMode, updated_by: authData.user.id, updated_at: new Date().toISOString() }).eq("id", 1);
      if (saveError) throw saveError;
      setMode(nextMode);
      setNotice("Ritual access mode saved.");
    } catch (e) {
      setError(e.message || "Could not save ritual access mode.");
    } finally {
      setSaving(false);
    }
  };

  const review = async (request, decision) => {
    setBusyId(request.id);
    setError("");
    setNotice("");
    try {
      const { error: reviewError } = await supabase.rpc("review_ritual_unlock_request", {
        request_id: request.id,
        decision,
      });
      if (reviewError) throw reviewError;
      setNotice(decision === "approved" ? "Request approved; ritual access is now active." : "Request rejected.");
      await load();
    } catch (e) {
      setError(e.message || "Could not review this access request.");
    } finally {
      setBusyId("");
    }
  };

  const pending = requests.filter((request) => request.status === "pending");

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/5 bg-[#171522] p-4 space-y-3">
        <div>
          <h2 className="font-display text-xl text-[#F5F1E8]">Ritual access</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#AAA5B5]">Choose how users request access to locked rituals. This applies to new unlock attempts.</p>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-white/10 p-3 cursor-pointer">
          <input type="radio" name="unlock-mode" value="current" checked={mode === "current"} disabled={saving} onChange={() => saveMode("current")} className="mt-1 accent-[#D6B56A]" />
          <span><span className="block text-sm text-[#F5F1E8]">Current unlock flow</span><span className="mt-1 block text-xs leading-relaxed text-[#AAA5B5]">Free rituals can be unlocked directly. Paid checkout remains unavailable until a secure payment provider is configured.</span></span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-white/10 p-3 cursor-pointer">
          <input type="radio" name="unlock-mode" value="approval" checked={mode === "approval"} disabled={saving} onChange={() => saveMode("approval")} className="mt-1 accent-[#D6B56A]" />
          <span><span className="block text-sm text-[#F5F1E8]">Administrator approval</span><span className="mt-1 block text-xs leading-relaxed text-[#AAA5B5]">Users submit an access request. Approving it grants the ritual; rejecting it leaves access locked.</span></span>
        </label>
      </section>

      {error && <p role="alert" className="rounded-xl border border-[#c97a7a]/30 bg-[#c97a7a]/10 p-3 text-xs text-[#e2a0a0]">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200">{notice}</p>}

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-display text-xl text-[#F5F1E8]">Access requests</h2><span className="text-xs text-[#AAA5B5]">{pending.length} pending</span></div>
        {loading ? <div className="h-24 rounded-2xl bg-[#171522] animate-pulse" /> : pending.length === 0 ? <p className="rounded-xl border border-white/5 bg-[#171522] p-4 text-sm text-[#AAA5B5]">No pending access requests.</p> : pending.map((request) => {
          const person = userMap[request.user_id];
          const ritual = ritualMap[request.ritual_id];
          return <article key={request.id} className="rounded-xl border border-white/5 bg-[#171522] p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm text-[#F5F1E8]">{ritual?.name || "Ritual unavailable"}</p><p className="mt-1 truncate text-xs text-[#AAA5B5]">{person?.email || request.user_id}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-[#777184]"><Clock3 className="h-3 w-3" />{new Date(request.created_at).toLocaleString()}</p></div><span className="rounded-full bg-[#D6B56A]/10 px-2 py-1 text-[10px] text-[#D6B56A]">Pending</span></div>
            <div className="mt-3 flex gap-2"><button disabled={busyId === request.id} onClick={() => review(request, "approved")} className="inline-flex items-center gap-1.5 rounded-lg bg-[#D6B56A] px-3 py-2 text-xs font-medium text-[#08070D] disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Approve and unlock</button><button disabled={busyId === request.id} onClick={() => review(request, "rejected")} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-[#AAA5B5] disabled:opacity-50"><X className="h-3.5 w-3.5" /> Reject</button></div>
          </article>;
        })}
      </section>
    </div>
  );
}
