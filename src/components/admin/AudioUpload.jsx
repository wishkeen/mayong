import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AudioUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
    } catch (e) {
      console.error("Audio upload failed", e);
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
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2.5 rounded-lg border border-dashed border-white/15 text-[#AAA5B5] text-xs inline-flex items-center justify-center gap-2 hover:border-[#D6B56A]/40 hover:text-[#D6B56A] disabled:opacity-60"
      >
        {uploading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
        ) : (
          <><Upload className="w-3.5 h-3.5" /> Upload audio file</>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </>
  );
}