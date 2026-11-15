import React from "react";
import { Moon } from "lucide-react";
import { Image } from "@/components/ui/image";

const GRADIENTS = {
  "mantra-chanting": "from-[#8B6CCF]/45 via-[#3a2a6b]/30 to-[#08070D]",
  "money-prosperity": "from-[#D6B56A]/45 via-[#7a5a2a]/25 to-[#08070D]",
  "love-relationship": "from-[#c97aa8]/45 via-[#5a3a6b]/30 to-[#08070D]",
  "protection-spiritual": "from-[#5a7a8f]/45 via-[#2a3a5a]/30 to-[#08070D]",
  "other-rituals": "from-[#8B6CCF]/40 via-[#D6B56A]/20 to-[#08070D]",
};

/**
 * Ritual cover art. Renders the ritual's uploaded image when present and falls
 * back to a category-tinted gradient for legacy rituals without one.
 */
export default function RitualCover({ ritual, imageUrl, categorySlug, className = "" }) {
  const src = imageUrl || ritual?.image_url;
  const slug = categorySlug || ritual?.category_slug;

  if (src) {
    return (
      <div className={`relative overflow-hidden bg-[#0E0C16] ${className}`}>
        <Image src={src} alt={ritual?.name || "Ritual"} className="w-full h-full" />
      </div>
    );
  }

  const grad = GRADIENTS[slug] || GRADIENTS["other-rituals"];
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${grad} ${className}`}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(214,181,106,0.30), transparent 40%), radial-gradient(circle at 80% 80%, rgba(139,108,207,0.30), transparent 45%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Moon className="w-7 h-7 text-[#F5F1E8]/60 drop-shadow-[0_0_18px_rgba(214,181,106,0.35)]" />
      </div>
    </div>
  );
}