"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] px-6 text-center text-white">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Chargement interrompu</h1>
        <p className="text-white/70">
          La page n&apos;a pas pu s&apos;afficher correctement. Réessayez ou retournez à l&apos;accueil.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()} className="rounded-full bg-white text-black hover:bg-white/90">
          Réessayer
        </Button>
        <Button asChild variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10">
          <Link href="/">Accueil</Link>
        </Button>
      </div>
    </div>
  );
}


