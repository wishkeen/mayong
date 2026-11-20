import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getSupabaseConfigurationError, isSupabaseConfigured, supabase } from "@/api/supabaseClient";
import { supabaseEntities } from "@/api/supabaseData";
import useRealtimeTables from "@/hooks/useRealtimeTables";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const profileRevision = useRealtimeTables(
    user?.id ? [{ table: "profiles", filter: `id=eq.${user.id}` }] : [],
    `signed-in-profile:${user?.id || "none"}`
  );

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, []);

  const loadProfile = useCallback(async (authUser) => {
    setIsLoadingAuth(true);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, preferred_language, avatar_url, created_date")
        .eq("id", authUser.id)
        .single();
      if (error) throw error;

      setUser({
        ...profile,
        email: authUser.email || profile.email,
        full_name: profile.full_name || authUser.user_metadata?.full_name || "",
      });
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      console.error("Could not load the signed-in user's profile:", error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: "profile_error",
        message: error.message || "Could not load your account profile.",
      });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsLoadingAuth(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.user) {
        clearAuthState();
        return;
      }
      await loadProfile(session.user);
    } catch (error) {
      console.error("Supabase authentication check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: "profile_error",
        message: error.message || "Could not verify your account. Please sign in again.",
      });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [clearAuthState, loadProfile]);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);

    if (!isSupabaseConfigured) {
      setAuthError({
        type: "config_error",
        message: getSupabaseConfigurationError(),
      });
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      setAuthChecked(true);
      return;
    }

    setAppPublicSettings({ provider: "supabase" });
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.user) {
        await loadProfile(session.user);
      } else {
        clearAuthState();
      }
    } catch (error) {
      console.error("Could not initialize Supabase authentication:", error);
      setAuthError({
        type: "profile_error",
        message: error.message || "Could not connect to Supabase Auth.",
      });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } finally {
      setIsLoadingPublicSettings(false);
    }
  }, [clearAuthState, loadProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      checkAppState();
      return undefined;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (session?.user) {
          loadProfile(session.user);
        } else {
          clearAuthState();
        }
      });
    });

    checkAppState();
    return () => subscription.unsubscribe();
  }, [checkAppState, clearAuthState, loadProfile]);

  useEffect(() => {
    if (!user?.id || profileRevision === 0) return undefined;
    let active = true;
    supabase.from("profiles")
      .select("id, email, full_name, role, preferred_language, avatar_url, created_date")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active && data) {
          setUser((current) => current?.id === data.id ? { ...current, ...data, email: current.email || data.email } : current);
        }
      })
      .catch((error) => console.error("Could not refresh profile data:", error));
    return () => { active = false; };
  }, [profileRevision, user?.id]);

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError({ type: "profile_error", message: error.message });
      return;
    }
    if (shouldRedirect) window.location.assign("/login");
  };

  const updateProfile = useCallback(async (values) => {
    if (!user?.id) throw new Error("Sign in to update your profile.");
    const allowedFields = ["full_name", "preferred_language", "avatar_url"];
    const updates = Object.fromEntries(
      Object.entries(values).filter(([field]) => allowedFields.includes(field))
    );
    if (Object.keys(updates).length === 0) throw new Error("There are no profile changes to save.");

    const savedProfile = await supabaseEntities.User.update(user.id, updates);
    setUser((current) => current?.id === user.id ? { ...current, ...savedProfile } : current);
    return savedProfile;
  }, [user?.id]);

  const navigateToLogin = () => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      demoMode: false,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      updateProfile,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
