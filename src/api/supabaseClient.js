import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const hasSupabaseEnvironment = Boolean(supabaseUrl && supabasePublishableKey);

let configurationError = "";
let client = null;

if (hasSupabaseEnvironment) {
  try {
    const url = new URL(supabaseUrl);
    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("The Supabase URL must use HTTPS.");
    }

    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  } catch (error) {
    configurationError = error.message || "The Supabase configuration is invalid.";
  }
}

export const supabase = client;
export const isSupabaseConfigured = Boolean(client && !configurationError);

export function getSupabaseConfigurationError() {
  if (configurationError) return configurationError;
  if (!supabaseUrl) return "Set VITE_SUPABASE_URL in the production build environment.";
  if (!supabasePublishableKey) return "Set VITE_SUPABASE_PUBLISHABLE_KEY in the production build environment.";
  return "";
}

export function requireSupabase() {
  if (!client) {
    throw new Error(getSupabaseConfigurationError() || "Supabase is not configured.");
  }
  return client;
}
