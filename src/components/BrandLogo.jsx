import React from "react";

export default function BrandLogo({
  logoUrl,
  alt = "App logo",
  className = "",
  iconClassName = "",
}) {
  const baseClassName = "inline-flex items-center justify-center overflow-hidden rounded-full bg-[#D6B56A]/10 text-[#D6B56A] border border-[#D6B56A]/20";

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={alt}
        className={`${baseClassName} ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${baseClassName} ${className}`}>
      <span className={`font-display ${iconClassName || "text-sm"}`}>R</span>
    </div>
  );
}
