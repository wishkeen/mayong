import React from "react";

export default function MfaManage({ session, returnTo }) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5 text-card-foreground">
      <h2 className="text-xl font-semibold">Manage your security methods</h2>
      <p className="text-sm text-muted-foreground">
        Review the enrolled sign-in methods for your account.
      </p>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        Session: {session?.id || "active"}
      </div>
      <p className="text-xs text-muted-foreground">Return target: {returnTo || "/"}</p>
    </div>
  );
}
