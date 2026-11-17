import React, { useState } from "react";
import TranslatedText from "@/components/TranslatedText";

export default function UserAvatar({
  src,
  name,
  email,
  className = "",
  imageClassName = "block h-full w-full rounded-full object-cover",
  fallbackClassName = "",
}) {
  const [failedSource, setFailedSource] = useState("");
  const initials = (name || email || "?").trim().charAt(0).toUpperCase();
  const imageFailed = src && failedSource === src;

  return (
    <span className={`box-border inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}>
      <TranslatedText>{src && !imageFailed ? (
        <img
          src={src}
          alt={`${name || "User"} profile photo`}
          className={imageClassName}
          referrerPolicy="no-referrer"
          decoding="async"
          loading="lazy"
          draggable="false"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <span className={`flex h-full w-full items-center justify-center ${fallbackClassName}`} aria-hidden="true">
          {initials}
        </span>
      )}</TranslatedText>
    </span>
  );
}
