import React from "react";

export default function ProfileDetailsCard() {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#171522] p-5">
      <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5] mb-3">Profile details</h2>
      <div className="space-y-2 text-sm text-[#F5F1E8]">
        <p>Account settings are available from the authenticated profile.</p>
        <p className="text-[#AAA5B5]">More profile customizations can be added here later.</p>
      </div>
    </section>
  );
}
