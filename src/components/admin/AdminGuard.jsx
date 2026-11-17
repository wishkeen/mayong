import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { ShieldAlert } from "lucide-react";
import TranslatedText from "@/components/TranslatedText";

export default function AdminGuard({ children }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-mystic flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D6B56A]/30 border-t-[#D6B56A] rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-mystic flex flex-col items-center justify-center text-center px-6">
        <ShieldAlert className="w-10 h-10 text-[#8B6CCF] mb-3" />
        <h1 className="font-display text-2xl text-[#F5F1E8]"><TranslatedText>Admin access required</TranslatedText></h1>
        <p className="text-sm text-[#AAA5B5] mt-2 max-w-xs">
          <TranslatedText>
          Your account does not have permission to view this dashboard.
        </TranslatedText></p>
      </div>
    );
  }

  return children;
}