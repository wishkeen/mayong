import React, { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import useRealtimeTables from "@/hooks/useRealtimeTables";

const PROVIDERS = [
  { id: "razorpay", label: "Razorpay", publicLabel: "Key ID", secretLabel: "Key Secret", webhookLabel: "Webhook secret", dashboard: "https://dashboard.razorpay.com/app/website-app-settings/api-keys" },
  { id: "instamojo", label: "Instamojo", publicLabel: "Client ID", secretLabel: "Client Secret", webhookLabel: "Webhook salt", dashboard: "https://www.instamojo.com/developers/" },
];

const EMPTY_FORM = { environment: "test", publicKey: "", apiSecret: "", webhookSecret: "" };

export default function PaymentGatewaySettings() {
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState("razorpay");
  const [environment, setEnvironment] = useState("test");
  const [form, setForm] = useState(EMPTY_FORM);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const liveRevision = useRealtimeTables([{ table: "payment_gateway_runtime" }], "admin-payment-gateway-status");
  const currentProvider = PROVIDERS.find((provider) => provider.id === providerId);
  const selected = providers.find((item) => item.provider === providerId && item.environment === environment);
  const active = providers.find((item) => item.enabled);

  const invoke = async (body) => {
    const { data, error: invokeError } = await supabase.functions.invoke("payment-gateway", { body });
    if (invokeError) throw new Error(data?.error || invokeError.message || "The payment setup service could not be reached.");
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await invoke({ action: "admin_get" });
      setProviders(result.providers || []);
      setWebhookUrl(result.webhookUrl || "");
    } catch (e) {
      setError(e.message || "Payment gateway settings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, liveRevision]);

  const save = async (enabled) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await invoke({ action: "admin_save", provider: providerId, environment, enabled, ...form });
      setForm(EMPTY_FORM);
      await load();
      setNotice(enabled ? `${currentProvider.label} (${environment}) is active for new checkouts.` : `${currentProvider.label} (${environment}) settings saved inactive.`);
    } catch (e) {
      setError(e.message || "Could not save payment settings.");
    } finally {
      setBusy(false);
    }
  };

  const testConnection = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await invoke({ action: "admin_test", provider: providerId, environment });
      setNotice(result.message || "Gateway connection is working.");
    } catch (e) {
      setError(e.message || "Could not verify gateway credentials.");
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await invoke({ action: "admin_disable" });
      await load();
      setNotice("Online payments are inactive. Paid ritual checkouts are disabled.");
    } catch (e) {
      setError(e.message || "Could not deactivate online payments.");
    } finally {
      setBusy(false);
    }
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the webhook URL. Select and copy it manually.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/5 bg-[#171522] p-4 space-y-4">
        <div>
          <h2 className="font-display text-xl text-[#F5F1E8]">Online payments</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#AAA5B5]">Configure either gateway for paid rituals. Only one gateway can be active at a time. Test and live credentials are saved separately.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-[11px] text-[#AAA5B5]">Gateway
            <select value={providerId} onChange={(event) => { setProviderId(event.target.value); setForm(EMPTY_FORM); setNotice(""); }} className="w-full rounded-lg border border-white/10 bg-[#08070D] px-3 py-2.5 text-sm text-[#F5F1E8]">
              {PROVIDERS.map((provider) => <option key={provider.id} value={provider.id}>{provider.label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-[11px] text-[#AAA5B5]">Environment
            <select value={environment} onChange={(event) => { setEnvironment(event.target.value); setForm(EMPTY_FORM); setNotice(""); }} className="w-full rounded-lg border border-white/10 bg-[#08070D] px-3 py-2.5 text-sm text-[#F5F1E8]">
              <option value="test">Test / sandbox</option><option value="live">Live</option>
            </select>
          </label>
        </div>

        {loading ? <div className="h-24 rounded-xl bg-[#08070D] animate-pulse" /> : <>
          <div className={`rounded-xl border p-3 text-xs ${selected?.enabled ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200" : "border-white/10 bg-[#08070D] text-[#AAA5B5]"}`}>
            <span className="inline-flex items-center gap-2">{selected?.enabled ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}{selected?.enabled ? "Active" : selected?.configured ? "Configured · inactive" : "Not configured"} in {environment} mode</span>
            {active && <p className="mt-1">Active checkout: {active.provider} ({active.environment})</p>}
          </div>

          <div className="space-y-3">
            <label className="block text-[11px] text-[#AAA5B5]">{currentProvider.publicLabel}
              <input autoComplete="off" value={form.publicKey} onChange={(event) => setForm({ ...form, publicKey: event.target.value })} placeholder={selected?.configured ? "Saved securely · enter only to replace" : `Enter ${currentProvider.publicLabel}`} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#08070D] px-3 py-2.5 text-sm text-[#F5F1E8] placeholder:text-[#625D70]" />
            </label>
            <label className="block text-[11px] text-[#AAA5B5]">{currentProvider.secretLabel}
              <input type="password" autoComplete="new-password" value={form.apiSecret} onChange={(event) => setForm({ ...form, apiSecret: event.target.value })} placeholder={selected?.configured ? "Saved encrypted · leave blank to keep" : `Enter ${currentProvider.secretLabel}`} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#08070D] px-3 py-2.5 text-sm text-[#F5F1E8] placeholder:text-[#625D70]" />
            </label>
            <label className="block text-[11px] text-[#AAA5B5]">{currentProvider.webhookLabel}
              <input type="password" autoComplete="new-password" value={form.webhookSecret} onChange={(event) => setForm({ ...form, webhookSecret: event.target.value })} placeholder={selected?.configured ? "Saved encrypted · leave blank to keep" : `Enter ${currentProvider.webhookLabel}`} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#08070D] px-3 py-2.5 text-sm text-[#F5F1E8] placeholder:text-[#625D70]" />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => save(false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#AAA5B5] disabled:opacity-50">Save inactive</button>
            <button disabled={busy || !selected?.configured && (!form.publicKey || !form.apiSecret || !form.webhookSecret)} onClick={() => save(true)} className="rounded-lg bg-[#D6B56A] px-3 py-2 text-xs font-semibold text-[#08070D] disabled:opacity-50">Save and activate</button>
            <button disabled={busy || !selected?.configured} onClick={testConnection} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#AAA5B5] disabled:opacity-50">{busy ? "Working…" : "Test connection"}</button>
          </div>
          {active && <button disabled={busy} onClick={deactivate} className="rounded-lg border border-[#c97a7a]/30 px-3 py-2 text-xs text-[#e2a0a0] disabled:opacity-50">Deactivate active gateway</button>}
          <p className="text-[10px] leading-relaxed text-[#777184]">Secrets are encrypted before storage and never returned to this page. Blank secret fields keep the saved values. Save and test credentials in test mode before switching to live. Disabling all gateways turns off paid checkout.</p>
        </>}
      </section>

      <section className="rounded-2xl border border-white/5 bg-[#171522] p-4 space-y-3">
        <div><h3 className="text-sm font-medium text-[#F5F1E8]">Webhook setup</h3><p className="mt-1 text-xs leading-relaxed text-[#AAA5B5]">Use this HTTPS endpoint as the Razorpay webhook URL. Instamojo is attached automatically to each payment request. Use the same webhook secret or Instamojo salt entered above.</p></div>
        <div className="flex gap-2"><input readOnly value={webhookUrl} aria-label="Payment webhook URL" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#08070D] px-3 py-2 text-[10px] text-[#AAA5B5]" /><button onClick={copyWebhook} disabled={!webhookUrl} className="rounded-lg border border-white/10 px-3 text-[#D6B56A]" aria-label="Copy webhook URL">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div>
        <p className="text-[10px] leading-relaxed text-[#777184]">Razorpay: subscribe to <code>payment.captured</code>. Instamojo: set the webhook URL on payment requests; successful payments are verified against Instamojo before access is granted.</p>
        <a href={currentProvider.dashboard} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#D6B56A]">Open {currentProvider.label} dashboard <ExternalLink className="h-3 w-3" /></a>
      </section>

      {busy && <div className="sr-only" role="status"><LoaderCircle className="animate-spin" /> Working</div>}
      {error && <p role="alert" className="rounded-xl border border-[#c97a7a]/30 bg-[#c97a7a]/10 p-3 text-xs text-[#e2a0a0]">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200">{notice}</p>}
    </div>
  );
}
