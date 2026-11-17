import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadRitualAsset } from "@/api/supabaseStorage";
import TranslatedText from "@/components/TranslatedText";

export default function AudioUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { file_url } = await uploadRitualAsset(file);
      onChange(file_url);
    } catch (e) {
      console.error("Audio upload failed", e);
      setError(e.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#08070D] px-3 py-1.5">
        <audio src={value} controls className="h-8 flex-1 min-w-0 w-full" />
        <button type="button" onClick={() => onChange("")} className="text-[#c97a7a] flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2.5 rounded-lg border border-dashed border-white/15 text-[#AAA5B5] text-xs inline-flex items-center justify-center gap-2 hover:border-[#D6B56A]/40 hover:text-[#D6B56A] disabled:opacity-60"
      >
        {uploading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> <TranslatedText>Uploading…</TranslatedText></>
        ) : (
          <><Upload className="w-3.5 h-3.5" /> <TranslatedText>Upload audio file</TranslatedText></>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <TranslatedText>{error && <p className="mt-1.5 text-[11px] text-[#c97a7a]">{error}</p>}</TranslatedText>
    </div>
  );
}