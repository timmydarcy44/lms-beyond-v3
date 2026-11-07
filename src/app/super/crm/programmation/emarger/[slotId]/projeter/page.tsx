"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Redirige vers la page projetée publique /e/p/[slotId] (hors Super). */
export default function EmargementProjectRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slotId = String(params.slotId ?? "");

  useEffect(() => {
    if (slotId) router.replace(`/e/p/${slotId}`);
  }, [router, slotId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] text-[#A3A8C7]">
      Ouverture de l&apos;écran projeté…
    </main>
  );
}
