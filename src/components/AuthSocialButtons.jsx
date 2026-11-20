import React, { useEffect, useState } from "react";
import { Facebook, Loader2 } from "lucide-react";
import { requireSupabase } from "@/api/supabaseClient";
import { getAuthProviderSettings } from "@/api/authProviders";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import TranslatedText from "@/components/TranslatedText";
import useRealtimeTables from "@/hooks/useRealtimeTables";

const PROVIDERS = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "facebook", label: "Facebook", icon: Facebook },
];

function getOAuthErrorMessage(providerLabel) {
  return `${providerLabel} sign-in could not start. Please try again or use your email and password.`;
}

export default function AuthSocialButtons({ returnTo = "/" }) {
  const [settings, setSettings] = useState(null);
  const [loadingProvider, setLoadingProvider] = useState("");
  const [authError, setAuthError] = useState("");
  const liveRevision = useRealtimeTables([{ table: "auth_provider_settings" }], "social-auth-buttons");

  useEffect(() => {
    let active = true;
    getAuthProviderSettings()
      .then((providerSettings) => {
        if (active) setSettings(providerSettings);
      })
      .catch((error) => {
        console.error("Could not load social sign-in settings:", error);
      });

    return () => {
      active = false;
    };
  }, [liveRevision]);

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
      setAuthError(getOAuthErrorMessage(providerLabel));
      setLoadingProvider("");
    }
  };

  const enabledProviders = PROVIDERS.filter((provider) =>
    settings?.[`${provider.id}_enabled`] && settings?.[`${provider.id}_configured`]
  );

  if (!settings || enabledProviders.length === 0) return null;

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
              <TranslatedText>Connecting...</TranslatedText>
            </>
          ) : (
            <>
              {id === "google" ? (
                <Icon className="mr-2 h-5 w-5" />
              ) : (
                <Icon className="mr-2 h-5 w-5 text-[#1877F2]" aria-hidden="true" />
              )}
              <TranslatedText>{`Continue with ${label}`}</TranslatedText>
            </>
          )}
        </Button>
      ))}
      {authError && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert" aria-live="polite">
          <TranslatedText>{authError}</TranslatedText>
        </p>
      )}
      <div className="relative pt-2">
        <div className="absolute inset-x-0 top-1/2 border-t border-border" />
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-card px-3 text-muted-foreground"><TranslatedText>or continue with email</TranslatedText></span>
        </div>
      </div>
    </div>
  );
}
