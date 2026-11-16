import { requireSupabase } from "@/api/supabaseClient";

export const AUTH_PROVIDER_MIGRATION = "20261116050000_social_auth_settings.sql";

export const DEFAULT_AUTH_PROVIDER_SETTINGS = {
  google_enabled: false,
  google_configured: false,
  facebook_enabled: false,
  facebook_configured: false,
};

const AUTH_PROVIDER_FIELDS = Object.keys(DEFAULT_AUTH_PROVIDER_SETTINGS);

export async function getAuthProviderSettings() {
  const { data, error } = await requireSupabase()
    .from("auth_provider_settings")
    .select(AUTH_PROVIDER_FIELDS.join(", "))
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data;
}

export async function saveAuthProviderSettings(settings) {
  const updates = Object.fromEntries(
    AUTH_PROVIDER_FIELDS.map((field) => [field, Boolean(settings[field])])
  );

  if (updates.google_enabled && !updates.google_configured) {
    throw new Error("Configure and test Google in Supabase before enabling its sign-in button.");
  }
  if (updates.facebook_enabled && !updates.facebook_configured) {
    throw new Error("Configure and test Facebook in Supabase before enabling its sign-in button.");
  }

  const { data, error } = await requireSupabase()
    .from("auth_provider_settings")
    .update(updates)
    .eq("id", 1)
    .select(AUTH_PROVIDER_FIELDS.join(", "))
    .single();

  if (error) throw error;
  return data;
}

export function getSupabaseAuthCallbackUrl() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (!supabaseUrl) return null;

  try {
    const url = new URL(supabaseUrl);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    return new URL("/auth/v1/callback", url).toString();
  } catch {
    return null;
  }
}
