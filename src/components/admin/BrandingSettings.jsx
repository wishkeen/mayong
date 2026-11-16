import React, { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, RotateCcw, Save, Upload } from "lucide-react";
import { uploadBrandImage, removeBrandImage } from "@/api/supabaseStorage";
import { DEFAULT_BRANDING, useBranding } from "@/lib/BrandingContext";
import { Image } from "@/components/ui/image";

const fieldClass = "mt-1 w-full rounded-lg border border-white/10 bg-[#08070D] px-3 py-2 text-sm text-[#F5F1E8] placeholder:text-[#777184] focus:outline-none focus:ring-1 focus:ring-[#D6B56A]";
const colorPattern = /^#[\da-f]{6}$/i;

function validateImageUrl(value, label) {
  if (!value) return;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a complete HTTPS URL.`);
  }
  if (url.protocol !== "https:") throw new Error(`${label} must use HTTPS.`);
}

export default function BrandingSettings() {
  const { branding, loading, loadError, saveBranding } = useBranding();
  const [draft, setDraft] = useState(DEFAULT_BRANDING);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const logoInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const uploadedImagesRef = useRef([]);

  useEffect(() => {
    setDraft({ ...DEFAULT_BRANDING, ...branding });
  }, [branding]);

  const setField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setError("");
    setNotice("");
  };

  const uploadImage = async (field, file) => {
    if (!file) return;
    setUploading(field);
    setError("");
    setNotice("");
    try {
      const imageUrl = await uploadBrandImage(file);
      uploadedImagesRef.current.push(imageUrl);
      setField(field, imageUrl);
      setNotice("Image uploaded. Save branding to publish it.");
    } catch (uploadError) {
      console.error("Brand image upload failed:", uploadError);
      setError(uploadError.message || "Could not upload this brand image.");
    } finally {
      setUploading("");
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      validateImageUrl(draft.logo_url, "Logo URL");
      validateImageUrl(draft.icon_url, "Browser icon URL");
      if (!colorPattern.test(draft.accent_color) || !colorPattern.test(draft.secondary_color)) {
        throw new Error("Choose valid six-digit hex colors.");
      }

      const previousImages = [branding.logo_url, branding.icon_url];
      await saveBranding(draft);
      setNotice("Branding saved and published.");

      const retained = new Set([draft.logo_url, draft.icon_url]);
      const cleanupCandidates = [...previousImages, ...uploadedImagesRef.current];
      const removed = [...new Set(cleanupCandidates.filter((url) => url && !retained.has(url)))];
      uploadedImagesRef.current = [];
      const cleanupResults = await Promise.all(removed.map((url) => removeBrandImage(url).then(
        () => null,
        (cleanupError) => cleanupError
      )));
      if (cleanupResults.some(Boolean)) {
        console.error("Branding was saved, but one or more unused images could not be removed:", cleanupResults.filter(Boolean));
        setNotice("Branding published. An unused image could not be removed from storage.");
      }
    } catch (saveError) {
      console.error("Brand settings could not be saved:", saveError);
      setError(saveError.message || "Could not save branding settings.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setDraft({ ...DEFAULT_BRANDING });
    setError("");
    setNotice("Defaults are shown. Save changes to publish them.");
    const stagedImages = [...uploadedImagesRef.current];
    uploadedImagesRef.current = [];
    Promise.all(stagedImages.map((url) => removeBrandImage(url).catch((cleanupError) => {
      console.error("Could not remove a discarded staged brand image:", cleanupError);
    })));
  };

  const imageField = (field, label, ref, accept) => (
    <div>
      <label htmlFor={`${field}-url`} className="block text-xs text-[#AAA5B5]">{label} URL</label>
      <input
        id={`${field}-url`}
        type="url"
        value={draft[field]}
        onChange={(event) => setField(field, event.target.value)}
        maxLength={2048}
        placeholder="https://example.com/image.png"
        className={fieldClass}
      />
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          uploadImage(field, event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={Boolean(uploading) || saving}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-[#AAA5B5] disabled:opacity-50"
      >
        {uploading === field ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        Upload image
      </button>
    </div>
  );

  if (loading) {
    return <div className="h-48 rounded-2xl bg-[#171522] animate-pulse" role="status">Loading branding…</div>;
  }

  return (
    <div className="space-y-5">
      {loadError && (
        <p role="alert" className="rounded-xl border border-[#c97a7a]/30 bg-[#c97a7a]/5 p-3 text-xs text-[#e0a0a0]">
          Branding settings could not be loaded. Apply the `20261116020000_app_branding.sql` migration and reload this page.
          <span className="block mt-1 text-[#AAA5B5]">{loadError}</span>
        </p>
      )}

      <form onSubmit={save} className="space-y-5">
        <section className="rounded-2xl border border-white/5 bg-[#171522] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-[#F5F1E8]">Brand identity</h2>
            <p className="mt-1 text-xs text-[#AAA5B5]">Update your app name and brand images. Changes are shared with all visitors.</p>
          </div>

          <label className="block text-xs text-[#AAA5B5]">
            App name
            <input
              value={draft.app_name}
              onChange={(event) => setField("app_name", event.target.value)}
              required
              minLength={1}
              maxLength={60}
              className={fieldClass}
            />
          </label>

          {imageField("logo_url", "Logo", logoInputRef, "image/jpeg,image/png,image/webp,image/gif")}
          {imageField("icon_url", "Browser icon", iconInputRef, "image/png,image/webp,image/x-icon,image/vnd.microsoft.icon")}
          <p className="text-[11px] text-[#777184]">Images must be HTTPS and no larger than 5 MB when uploaded.</p>
        </section>

        <section className="rounded-2xl border border-white/5 bg-[#171522] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-[#F5F1E8]">Colors</h2>
            <p className="mt-1 text-xs text-[#AAA5B5]">Set the accent and surface colors used by the app shell and brand preview.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["accent_color", "Accent color"],
              ["secondary_color", "Brand surface color"],
            ].map(([field, label]) => (
              <label key={field} className="block text-xs text-[#AAA5B5]">
                {label}
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    value={colorPattern.test(draft[field]) ? draft[field] : DEFAULT_BRANDING[field]}
                    onChange={(event) => setField(field, event.target.value.toUpperCase())}
                    className="h-10 w-12 cursor-pointer rounded border border-white/10 bg-transparent p-1"
                    aria-label={label}
                  />
                  <input
                    value={draft[field]}
                    onChange={(event) => setField(field, event.target.value)}
                    maxLength={7}
                    pattern="#[0-9a-fA-F]{6}"
                    className={`${fieldClass} mt-0 font-mono uppercase`}
                  />
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/5 bg-[#171522] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-[#F5F1E8]">Home page introduction</h2>
            <p className="mt-1 text-xs text-[#AAA5B5]">Optional text shown at the top of the home page.</p>
          </div>
          <label className="block text-xs text-[#AAA5B5]">
            Heading
            <input
              value={draft.hero_title}
              onChange={(event) => setField("hero_title", event.target.value)}
              maxLength={120}
              placeholder="Leave blank to use the personalized welcome"
              className={fieldClass}
            />
          </label>
          <label className="block text-xs text-[#AAA5B5]">
            Description
            <textarea
              value={draft.hero_subtitle}
              onChange={(event) => setField("hero_subtitle", event.target.value)}
              maxLength={240}
              rows={3}
              placeholder="Guided traditional & spiritual rituals, performed step by step."
              className={fieldClass}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-white/5 bg-[#171522] p-5">
          <h2 className="text-xs uppercase tracking-widest text-[#AAA5B5]">Preview</h2>
          <div className="mt-3 flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: draft.secondary_color }}>
            {draft.logo_url ? (
              <Image src={draft.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                style={{ color: draft.accent_color, border: `1px solid ${draft.accent_color}66` }}
              >
                {(draft.app_name || "A").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-xl" style={{ color: draft.accent_color }}>{draft.app_name || "App name"}</p>
              <p className="text-xs text-[#AAA5B5]">{draft.hero_title || "Home page introduction"}</p>
            </div>
            <ImageIcon className="ml-auto h-4 w-4 shrink-0" style={{ color: draft.accent_color }} />
          </div>
        </section>

        {error && <p role="alert" className="text-xs text-[#e0a0a0]">{error}</p>}
        {notice && <p role="status" className="text-xs text-[#D6B56A]">{notice}</p>}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={reset}
            disabled={saving || Boolean(uploading)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2.5 text-xs text-[#AAA5B5] disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset draft
          </button>
          <button
            type="submit"
            disabled={saving || Boolean(uploading) || !draft.app_name.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D6B56A] to-[#8B6CCF] px-4 py-2.5 text-xs font-semibold text-[#08070D] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Publishing…" : "Save & publish"}
          </button>
        </div>
      </form>

    </div>
  );
}
