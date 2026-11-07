"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Compat : /e/s/[token] → /e?launch= (route /e fiable en prod). */
export default function EmargementSessionRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token ?? "");

  useEffect(() => {
    if (token) router.replace(`/e?launch=${encodeURIComponent(token)}`);
  }, [router, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] text-[#A3A8C7]">
      Ouverture de la session…
    </main>
  );
}
