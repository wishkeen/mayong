import React from "react";

export default function GoogleAuthSettings() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#171522] p-5">
      <h3 className="text-sm font-medium text-[#F5F1E8]">Google sign-in</h3>
      <p className="mt-2 text-sm text-[#AAA5B5]">
        Configure Google as an OAuth provider in Supabase Authentication, then add your production domain to the allowed redirect URLs.
      </p>
    </section>
  );
}
