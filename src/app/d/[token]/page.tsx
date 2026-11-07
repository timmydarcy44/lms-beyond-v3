"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

/** Compat : /d/[token] → /doc?token= (route /doc fiable en prod). */
function RedirectInner() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const token = String(params.token ?? "");

  useEffect(() => {
    if (!token) return;
    const accept = search.get("accept");
    const q = new URLSearchParams({ token });
    if (accept) q.set("accept", accept);
    router.replace(`/doc?${q.toString()}`);
  }, [router, search, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] text-[#A3A8C7]">
      Ouverture du document…
    </main>
  );
}

export default function PublicFormationDocumentRedirectPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0A0C1B] text-[#A3A8C7]">
          Ouverture du document…
        </main>
      }
    >
      <RedirectInner />
    </Suspense>
  );
}
