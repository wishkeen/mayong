import React, { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { uploadProfileAvatar, removeProfileAvatar } from "@/api/supabaseStorage";
import { useAuth } from "@/lib/AuthContext";
import { Image } from "@/components/ui/image";

export default function ProfilePhotoCard() {
  const { user, updateProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef(null);
  const initials = (user?.full_name || user?.email || "?").trim().charAt(0).toUpperCase();

  const changePhoto = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { file_url: avatarUrl } = await uploadProfileAvatar(file, user.id);
      const oldAvatarUrl = user.avatar_url;
      try {
        await updateProfile({ avatar_url: avatarUrl });
      } catch (saveError) {
        await removeProfileAvatar(avatarUrl, user.id).catch((cleanupError) => {
          console.error("Could not clean up an avatar that was not saved to the profile:", cleanupError);
        });
        throw saveError;
      }
      if (oldAvatarUrl) {
        await removeProfileAvatar(oldAvatarUrl, user.id).catch((cleanupError) => {
          console.error("The profile photo was updated, but its previous file could not be removed:", cleanupError);
          setNotice("Photo updated. The previous image could not be removed from storage.");
        });
      }
    } catch (uploadError) {
      console.error("Profile photo update failed:", uploadError);
      setError(uploadError.message || "Could not update your profile photo.");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const oldAvatarUrl = user.avatar_url;
      await updateProfile({ avatar_url: "" });
      if (oldAvatarUrl) {
        await removeProfileAvatar(oldAvatarUrl, user.id).catch((cleanupError) => {
          console.error("The profile photo was removed, but its file could not be cleaned up:", cleanupError);
          setNotice("Photo removed from your profile. Its old file could not be removed from storage.");
        });
      }
    } catch (removeError) {
      console.error("Profile photo removal failed:", removeError);
      setError(removeError.message || "Could not remove your profile photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-[#171522] p-5">
      <h2 className="text-xs tracking-[0.2em] uppercase text-[#AAA5B5] mb-3">Profile photo</h2>
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#D6B56A]/30 bg-[#D6B56A]/15 flex items-center justify-center text-lg font-semibold text-[#F5F1E8]">
          {user?.avatar_url ? (
            <Image src={user.avatar_url} alt="Your profile photo" className="h-full w-full object-cover" />
          ) : initials}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-[#D6B56A]/40 px-3 py-2 text-xs text-[#D6B56A] inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {user?.avatar_url ? "Change photo" : "Upload photo"}
          </button>
          {user?.avatar_url && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={busy}
              className="rounded-lg border border-[#c97a7a]/30 px-3 py-2 text-xs text-[#c97a7a] inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          changePhoto(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <p className="mt-3 text-[11px] text-[#777184]">JPG, PNG, WebP, or GIF · up to 5 MB</p>
      {error && <p role="alert" className="mt-2 text-xs text-[#e0a0a0]">{error}</p>}
      {notice && <p role="status" className="mt-2 text-xs text-[#D6B56A]">{notice}</p>}
    </section>
  );
}
