import React from "react";
import TranslatedText from "@/components/TranslatedText";

export default function MfaFlow({ challenge, returnTo, onManage }) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5 text-card-foreground">
      <h2 className="text-xl font-semibold"><TranslatedText>Verify your sign-in</TranslatedText></h2>
      <p className="text-sm text-muted-foreground">
        <TranslatedText>
        A second verification step is required before continuing.
      </TranslatedText></p>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        <TranslatedText>
        Challenge: </TranslatedText><TranslatedText>{challenge?.id || "pending"}</TranslatedText>
      </div>
      {onManage && (
        <button
          type="button"
          onClick={() => onManage(true)}
          className="text-sm font-medium text-primary hover:underline"
        >
          <TranslatedText>Manage MFA settings</TranslatedText>
        </button>
      )}
      <p className="text-xs text-muted-foreground"><TranslatedText>Return target: </TranslatedText>{returnTo || "/"}</p>
    </div>
  );
}
