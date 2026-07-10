"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function SuperError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[super/error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-gray-900">Chargement interrompu</h1>
        <p className="text-sm text-gray-600">
          Cette section n&apos;a pas pu s&apos;afficher. Vous pouvez réessayer ou revenir au tableau de bord.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()} variant="default" className="rounded-full">
          Réessayer
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/super">Tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
