import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import TranslatedText from "@/components/TranslatedText";

export default function Mfa() {
  return (
    <AuthLayout
      icon={ShieldAlert}
      title="Security verification unavailable"
      subtitle="This app's previous MFA handoff used Base44 authentication."
      footer={<Link to="/login" className="text-primary font-medium hover:underline"><TranslatedText>Back to login</TranslatedText></Link>}
    >
      <p className="text-center text-sm leading-relaxed text-muted-foreground">
        <TranslatedText>
        Sign-in and account recovery now use Supabase. Multi-factor enrollment and verification need to be configured for Supabase before this route can complete an MFA challenge.
        </TranslatedText>
      </p>
    </AuthLayout>
  );
}
