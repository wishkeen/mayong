import React from "react";
import { Image } from "@/components/ui/image";

export default function BrandLogo({
  logoUrl,
  mark = "R",
  accentColor = "var(--brand-accent, #D6B56A)",
  alt = "App logo",
  className = "",
  iconClassName = "",
}) {
  const baseClassName = "inline-flex items-center justify-center overflow-hidden rounded-full";
  const style = {
    backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
    color: accentColor,
    border: `1px solid color-mix(in srgb, ${accentColor} 32%, transparent)`,
  };

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={alt}
        className={`${baseClassName} ${className}`}
        style={style}
        loading="lazy"
      />
    );
  }

  return <div className={`${baseClassName} ${className}`} style={style}>
    <span className={`font-display ${iconClassName || "text-sm"}`}>{mark || "R"}</span>
  </div>;
}
