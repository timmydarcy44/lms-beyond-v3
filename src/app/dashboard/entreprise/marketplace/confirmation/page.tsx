"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";

export default function MarketplaceConfirmationPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  return (
    <div className="min-h-screen bg-slate-50 pl-[260px]">
      <EnterpriseSidebar />
      <main className="mx-auto max-w-lg px-8 py-16 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Réservation en cours de confirmation</h1>
        <p className="mt-3 text-slate-600">
          Si le paiement a réussi, vous recevrez un email de confirmation sous peu.
          {sessionId ? ` (réf. ${sessionId.slice(0, 8)}…)` : ""}
        </p>
        <Link
          href="/dashboard/entreprise/marketplace"
          className="mt-8 inline-block text-violet-700 font-medium"
        >
          Retour à la marketplace →
        </Link>
      </main>
    </div>
  );
}
