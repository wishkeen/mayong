import React from "react";

export default function ProfilePhotoCard() {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#171522] p-5">
      <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5] mb-3">Profile photo</h2>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D6B56A]/15 text-lg font-semibold text-[#F5F1E8]">
          R
        </div>
        <div>
          <p className="text-sm text-[#F5F1E8]">Photo updates are managed in your account settings.</p>
        </div>
      </div>
    </section>
  );
}
