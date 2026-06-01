"use client";

import { useEffect } from "react";

export default function StripeRefreshPage() {
  useEffect(() => {
    void fetch("/api/marketplace/praticien/stripe-onboarding", { method: "POST" })
      .then((r) => r.json())
      .then((j: { url?: string }) => {
        if (j.url) window.location.href = j.url;
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <p>Reprise de la configuration Stripe…</p>
    </main>
  );
}
