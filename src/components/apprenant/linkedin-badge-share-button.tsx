"use client";

import { useState } from "react";
import { Linkedin, Share2 } from "lucide-react";
import {
  buildOpenBadgeLinkedInShareMessage,
  buildOpenBadgeLinkedInFeedShareUrl,
  buildOpenBadgeLinkedInShareUrl,
} from "@/lib/openbadges/linkedin-share";

type Props = {
  badgeName: string;
  level?: number | null;
  shareUrl: string;
  className?: string;
  variant?: "wallet-dark" | "wallet-light" | "completion";
};

export function LinkedInBadgeShareButton({
  badgeName,
  level,
  shareUrl,
  className = "",
  variant = "wallet-dark",
}: Props) {
  const [hint, setHint] = useState<string | null>(null);

  const message = buildOpenBadgeLinkedInShareMessage({ badgeName, level });
  const linkedInFeedUrl = buildOpenBadgeLinkedInFeedShareUrl({ shareUrl, badgeName, level });
  const linkedInOffsiteUrl = buildOpenBadgeLinkedInShareUrl({ shareUrl, badgeName, level });

  const baseClass =
    variant === "wallet-light"
      ? "inline-flex items-center justify-center gap-2 rounded-full bg-[#0A66C2] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-[#004182]"
      : variant === "completion"
        ? "inline-flex items-center justify-center gap-2 rounded-full bg-[#0A66C2] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#004182]"
        : "inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0A66C2]/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-[#0A66C2]";

  const handleShare = async () => {
    const fullText = `${message}\n\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setHint(
        "Texte copié dans le presse-papiers. LinkedIn s’ouvre : si le message est vide, collez (Ctrl+V). L’aperçu image vient du lien du badge.",
      );
    } catch {
      setHint(
        "LinkedIn s’ouvre. Collez le texte (Ctrl+V) si besoin — l’image du badge apparaît avec le lien.",
      );
    }
    window.open(linkedInFeedUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => {
      window.open(linkedInOffsiteUrl, "_blank", "noopener,noreferrer,width=720,height=640");
    }, 400);
    window.setTimeout(() => setHint(null), 12000);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={() => void handleShare()} className={`${baseClass} ${className}`}>
        {variant === "completion" ? (
          <Linkedin className="h-4 w-4" />
        ) : (
          <Share2 className="h-3 w-3" />
        )}
        Partager sur LinkedIn
      </button>
      {hint ? (
        <p
          className={`text-[10px] leading-snug ${
            variant === "wallet-light" ? "text-black/55" : "text-white/55"
          }`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
