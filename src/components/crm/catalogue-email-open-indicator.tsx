"use client";

import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  sentAt?: string | null;
  openedAt?: string | null;
  className?: string;
  size?: "sm" | "md";
};

/** Indicateur d'ouverture email catalogue : rouge = envoyé non ouvert, vert = ouvert. */
export function CatalogueEmailOpenIndicator({
  sentAt,
  openedAt,
  className,
  size = "sm",
}: Props) {
  if (!sentAt) return null;

  const opened = Boolean(openedAt);
  const title = opened
    ? `Catalogue ouvert${openedAt ? ` le ${new Date(openedAt).toLocaleString("fr-FR")}` : ""}`
    : `Catalogue envoyé${sentAt ? ` le ${new Date(sentAt).toLocaleString("fr-FR")}` : ""} — non ouvert`;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        opened ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400",
        size === "sm" ? "h-6 w-6" : "h-8 w-8",
        className,
      )}
      aria-label={title}
    >
      <Mail className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );
}
