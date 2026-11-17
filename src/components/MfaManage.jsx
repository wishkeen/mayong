import React from "react";
import TranslatedText from "@/components/TranslatedText";

export default function MfaManage({ session, returnTo }) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5 text-card-foreground">
      <h2 className="text-xl font-semibold"><TranslatedText>Manage your security methods</TranslatedText></h2>
      <p className="text-sm text-muted-foreground">
        <TranslatedText>
        Review the enrolled sign-in methods for your account.
      </TranslatedText></p>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        <TranslatedText>
        Session: </TranslatedText><TranslatedText>{session?.id || "active"}</TranslatedText>
      </div>
      <p className="text-xs text-muted-foreground"><TranslatedText>Return target: </TranslatedText>{returnTo || "/"}</p>
    </div>
  );
}
