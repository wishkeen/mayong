import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const defaultBranding = {
  app_name: "RitualOS",
  logo_url: "",
  accent_color: "#D6B56A",
  secondary_color: "#171522",
  hero_title: "",
  hero_subtitle: "",
};

const BrandingContext = createContext(null);

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadBranding = async () => {
      try {
        if (isMounted) {
          setBranding(defaultBranding);
        }
      } catch (error) {
        console.error("Branding settings could not be initialized:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBranding();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => ({ branding, loading, setBranding }), [branding, loading]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
