import React from "react";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/LanguageContext";
import { languageLabel } from "@/lib/languages";

/** Switches the language used for ritual step content. */
export default function ContentLanguageSwitcher({ languages = [] }) {
  const { language, setLanguage } = useLanguage();
  if (languages.length < 2) return null;
  const active = languages.includes(language) ? language : languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 px-2.5 rounded-full border border-white/10 bg-[#171522] flex items-center gap-1.5 text-[#D6B56A] text-[11px] font-medium">
          <Globe className="w-3.5 h-3.5" />
          {active.toUpperCase()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#171522] border-white/10 text-[#F5F1E8]">
        {languages.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code)}
            className={code === active ? "text-[#D6B56A]" : ""}
          >
            {languageLabel(code)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}