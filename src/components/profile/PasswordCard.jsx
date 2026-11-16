import React, { useState } from "react";
import { Check, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { requireSupabase } from "@/api/supabaseClient";

const fieldClass = "mt-1 w-full rounded-lg border border-white/10 bg-[#08070D] px-3 py-2 text-sm text-[#F5F1E8] placeholder:text-[#777184] focus:outline-none focus:ring-1 focus:ring-[#D6B56A]";

export default function PasswordCard() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The password confirmation does not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await requireSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setConfirmation("");
      setSaved(true);
    } catch (updateError) {
      console.error("Password update failed:", updateError);
      setError(updateError.message || "Could not update your password. Sign in again and retry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-[#171522] p-5">
      <div className="mb-4 flex items-center gap-2">
        <LockKeyhole className="h-4 w-4 text-[#D6B56A]" />
        <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5]">Change password</h2>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs text-[#AAA5B5]">
          New password
          <input
            type={visible ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className={fieldClass}
          />
        </label>
        <label className="block text-xs text-[#AAA5B5]">
          Confirm new password
          <input
            type={visible ? "text" : "password"}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className={fieldClass}
          />
        </label>
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="text-xs text-[#AAA5B5] inline-flex items-center gap-1.5"
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {visible ? "Hide passwords" : "Show passwords"}
        </button>
        {error && <p role="alert" className="text-xs text-[#e0a0a0]">{error}</p>}
        {saved && <p role="status" className="text-xs text-[#D6B56A] inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Password updated.</p>}
        <button
          type="submit"
          disabled={saving || !password || !confirmation}
          className="w-full rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-[#F5F1E8] inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
