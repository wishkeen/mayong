import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import ProfilePhotoCard from "@/components/profile/ProfilePhotoCard";
import ProfileDetailsCard from "@/components/profile/ProfileDetailsCard";
import ProfileActivityCard from "@/components/profile/ProfileActivityCard";
import PasswordCard from "@/components/profile/PasswordCard";
import { ChevronLeft, LogOut, Mail } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  return (
    <div className="space-y-5 pt-1">
      <button type="button" onClick={goBack} className="text-xs text-[#AAA5B5] inline-flex items-center gap-1 hover:text-[#D6B56A]">
        <ChevronLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div>
        <h1 className="font-display text-3xl leading-tight text-[#F5F1E8]">Your profile</h1>
        <p className="text-sm text-[#AAA5B5] mt-1">Manage your account and see your RitualOS journey.</p>
      </div>

      <ProfilePhotoCard />
      <ProfileDetailsCard />
      {user?.id && <ProfileActivityCard userId={user.id} />}

      <section className="rounded-2xl border border-white/5 bg-[#171522] p-5">
        <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5] mb-3">Account</h2>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#D6B56A]" />
          <p className="text-sm text-[#F5F1E8] break-all">{user?.email}</p>
        </div>
        <p className="text-[11px] text-[#AAA5B5] mt-2">
          Your sign-in email is tied to your account login and can't be changed from the app.
        </p>
        {user?.created_date && (
          <p className="mt-3 border-t border-white/5 pt-3 text-xs text-[#AAA5B5]">
            Member since{" "}
            <time dateTime={user.created_date}>
              {new Date(user.created_date).toLocaleDateString(undefined, { dateStyle: "long" })}
            </time>
          </p>
        )}
      </section>

      <PasswordCard />

      <section className="rounded-2xl border border-white/5 bg-[#171522] p-5">
        <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5] mb-1">Sign out</h2>
        <p className="text-xs text-[#AAA5B5] mb-3">Your rituals and journal stay saved on your account.</p>
        <button
          onClick={() => logout()}
          className="w-full py-2.5 rounded-xl border border-[#c97a7a]/30 text-[#c97a7a] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#c97a7a]/10"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </section>
    </div>
  );
}