import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const PRIVACY_CONTACT_EMAIL = "REPLACE_WITH_PRIVACY_CONTACT_EMAIL";

function PolicySection({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-xl text-[#F5F1E8]">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-[#C7C2D1]">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  const hasContact = !PRIVACY_CONTACT_EMAIL.startsWith("REPLACE_");
  const deletionMailto = hasContact
    ? `mailto:${PRIVACY_CONTACT_EMAIL}?subject=${encodeURIComponent("Account and data deletion request")}`
    : undefined;

  return (
    <main className="min-h-screen bg-[#08070D] px-5 py-8 text-[#F5F1E8] sm:py-12">
      <article className="mx-auto max-w-3xl space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#D6B56A] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to MAYONG
        </Link>

        <header className="space-y-3 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#AAA5B5]">
            <ShieldCheck className="h-4 w-4 text-[#D6B56A]" /> MAYONG
          </div>
          <h1 className="font-display text-4xl text-[#F5F1E8]">Privacy Policy</h1>
          <p className="text-sm text-[#AAA5B5]">Effective date: November 18, 2026</p>
          <p className="text-sm leading-7 text-[#C7C2D1]">
            This policy explains how MAYONG (“we,” “us,” or “the app”) handles information when you use the app.
          </p>
        </header>

        <PolicySection title="Information we handle">
          <p>
            When you create an account, we handle your email address, account credentials through our authentication
            provider, and any name or profile photo you choose to provide. If you sign in with Google or Facebook
            when those options are enabled, we receive basic account information made available by that provider,
            such as your email address, name, and profile photo.
          </p>
          <p>
            If you use account features, we store your preferred app language, ritual favorites and unlocks, ritual
            session progress and completion dates, and optional journal entries, including notes, mood, and rating.
            Journal notes may contain sensitive personal information, so share only what you are comfortable storing
            in the app.
          </p>
          <p>
            The app stores your sign-in session and language preferences in your browser or device storage. We do not
            use the app to collect precise location, contacts, or payment card details. Paid checkout is not currently
            available.
          </p>
        </PolicySection>

        <PolicySection title="How we use information">
          <p>
            We use this information to create and secure accounts, provide sign-in and password recovery, save your
            ritual progress and journal, remember your settings, and maintain the app. Authorized administrators may
            access account and activity records to administer and support the service.
          </p>
        </PolicySection>

        <PolicySection title="Storage and sharing">
          <p>
            Account and app records are stored using Supabase, which provides our authentication, database, and file
            storage services. Google or Facebook processes sign-in when you choose one of those options, under that
            provider’s own privacy terms. We do not sell personal information or use it for targeted advertising.
          </p>
          <p>
            Profile photos are stored in the app’s media storage. The current storage configuration makes media
            files accessible by URL, so do not upload a photo you intend to keep private. Public ritual images and
            audio are also served from this storage.
          </p>
          <p>
            We do not currently include advertising or analytics SDKs. Service providers may process technical
            information, such as connection and security logs, as needed to operate and protect their services.
          </p>
        </PolicySection>

        <PolicySection title="Retention and account deletion">
          <p>
            We keep account information and saved activity while your account is active or as needed to operate the
            service. You may request deletion of your account and associated personal data using the contact below.
            We may retain limited records when required by law or needed to address security, fraud, or legal claims.
          </p>
          <p>
            To request deletion, email us from the address associated with your account and include “Account and data
            deletion request” in the subject. We may ask for information needed to verify the request. Deleting an
            account removes associated profile and activity records; files such as profile photos are also removed as
            part of processing the request.
          </p>
        </PolicySection>

        <PolicySection title="Children’s privacy">
          <p>
            MAYONG is a general audience app and is not designed to collect personal information from children. If you
            believe a child has provided us personal information, contact us so we can review and address the request.
          </p>
        </PolicySection>

        <PolicySection title="Changes to this policy">
          <p>
            We may update this policy when the app’s data practices change. We will post the current version on this
            page and update its effective date.
          </p>
        </PolicySection>

        <PolicySection title="Contact and privacy requests">
          <p>
            For privacy questions, access or deletion requests, contact the MAYONG app team at:{" "}
            {hasContact ? (
              <a className="text-[#D6B56A] underline" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
                {PRIVACY_CONTACT_EMAIL}
              </a>
            ) : (
              <span className="font-medium text-[#e2a0a0]">app@mayong.org</span>
            )}
          </p>
          {hasContact && (
            <p>
              <a className="text-[#D6B56A] underline" href={deletionMailto}>Request account and data deletion</a>
            </p>
          )}
        </PolicySection>

        <p className="border-t border-white/10 pt-5 text-xs leading-6 text-[#8F899C]">
          This policy describes the current MAYONG app. Please also review the Google Play Data safety form and keep
          its disclosures consistent with the app’s current SDKs, backend configuration, and data practices.
        </p>
      </article>
    </main>
  );
}
