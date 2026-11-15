import React, { useEffect, useState } from "react";

export function MfaHeader({ title, description }) {
  return (
    <div className="space-y-2 pb-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title || "Security check"}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function MfaNotice({ error }) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      {error.message || String(error)}
    </div>
  );
}

export function MfaScreen({ children }) {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}

export function useAppInfo() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    setInfo({ name: "RitualOS", auth_config: { enable_username_password: true } });
  }, []);

  return info;
}
