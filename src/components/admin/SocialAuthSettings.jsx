import React, { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Facebook, Instagram, KeyRound, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  AUTH_PROVIDER_MIGRATION,
  DEFAULT_AUTH_PROVIDER_SETTINGS,
  getAuthProviderSettings,
  getSupabaseAuthCallbackUrl,
  saveAuthProviderSettings,
} from "@/api/authProviders";
import GoogleIcon from "@/components/GoogleIcon";
import TranslatedText from "@/components/TranslatedText";

const fieldClass = "mt-1 w-full rounded-lg border border-white/10 bg-[#100F18] px-3 py-2 font-mono text-xs text-[#F5F1E8]";

function ProviderCard({ title, description, configured, enabled, icon: Icon, onChange }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#171522] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <TranslatedText>{title === "Google" ? (
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1877F2]" aria-hidden="true" />
        )}</TranslatedText>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-[#F5F1E8]">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#AAA5B5]">{description}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${configured ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-[#AAA5B5]"}`}>
          <TranslatedText>{configured ? "Configured" : "Setup required"}</TranslatedText>
        </span>
      </div>

      <label className="flex items-center justify-between gap-4 border-t border-white/5 pt-4">
        <span>
          <span className="block text-xs text-[#F5F1E8]"><TranslatedText>Provider configured and tested in Supabase</TranslatedText></span>
          <span className="mt-1 block text-[11px] text-[#777184]"><TranslatedText>Mark this only after a successful end-to-end sign-in test.</TranslatedText></span>
        </span>
        <Switch
          checked={configured}
          onCheckedChange={(checked) => onChange("configured", checked)}
          aria-label={`${title} provider configured`}
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block text-xs text-[#F5F1E8]"><TranslatedText>Show </TranslatedText>{title} <TranslatedText> sign-in button</TranslatedText></span>
          <span className="mt-1 block text-[11px] text-[#777184]"><TranslatedText>Visible on both login and signup pages.</TranslatedText></span>
        </span>
        <Switch
          checked={enabled}
          disabled={!configured}
          onCheckedChange={(checked) => onChange("enabled", checked)}
          aria-label={`${title} sign-in enabled`}
        />
      </label>
    </section>
  );
}

