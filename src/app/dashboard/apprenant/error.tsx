"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ApprenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard/apprenant]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-extrabold">Espace apprenant indisponible</h1>
      <p className="max-w-md text-sm text-white/70">
        Le chargement a échoué. Si vous postulez à une offre, retournez à votre candidature pour continuer les tests.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black">
          Réessayer
        </button>
        <Link href="/offres/candidature" className="inline-flex h-11 items-center rounded-full border border-white/40 px-5 text-sm font-semibold">
          Reprendre ma candidature
        </Link>
      </div>
    </div>
  );
}
