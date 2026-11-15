import React, { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

/**
 * Admin image uploader. Stores the file publicly so it can be shown to every
 * visitor, including guests browsing rituals.
 */
export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
    } catch (e) {
      console.error("Image upload failed", e);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#08070D]">
          <Image src={value} alt="Ritual cover" className="w-full h-40" />
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-2.5 py-1.5 rounded-lg bg-[#08070D]/85 border border-white/10 text-[#F5F1E8] text-[11px] inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="w-7 h-7 rounded-lg bg-[#08070D]/85 border border-white/10 text-[#c97a7a] flex items-center justify-center"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-40 rounded-xl border border-dashed border-white/15 bg-[#08070D] text-[#AAA5B5] text-xs inline-flex flex-col items-center justify-center gap-2 hover:border-[#D6B56A]/40 hover:text-[#D6B56A] disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <ImageIcon className="w-5 h-5" /> Upload ritual image
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="text-[11px] text-[#c97a7a] mt-1.5">{error}</p>}
    </div>
  );
}