export default function SocialAuthSettings() {
  const [settings, setSettings] = useState(DEFAULT_AUTH_PROVIDER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [copied, setCopied] = useState(false);
  const callbackUrl = getSupabaseAuthCallbackUrl();

  useEffect(() => {
    let active = true;
    getAuthProviderSettings()
      .then((currentSettings) => {
        if (active) {
          setSettings(currentSettings);
          setLoadError("");
        }
      })
      .catch((error) => {
        console.error("Could not load social auth configuration:", error);
        if (active) {
          setLoadError(error.message || "Could not load social auth configuration.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateProvider = (provider, field, value) => {
    const key = `${provider}_${field}`;
    setSettings((current) => ({
      ...current,
      [key]: value,
      ...(field === "configured" && !value ? { [`${provider}_enabled`]: false } : {}),
    }));
    setSaveError("");
  };

  const save = async (event) => {
    event.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const saved = await saveAuthProviderSettings(settings);
      setSettings(saved);
      toast({ title: "Social sign-in settings saved", description: "Login and signup buttons now use these settings." });
    } catch (error) {
      console.error("Could not save social auth settings:", error);
      setSaveError(error.message || "Could not save social sign-in settings.");
    } finally {
      setSaving(false);
    }
  };

  const copyCallback = async () => {
    if (!callbackUrl) return;
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Could not copy the Supabase OAuth callback URL:", error);
      setSaveError("Could not copy automatically. Select and copy the callback URL below.");
    }
  };

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-[#171522]" role="status"><TranslatedText>Loading social sign-in settings…</TranslatedText></div>;
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {loadError && (
        <p role="alert" className="rounded-xl border border-[#c97a7a]/30 bg-[#c97a7a]/5 p-3 text-xs text-[#e0a0a0]">
          Social sign-in settings could not be loaded. Apply `{AUTH_PROVIDER_MIGRATION}` and reload.
          <span className="mt-1 block text-[#AAA5B5]">{loadError}</span>
        </p>
      )}

      <section className="rounded-2xl border border-white/5 bg-[#171522] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#D6B56A]" aria-hidden="true" />
          <h2 className="text-sm font-medium text-[#F5F1E8]"><TranslatedText>Supabase OAuth callback</TranslatedText></h2>
        </div>
        <p className="text-xs leading-relaxed text-[#AAA5B5]">
          <TranslatedText>
          Add this callback URL to the Google and Facebook developer consoles. Add your website’s URL and allowed redirect paths separately under Supabase Authentication → URL Configuration.
        </TranslatedText></p>
      {callbackUrl ? (
          <div className="flex gap-2">
            <input aria-label="Supabase OAuth callback URL" readOnly value={callbackUrl} className={fieldClass} />
            <button type="button" onClick={copyCallback} className="shrink-0 rounded-lg border border-white/10 px-3 text-[#AAA5B5] hover:text-[#F5F1E8]" aria-label="Copy callback URL">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <p role="alert" className="text-xs text-[#e0a0a0]">Set `VITE_SUPABASE_URL` in the app environment to show the callback URL.</p>
      )}
      </section>

      <p className="rounded-xl border border-[#D6B56A]/20 bg-[#D6B56A]/5 p-3 text-xs leading-relaxed text-[#AAA5B5]">
        <TranslatedText>
        Important: this panel only controls whether the app displays a provider button. It cannot enable OAuth or store provider credentials in Supabase. Enable the provider and add its Client ID and Secret in Supabase Authentication → Sign In / Providers first. If you see “Unsupported provider: provider is not enabled,” Supabase has not enabled that provider yet.
      </TranslatedText></p>

      <TranslatedText>{saveError && (
        <p role="alert" className="rounded-xl border border-[#c97a7a]/30 bg-[#c97a7a]/5 p-3 text-xs text-[#e0a0a0]">
          {saveError}
        </p>
      )}</TranslatedText>

      <ProviderCard
        title="Google"
        icon={GoogleIcon}
        description="Create a Google OAuth Web application client. Add your app's origin (for example https://your-domain.example and http://localhost:5173) under Authorized JavaScript origins. Add the Supabase callback above under Authorized redirect URIs. In Supabase Authentication → Sign In / Providers → Google, enter this same client's Client ID and Client Secret and enable Google."
        configured={settings.google_configured}
        enabled={settings.google_enabled}
        onChange={(field, value) => updateProvider("google", field, value)}
      />
      <ProviderCard
        title="Facebook"
        icon={Facebook}
        description="Create a Meta app with Facebook Login, configure the callback above, request public_profile and email, and enter the App ID and App Secret in Supabase Authentication → Sign In / Providers → Facebook."
        configured={settings.facebook_configured}
        enabled={settings.facebook_enabled}
        onChange={(field, value) => updateProvider("facebook", field, value)}
      />

      <section className="rounded-2xl border border-white/5 bg-[#171522] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Instagram className="h-4 w-4 text-[#D889B8]" aria-hidden="true" />
          <h2 className="text-sm font-medium text-[#F5F1E8]"><TranslatedText>Instagram</TranslatedText></h2>
          <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-[#AAA5B5]"><TranslatedText>Not supported for Supabase Auth</TranslatedText></span>
        </div>
        <p className="text-xs leading-relaxed text-[#AAA5B5]">
          <TranslatedText>
          Instagram is not a supported Supabase Auth OAuth provider, so this app will not show an Instagram sign-in button. For general user authentication, use Google, Facebook, or email. If you need Instagram for creator accounts, build a separate Meta Instagram API account-linking flow; it does not sign a user into RitualOS.
        </TranslatedText></p>
        <a
          href="https://supabase.com/docs/guides/auth"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#D6B56A] hover:underline"
        >
          <TranslatedText>
          Supabase Auth provider documentation </TranslatedText><ExternalLink className="h-3 w-3" />
        </a>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || Boolean(loadError)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#D6B56A] px-4 py-2.5 text-sm font-medium text-[#171522] disabled:opacity-50"
        >
          <TranslatedText>{saving && <Loader2 className="h-4 w-4 animate-spin" />}</TranslatedText>
          <TranslatedText>{saving ? "Saving…" : "Save social sign-in settings"}</TranslatedText>
        </button>
      </div>
    </form>
  );
}
