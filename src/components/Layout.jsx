import React from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { Home, Compass, BookMarked, BookOpen, TrendingUp, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useBranding } from "@/lib/BrandingContext";
import BrandLogo from "@/components/BrandLogo";
import UserAvatar from "@/components/UserAvatar";
import TranslatedText, { useTranslatedValue } from "@/components/TranslatedText";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/browse", label: "Explore", icon: Compass, end: false },
  { to: "/my-rituals", label: "Rituals", icon: BookMarked, end: false },
  { to: "/journal", label: "Journal", icon: BookOpen, end: false },
  { to: "/journey", label: "Journey", icon: TrendingUp, end: false },
];

export default function Layout() {
  const { isAuthenticated, user, demoMode } = useAuth();
  const { branding } = useBranding();
  const profileLinkLabel = useTranslatedValue("Open profile");
  const visibleNavItems = demoMode
    ? [
        ...navItems.slice(0, 2),
        { to: "/admin", label: "Admin", icon: ShieldCheck, end: false },
      ]
    : user?.role === "admin"
      ? [...navItems, { to: "/admin", label: "Admin", icon: ShieldCheck, end: false }]
      : navItems;

  return (
    <div className="min-h-screen bg-mystic text-[#F5F1E8]">
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
        <header className="px-5 pt-5 pb-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo
              logoUrl={branding.logo_url}
              mark={branding.app_name?.charAt(0)}
              alt={`${branding.app_name} logo`}
              className="w-7 h-7"
              iconClassName="text-sm"
            />
            <span className="font-display text-xl tracking-wide text-[#F5F1E8]"><TranslatedText>{branding.app_name}</TranslatedText></span>
          </Link>
          <TranslatedText>{isAuthenticated ? (
            <Link
              to="/profile"
              aria-label={profileLinkLabel}
              className="rounded-full text-xs font-medium text-[#D6B56A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6B56A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08070D]"
            >
              <UserAvatar
                src={user?.avatar_url}
                name={user?.full_name}
                email={user?.email}
                className="h-9 w-9 ring-1 ring-inset ring-[#D6B56A]/50"
                fallbackClassName="bg-[#171522] text-[#D6B56A]"
              />
            </Link>
          ) : (
            <Link to="/login" className="text-xs tracking-wide text-[#AAA5B5] hover:text-[#D6B56A] transition-colors">
              <TranslatedText>Sign in</TranslatedText>
            </Link>
          )}</TranslatedText>
        </header>

        <main className="flex-1 px-5 pb-24">
          <Outlet />
          <footer className="mt-8 border-t border-white/5 pt-4 pb-2 text-center text-xs text-[#8F899C]">
            <Link to="/privacy" className="hover:text-[#D6B56A] hover:underline">Privacy Policy</Link>
          </footer>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-[#08070D]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
          <div className={`max-w-md mx-auto grid ${visibleNavItems.length === 6 ? "grid-cols-6" : visibleNavItems.length === 3 ? "grid-cols-3" : "grid-cols-5"}`}>
            <TranslatedText>{visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2.5 text-[10px] tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D6B56A] ${
                      isActive ? "text-[#D6B56A]" : "text-[#AAA5B5]"
                    }`
                  }
                  style={({ isActive }) => isActive ? { color: branding.accent_color } : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <TranslatedText>{item.label}</TranslatedText>
                </NavLink>
              );
            })}</TranslatedText>
          </div>
        </nav>
      </div>
    </div>
  );
}
