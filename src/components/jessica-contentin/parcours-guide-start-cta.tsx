"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  hasAccess: boolean;
  price: number;
  catalogItemId: string | null;
  contentId: string | null;
  startHref: string;
  className?: string;
};

export function ParcoursGuideStartCta({
  hasAccess,
  price,
  catalogItemId,
  contentId,
  startHref,
  className,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (hasAccess) {
      router.push(startHref);
      return;
    }

    if (!catalogItemId && !contentId) {
      router.push("/jessica-contentin/consultations");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session-jessica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogItemId, contentId }),
      });
      const data = await response.json();

      if (response.status === 401) {
        router.push(
          `/jessica-contentin/inscription?redirect=${encodeURIComponent(window.location.pathname)}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Impossible de démarrer le paiement");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("[parcours-guide-start]", error);
      alert(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (hasAccess) {
    return (
      <Link
        href={startHref}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-[#C6A664] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#C6A664]/25 transition hover:bg-[#B88A44]",
          className,
        )}
      >
        Commencer
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleStart()}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-3 rounded-full bg-[#C6A664] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#C6A664]/25 transition hover:bg-[#B88A44] disabled:opacity-70",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <span>Commencer</span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold tracking-wide">
            {price}€
          </span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
