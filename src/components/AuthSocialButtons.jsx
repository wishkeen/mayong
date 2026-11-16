import React, { useEffect, useState } from "react";
import { Facebook, Loader2 } from "lucide-react";
import { requireSupabase } from "@/api/supabaseClient";
import { AUTH_PROVIDER_MIGRATION, getAuthProviderSettings } from "@/api/authProviders";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";

const PROVIDERS = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "facebook", label: "Facebook", icon: Facebook },
];

function getOAuthErrorMessage(error, providerLabel) {
  const providerDisabled =
    error?.error_code === "validation_failed" &&
    /unsupported provider|provider is not enabled/i.test(error?.msg || error?.message || "");

  if (providerDisabled) {
    return `${providerLabel} sign-in is not enabled in Supabase yet. In your Supabase dashboard, open Authentication → Sign In / Providers → ${providerLabel}, add the OAuth Client ID and Secret, enable the provider, and save. Then try again.`;
  }

  return error?.message || `${providerLabel} sign-in could not start. Please try again.`;
}

export default function AuthSocialButtons({ returnTo = "/" }) {
  const [settings, setSettings] = useState(null);
  const [settingsError, setSettingsError] = useState("");
  const [loadingProvider, setLoadingProvider] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    getAuthProviderSettings()
      .then((providerSettings) => {
        if (active) setSettings(providerSettings);
      })
      .catch((error) => {
        console.error("Could not load social sign-in settings:", error);
        if (active) {
          setSettingsError(
            `Social sign-in settings are unavailable. Apply ${AUTH_PROVIDER_MIGRATION} and reload.`
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = async (provider) => {
    setAuthError("");
    setLoadingProvider(provider);
    const providerLabel = PROVIDERS.find((item) => item.id === provider)?.label || provider;
    try {
      const { error } = await requireSupabase().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${returnTo}`,
          ...(provider === "facebook" ? { scopes: "email,public_profile" } : {}),
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error(`${provider} OAuth could not start:`, error);
      setAuthError(getOAuthErrorMessage(error, providerLabel));
      setLoadingProvider("");
    }
  };

  const enabledProviders = PROVIDERS.filter((provider) =>
    settings?.[`${provider.id}_enabled`] && settings?.[`${provider.id}_configured`]
  );

  if (settingsError) {
    return (
      <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
        {settingsError}
      </div>
    );
  }

  if (enabledProviders.length === 0) {
    return (
      <p className="mb-5 text-sm text-muted-foreground">
        Social sign-in is not currently enabled. You can continue with email and password.
      </p>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {enabledProviders.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          className="h-12 w-full text-sm font-medium"
          onClick={() => signIn(id)}
          disabled={Boolean(loadingProvider)}
        >
          {loadingProvider === id ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              {id === "google" ? (
                <Icon className="mr-2 h-5 w-5" />
              ) : (
                <Icon className="mr-2 h-5 w-5 text-[#1877F2]" aria-hidden="true" />
              )}
              Continue with {label}
            </>
          )}
        </Button>
      ))}
      {authError && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {authError}
        </p>
      )}
    </div>
  );
}
