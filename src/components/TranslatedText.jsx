import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { translatePublicText } from "@/lib/translation";

export default function TranslatedText({ children, as: Element = "span", language: targetLanguage, ...props }) {
  const { language } = useLanguage();
  const source = typeof children === "string" ? children : "";
  const activeLanguage = targetLanguage || language;

  if (typeof children !== "string") {
    if (Element === "span" && Object.keys(props).length === 0) return <>{children}</>;
    return <Element {...props}>{children}</Element>;
  }
  return <Element {...props}>{translatePublicText(source, activeLanguage)}</Element>;
}

export function useTranslatedValue(value) {
  const { language } = useLanguage();
  return translatePublicText(value, language);
}
