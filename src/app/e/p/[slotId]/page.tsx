"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Compat : /e/p/[slotId] → /e?slot= (route /e fiable en prod). */
export default function EmargementProjectRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slotId = String(params.slotId ?? "");

  useEffect(() => {
    if (slotId) router.replace(`/e?slot=${encodeURIComponent(slotId)}`);
  }, [router, slotId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] text-[#A3A8C7]">
      Ouverture de l&apos;écran projeté…
    </main>
  );
}
