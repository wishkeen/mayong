import React from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { Home, Compass, BookMarked, BookOpen, TrendingUp, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useBranding } from "@/lib/BrandingContext";
import BrandLogo from "@/components/BrandLogo";

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
  const visibleNavItems = demoMode
    ? [
        ...navItems.slice(0, 2),
        { to: "/admin", label: "Admin", icon: ShieldCheck, end: false },
      ]
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
            <span className="font-display text-xl tracking-wide text-[#F5F1E8]">{branding.app_name}</span>
          </Link>
          {isAuthenticated ? (
            <Link
              to="/profile"
              aria-label="Open profile"
              className="w-8 h-8 rounded-full border border-[#D6B56A]/40 bg-[#171522] flex items-center justify-center text-xs font-medium text-[#D6B56A] hover:border-[#D6B56A] transition-colors"
            >
              {(user?.full_name || user?.email || "✦").charAt(0).toUpperCase()}
            </Link>
          ) : (
            <Link to="/login" className="text-xs tracking-wide text-[#AAA5B5] hover:text-[#D6B56A] transition-colors">
              Sign in
            </Link>
          )}
        </header>

        <main className="flex-1 px-5 pb-28">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-[#08070D]/90 backdrop-blur-md">
          <div className={`max-w-md mx-auto grid ${demoMode ? "grid-cols-3" : "grid-cols-5"}`}>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-3 text-[10px] tracking-wide transition-colors ${
                      isActive ? "text-[#D6B56A]" : "text-[#AAA5B5]"
                    }`
                  }
                  style={({ isActive }) => isActive ? { color: branding.accent_color } : undefined}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}