import React from "react";

export default function MfaFlow({ challenge, returnTo, onManage }) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5 text-card-foreground">
      <h2 className="text-xl font-semibold">Verify your sign-in</h2>
      <p className="text-sm text-muted-foreground">
        A second verification step is required before continuing.
      </p>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        Challenge: {challenge?.id || "pending"}
      </div>
      {onManage && (
        <button
          type="button"
          onClick={() => onManage(true)}
          className="text-sm font-medium text-primary hover:underline"
        >
          Manage MFA settings
        </button>
      )}
      <p className="text-xs text-muted-foreground">Return target: {returnTo || "/"}</p>
    </div>
  );
}
