import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const DEFAULTS = { provider: "supabase", label: "", project_url: "", project_id: "", secret_key: "" };
const labelClass = "text-[10px] uppercase tracking-widest text-[#AAA5B5]";
const inputClass = "mt-1 bg-[#08070D] border-white/10";

function normalizeSupabaseProjectUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a valid Supabase project URL, such as https://your-project.supabase.co.");
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Use a Supabase project URL without credentials, query parameters, or a fragment.");
  }

  const path = url.pathname.replace(/\/+$/, "");
  if (path && !/^\/rest\/v1$/i.test(path)) {
    throw new Error("Use the Supabase project URL only, not a table or API endpoint path.");
  }

  return url.origin;
}

export default function DatabaseCredentialForm({ open, credential, onClose, onSaved }) {
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setSaving(false);
    setForm(
      credential
        ? {
            provider: credential.provider || "supabase",
            label: credential.label || "",
            project_url: credential.project_url || "",
            project_id: credential.project_id || "",
            secret_key: "",
          }
        : DEFAULTS
    );
  }, [open, credential]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const needsKey = !credential?.has_key;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const projectUrl =
        form.provider === "supabase"
          ? normalizeSupabaseProjectUrl(form.project_url)
          : form.project_url.trim();
      const res = await base44.functions.invoke("databaseCredentials", {
        action: "save",
        id: credential?.id,
        ...form,
        project_url: projectUrl,
      });
      if (res.data?.error) throw new Error(res.data.error);
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not save this connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#171522] border-white/10 text-[#F5F1E8] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {credential ? "Edit connection" : "New database connection"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className={labelClass}>Provider</Label>
            <Select value={form.provider} onValueChange={(v) => set("provider", v)}>
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#171522] border-white/10">
                <SelectItem value="supabase">Supabase</SelectItem>
                <SelectItem value="firebase">Firebase</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={labelClass}>Connection name</Label>
            <Input
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Production project"
              className={inputClass}
            />
          </div>

          {form.provider === "supabase" ? (
            <>
              <div>
                <Label className={labelClass}>Project URL</Label>
                <Input
                  value={form.project_url}
                  onChange={(e) => set("project_url", e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Service role key</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.secret_key}
                  onChange={(e) => set("secret_key", e.target.value)}
                  placeholder={credential?.has_key ? "Saved — paste a new key to replace" : "Paste the service role key"}
                  className={inputClass}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className={labelClass}>Project ID</Label>
                <Input
                  value={form.project_id}
                  onChange={(e) => set("project_id", e.target.value)}
                  placeholder="your-firebase-project"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Web API key</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.secret_key}
                  onChange={(e) => set("secret_key", e.target.value)}
                  placeholder={credential?.has_key ? "Saved — paste a new key to replace" : "Paste the Web API key"}
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Database URL (optional)</Label>
                <Input
                  value={form.project_url}
                  onChange={(e) => set("project_url", e.target.value)}
                  placeholder="https://your-project.firebaseio.com"
                  className={inputClass}
                />
              </div>
            </>
          )}

          <p className="text-[11px] leading-relaxed text-[#AAA5B5]">
            The key is stored server-side and never sent back to the browser — only its last four characters are shown.
            Test the connection after saving to confirm it works.
          </p>

          {error && <p className="text-xs text-[#e0a0a0]">{error}</p>}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/10 text-[#AAA5B5] text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !form.label.trim() || (needsKey && !form.secret_key.trim())}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] text-[#08070D] text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save connection"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}