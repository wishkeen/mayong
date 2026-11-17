import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useBranding } from "@/lib/BrandingContext";
import BrandLogo from "@/components/BrandLogo";
import TranslatedText from "@/components/TranslatedText";

export default function AuthLayout({ title, subtitle, footer, children, variant = "default" }) {
  const { branding } = useBranding();

  if (variant === "focused") {
    return (
      <main className="min-h-screen bg-mystic px-4 py-4 text-foreground sm:px-6 sm:py-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col sm:min-h-[calc(100vh-3rem)]">
          <header className="flex items-center justify-between gap-3">
            <Link to="/" className="inline-flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <BrandLogo
                logoUrl={branding.logo_url}
                mark={branding.app_name?.charAt(0)}
                accentColor={branding.accent_color}
                alt={`${branding.app_name} logo`}
                className="h-9 w-9 shrink-0"
                iconClassName="text-base"
              />
              <span className="truncate font-display text-lg font-semibold text-foreground">
                <TranslatedText>{branding.app_name}</TranslatedText>
              </span>
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span><TranslatedText>Back to app</TranslatedText></span>
            </Link>
          </header>

          <section className="flex flex-1 items-center py-8">
            <div className="w-full">
              <div className="mb-6 text-center">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"><TranslatedText>{title}</TranslatedText></h1>
                <TranslatedText>{subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground"><TranslatedText>{subtitle}</TranslatedText></p>}</TranslatedText>
              </div>
              <div className="rounded-3xl border border-white/10 bg-card/90 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
                {children}
                <TranslatedText>{footer && (
                  <p className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-muted-foreground">
                    {footer}
                  </p>
                )}</TranslatedText>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-mystic px-4 py-5 text-foreground sm:px-6 sm:py-7">
      <div className="pointer-events-none absolute -left-36 top-1/4 h-96 w-96 rounded-full bg-[#8B6CCF]/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-[var(--brand-accent,#D6B56A)]/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col sm:min-h-[calc(100vh-3.5rem)]">
        <header className="flex items-center justify-between">
          <Link to="/" className="inline-flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandLogo
              logoUrl={branding.logo_url}
              mark={branding.app_name?.charAt(0)}
              accentColor={branding.accent_color}
              alt={`${branding.app_name} logo`}
              className="h-10 w-10 shrink-0"
              iconClassName="text-lg"
            />
            <span className="truncate font-display text-xl font-semibold text-foreground">
              <TranslatedText>{branding.app_name}</TranslatedText>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground transition hover:border-white/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span><TranslatedText>Back to app</TranslatedText></span>
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_0.85fr] lg:gap-20 lg:py-14">
          <section className="hidden max-w-xl lg:block">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--brand-accent,#D6B56A)]/25 bg-[var(--brand-accent,#D6B56A)]/10 text-[var(--brand-accent,#D6B56A)]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.24em] text-[var(--brand-accent,#D6B56A)]">
              <TranslatedText>Your personal sanctuary</TranslatedText>
            </p>
            <h1 className="font-display text-5xl font-medium leading-[1.08] tracking-tight text-foreground xl:text-6xl">
              <TranslatedText>{branding.hero_title || "Make space for what matters."}</TranslatedText>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
              <TranslatedText>{branding.hero_subtitle || "Return to your practice, find your rhythm, and continue where you left off."}</TranslatedText>
            </p>
            <div className="mt-10 h-px w-24 bg-gradient-to-r from-[var(--brand-accent,#D6B56A)] to-transparent" />
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-7 text-center lg:text-left">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"><TranslatedText>{title}</TranslatedText></h2>
              <TranslatedText>{subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground"><TranslatedText>{subtitle}</TranslatedText></p>}</TranslatedText>
            </div>
            <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
              {children}
              <TranslatedText>{footer && (
                <p className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-muted-foreground">
                  {footer}
                </p>
              )}</TranslatedText>
            </div>
          </section>
        </div>

        <footer className="py-2 text-center text-xs text-muted-foreground/70">
          <TranslatedText>A calm space for your daily practice</TranslatedText>
        </footer>
      </div>
    </main>
  );
}
