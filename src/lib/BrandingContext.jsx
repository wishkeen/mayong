import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/api/supabaseClient";

export const DEFAULT_BRANDING = Object.freeze({
  app_name: "RitualOS",
  logo_url: "",
  icon_url: "",
  accent_color: "#D6B56A",
  secondary_color: "#171522",
  hero_title: "",
  hero_subtitle: "",
});

const BrandingContext = createContext(null);

function hexToHslChannels(hex) {
  const value = hex.slice(1);
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const originalTitle = useMemo(() => document.title, []);
  const originalFavicon = useMemo(() => document.querySelector('link[rel="icon"]')?.href || "", []);

  const refreshBranding = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const { data, error } = await supabase
        .from("app_branding")
        .select("app_name, logo_url, icon_url, accent_color, secondary_color, hero_title, hero_subtitle")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      setBranding({ ...DEFAULT_BRANDING, ...(data || {}) });
    } catch (error) {
      console.error("Could not load app branding:", error);
      setLoadError(error.message || "Branding settings could not be loaded.");
      setBranding(DEFAULT_BRANDING);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBranding = useCallback(async (values) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error("Sign in as an administrator to update branding.");

    const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
    if (roleError) throw roleError;
    if (!isAdmin) throw new Error("Administrator access is required to update branding.");

    const payload = {
      id: 1,
      app_name: values.app_name.trim(),
      logo_url: values.logo_url.trim(),
      icon_url: values.icon_url.trim(),
      accent_color: values.accent_color,
      secondary_color: values.secondary_color,
      hero_title: values.hero_title.trim(),
      hero_subtitle: values.hero_subtitle.trim(),
      updated_by: user.id,
    };
    const { data, error } = await supabase
      .from("app_branding")
      .upsert(payload, { onConflict: "id" })
      .select("app_name, logo_url, icon_url, accent_color, secondary_color, hero_title, hero_subtitle")
      .single();
    if (error) throw error;
    setBranding({ ...DEFAULT_BRANDING, ...data });
    setLoadError("");
    return data;
  }, []);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  useEffect(() => {
    document.documentElement.style.setProperty("--brand-accent", branding.accent_color);
    document.documentElement.style.setProperty("--brand-secondary", branding.secondary_color);
    document.documentElement.style.setProperty("--primary", hexToHslChannels(branding.accent_color));
    document.documentElement.style.setProperty("--ring", hexToHslChannels(branding.accent_color));
    document.documentElement.style.setProperty("--sidebar-primary", hexToHslChannels(branding.accent_color));
    document.title = branding.app_name || DEFAULT_BRANDING.app_name;

    let icon = document.querySelector('link[rel="icon"]');
    if (branding.icon_url) {
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        icon.dataset.brandingManaged = "true";
        document.head.appendChild(icon);
      }
      icon.href = branding.icon_url;
    } else if (icon?.dataset.brandingManaged === "true") {
      icon.remove();
    } else if (icon && originalFavicon) {
      icon.href = originalFavicon;
    }
    return () => {
      document.documentElement.style.removeProperty("--brand-accent");
      document.documentElement.style.removeProperty("--brand-secondary");
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--ring");
      document.documentElement.style.removeProperty("--sidebar-primary");
      document.title = originalTitle;
    };
  }, [branding, originalFavicon, originalTitle]);

  const value = useMemo(
    () => ({ branding, loading, loadError, setBranding, saveBranding, refreshBranding }),
    [branding, loading, loadError, saveBranding, refreshBranding]
  );
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) throw new Error("useBranding must be used within a BrandingProvider");
  return context;
}
